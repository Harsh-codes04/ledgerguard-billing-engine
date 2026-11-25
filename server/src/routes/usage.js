import { Router } from "express";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Invoice from "../models/Invoice.js";
import Plan from "../models/Plan.js";
import UsageRecord from "../models/UsageRecord.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();
router.use(authMiddleware);

function validPeriod(period) {
  return typeof period === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
}

router.get("/", async (req, res) => {
  const filter = { tenantId: req.user.tenantId };
  if (req.query.period) {
    if (!validPeriod(req.query.period)) {
      return res.status(400).json({ message: "Choose a billing month in YYYY-MM format." });
    }
    filter.period = req.query.period;
  }

  const usageRecords = await UsageRecord.find(filter).sort({ period: -1, createdAt: -1 });
  return res.json({ usageRecords });
});

router.post("/", async (req, res) => {
  const { customerId, planId, period } = req.body;
  const quantity = Number(req.body.quantity);

  if (!mongoose.isValidObjectId(customerId) || !mongoose.isValidObjectId(planId)) {
    return res.status(400).json({ message: "Choose a valid customer and plan." });
  }
  if (!validPeriod(period)) {
    return res.status(400).json({ message: "Choose a billing month in YYYY-MM format." });
  }
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100000000) {
    return res.status(400).json({ message: "Quantity must be a whole number greater than zero." });
  }

  const tenantId = req.user.tenantId;
  const [customer, plan] = await Promise.all([
    Customer.findOne({ _id: customerId, tenantId }),
    Plan.findOne({ _id: planId, tenantId, active: true }),
  ]);
  if (!customer) {
    return res.status(404).json({ message: "Customer was not found in this workspace." });
  }
  if (!plan) {
    return res.status(404).json({ message: "Plan was not found in this workspace." });
  }

  const invoiceExists = await Invoice.exists({ tenantId, customerId, period });
  if (invoiceExists) {
    return res.status(409).json({ message: "This billing period is locked because an invoice has already been generated." });
  }

  const usageRecord = await UsageRecord.create({
    tenantId,
    customerId,
    planId,
    customerNameSnapshot: customer.name,
    planNameSnapshot: plan.name,
    unitLabelSnapshot: plan.unitLabel,
    unitPricePaiseSnapshot: plan.unitPricePaise,
    period,
    quantity,
  });
  return res.status(201).json({ usageRecord });
});

router.delete("/:usageId", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.usageId)) {
    return res.status(404).json({ message: "Usage record was not found in this workspace." });
  }

  const record = await UsageRecord.findOne({ _id: req.params.usageId, tenantId: req.user.tenantId });
  if (!record) {
    return res.status(404).json({ message: "Usage record was not found in this workspace." });
  }

  const invoiceExists = await Invoice.exists({
    tenantId: req.user.tenantId,
    customerId: record.customerId,
    period: record.period,
  });
  if (invoiceExists) {
    return res.status(409).json({ message: "Usage cannot be changed after an invoice is generated." });
  }

  await record.deleteOne();
  return res.json({ message: "Usage record removed." });
});

export default router;
