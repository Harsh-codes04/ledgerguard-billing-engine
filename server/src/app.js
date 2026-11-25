import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customers.js";
import healthRoutes from "./routes/healthRoutes.js";
import invoiceRoutes from "./routes/invoices.js";
import planRoutes from "./routes/plans.js";
import usageRoutes from "./routes/usage.js";

const app = express();
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "20kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/usage", usageRoutes);
app.use("/api/invoices", invoiceRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `No route found for ${req.method} ${req.path}.` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error?.code === 11000) {
    return res.status(409).json({ message: "A record with these details is already in use." });
  }
  if (error?.name === "ValidationError" || error?.name === "CastError") {
    return res.status(400).json({ message: "Some submitted information is invalid." });
  }
  const status = Number(error.status || error.statusCode) || 500;
  return res.status(status).json({
    message: status >= 500 ? "Something went wrong. Please try again." : error.message,
  });
});

export default app;
