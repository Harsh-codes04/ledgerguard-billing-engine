import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";

const app = express();
const port = Number(process.env.PORT || 5000);
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "20kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `No route found for ${req.method} ${req.path}.` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error?.code === 11000) {
    return res.status(409).json({ message: "That email or workspace name is already in use." });
  }
  if (error?.name === "ValidationError" || error?.name === "CastError") {
    return res.status(400).json({ message: "Some submitted information is invalid." });
  }
  const status = Number(error.status || error.statusCode) || 500;
  res.status(status).json({
    message: status >= 500 ? "An unexpected server error occurred." : error.message,
  });
});

app.listen(port, () => {
  console.log(`LedgerGuard API listening at http://localhost:${port}`);
});

// Keep the health endpoint available even when the local database is offline.
void connectDB();

export default app;
