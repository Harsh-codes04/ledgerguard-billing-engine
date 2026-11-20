import { Router } from "express";
import Plan from "../models/Plan.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const plans = await Plan.find({ tenantId: req.user.tenantId, active: true })
    .sort({ name: 1 })
    .select("name unitLabel unitPricePaise createdAt");
  return res.json({ plans });
});

router.post("/", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const unitLabel = String(req.body.unitLabel || "unit").trim();
  const unitPricePaise = Number(req.body.unitPricePaise);

  if (!name || !unitLabel) {
    return res.status(400).json({ message: "Enter a plan name and billing unit." });
  }
  if (name.length > 100 || unitLabel.length > 30) {
    return res.status(400).json({ message: "The plan name or billing unit is too long." });
  }
  if (!Number.isSafeInteger(unitPricePaise) || unitPricePaise < 0) {
    return res.status(400).json({ message: "Enter a valid price in paise (whole paise only)." });
  }

  const plan = await Plan.create({
    tenantId: req.user.tenantId,
    name,
    unitLabel,
    unitPricePaise,
  });
  return res.status(201).json({ plan });
});

export default router;
