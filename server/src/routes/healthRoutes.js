import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (_req, res) => {
  return res.json({
    status: "ok",
    service: "LedgerGuard Zero-Knowledge Billing Engine",
    dbConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
  });
});

export default router;
