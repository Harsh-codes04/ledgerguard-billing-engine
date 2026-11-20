import mongoose from "mongoose";

const invoiceLineSchema = new mongoose.Schema(
  {
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitLabel: { type: String, required: true },
    unitPricePaise: { type: Number, required: true, min: 0 },
    lineTotalPaise: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    customerNameSnapshot: { type: String, required: true },
    period: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    lineItems: { type: [invoiceLineSchema], required: true },
    totalPaise: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["draft", "sent", "paid"], default: "draft" },
  },
  { timestamps: true }
);

invoiceSchema.index({ tenantId: 1, customerId: 1, period: 1 }, { unique: true });

export default mongoose.model("Invoice", invoiceSchema);
