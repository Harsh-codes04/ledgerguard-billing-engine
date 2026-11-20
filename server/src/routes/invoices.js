import { Router } from "express";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Invoice from "../models/Invoice.js";
import UsageRecord from "../models/UsageRecord.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

function validPeriod(period) {
  return typeof period === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
}

router.get("/", async (req, res) => {
  const invoices = await Invoice.find({ tenantId: req.user.tenantId })
    .sort({ createdAt: -1 })
    .select("customerId customerNameSnapshot period lineItems totalPaise status createdAt");
  return res.json({ invoices });
});

router.post("/", async (req, res) => {
  const { customerId, period } = req.body;
  if (!mongoose.isValidObjectId(customerId)) {
    return res.status(400).json({ message: "Choose a valid customer." });
  }
  if (!validPeriod(period)) {
    return res.status(400).json({ message: "Choose a billing month in YYYY-MM format." });
  }

  const tenantId = req.user.tenantId;
  const customer = await Customer.findOne({ _id: customerId, tenantId });
  if (!customer) {
    return res.status(404).json({ message: "Customer was not found in this workspace." });
  }

  const usageRecords = await UsageRecord.find({ tenantId, customerId, period }).sort({ createdAt: 1 });
  if (usageRecords.length === 0) {
    return res.status(400).json({ message: "Add at least one usage item for this customer and month first." });
  }

  const lineItems = usageRecords.map((record) => {
    const lineTotalPaise = record.quantity * record.unitPricePaiseSnapshot;
    return {
      planId: record.planId,
      description: record.planNameSnapshot,
      quantity: record.quantity,
      unitLabel: record.unitLabelSnapshot,
      unitPricePaise: record.unitPricePaiseSnapshot,
      lineTotalPaise,
    };
  });
  const totalPaise = lineItems.reduce((sum, line) => sum + line.lineTotalPaise, 0);
  if (lineItems.some((line) => !Number.isSafeInteger(line.lineTotalPaise)) || !Number.isSafeInteger(totalPaise)) {
    return res.status(400).json({ message: "The invoice total is too large to calculate safely." });
  }

  const invoice = await Invoice.create({
    tenantId,
    customerId,
    customerNameSnapshot: customer.name,
    period,
    lineItems,
    totalPaise,
    status: "draft",
  });
  return res.status(201).json({ invoice });
});

router.patch("/:invoiceId/status", async (req, res) => {
  const { invoiceId } = req.params;
  const nextStatus = String(req.body.status || "");
  if (!mongoose.isValidObjectId(invoiceId)) {
    return res.status(404).json({ message: "Invoice was not found in this workspace." });
  }

  const invoice = await Invoice.findOne({ _id: invoiceId, tenantId: req.user.tenantId });
  if (!invoice) {
    return res.status(404).json({ message: "Invoice was not found in this workspace." });
  }

  const allowedNextStatus = { draft: "sent", sent: "paid" }[invoice.status];
  if (nextStatus !== allowedNextStatus) {
    return res.status(409).json({ message: "Invoices must move from draft to sent, then from sent to paid." });
  }

  invoice.status = nextStatus;
  await invoice.save();
  return res.json({ invoice });
});

export default router;
