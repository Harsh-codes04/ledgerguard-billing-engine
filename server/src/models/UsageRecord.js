import mongoose from "mongoose";

const usageRecordSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    customerNameSnapshot: { type: String, required: true },
    planNameSnapshot: { type: String, required: true },
    unitLabelSnapshot: { type: String, required: true },
    unitPricePaiseSnapshot: { type: Number, required: true, min: 0 },
    period: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 100000000,
      validate: { validator: Number.isSafeInteger, message: "Quantity must be a whole number." },
    },
  },
  { timestamps: true }
);

usageRecordSchema.index(
  { tenantId: 1, customerId: 1, planId: 1, period: 1 },
  { unique: true }
);

export default mongoose.model("UsageRecord", usageRecordSchema);
