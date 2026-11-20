import { Router } from "express";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Invoice from "../models/Invoice.js";
import UsageRecord from "../models/UsageRecord.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const customers = await Customer.find({ tenantId: req.user.tenantId })
    .sort({ name: 1 })
    .select("name email createdAt");
  return res.json({ customers });
});

router.post("/", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!name) {
    return res.status(400).json({ message: "Enter a customer name." });
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Enter a valid email or leave the field blank." });
  }

  const customer = await Customer.create({
    tenantId: req.user.tenantId,
    name,
    email,
  });
  return res.status(201).json({ customer });
});

router.delete("/:customerId", async (req, res) => {
  const customerId = req.params.customerId;
  if (!mongoose.isValidObjectId(customerId)) {
    return res.status(404).json({ message: "Customer was not found in this workspace." });
  }

  const hasBillingHistory = await UsageRecord.exists({
    tenantId: req.user.tenantId,
    customerId,
  });
  const hasInvoices = await Invoice.exists({
    tenantId: req.user.tenantId,
    customerId,
  });
  if (hasBillingHistory || hasInvoices) {
    return res.status(409).json({ message: "Customers with billing history cannot be removed." });
  }

  const customer = await Customer.findOneAndDelete({
    _id: req.params.customerId,
    tenantId: req.user.tenantId,
  });
  if (!customer) {
    return res.status(404).json({ message: "Customer was not found in this workspace." });
  }

  return res.json({ message: "Customer removed." });
});

export default router;
