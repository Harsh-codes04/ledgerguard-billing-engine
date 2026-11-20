import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.js";
import customerRoutes from "./routes/customers.js";
import planRoutes from "./routes/plans.js";
import usageRoutes from "./routes/usage.js";
import invoiceRoutes from "./routes/invoices.js";

const app = express();
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

app.disable("x-powered-by");
app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "LedgerGuard API" });
});
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/usage", usageRoutes);
app.use("/api/invoices", invoiceRoutes);

app.use((error, _req, res, _next) => {
  if (error?.code === 11000) {
    return res.status(409).json({ message: "A record with these details already exists." });
  }
  if (error?.name === "ValidationError" || error?.name === "CastError") {
    return res.status(400).json({ message: "Some submitted information is invalid." });
  }

  console.error(error);
  return res.status(500).json({ message: "Something went wrong. Please try again." });
});

export default app;
