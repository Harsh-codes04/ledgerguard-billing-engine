import "dotenv/config";
import { connectDB } from "./config/db.js";
import app from "./app.js";

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  console.log(`LedgerGuard API listening on port ${port}`);
});

void connectDB();

export default app;
