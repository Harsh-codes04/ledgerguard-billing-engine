import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import { validateJwtKeyPair } from "./config/jwtKeys.js";

const port = Number(process.env.PORT || 4000);
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ledgerguard";

validateJwtKeyPair();

try {
  await mongoose.connect(mongoUri);
  app.listen(port, () => {
    console.log(`LedgerGuard API is running at http://localhost:${port}`);
  });
} catch (error) {
  console.error("Could not connect to MongoDB:", error.message);
  process.exit(1);
}
