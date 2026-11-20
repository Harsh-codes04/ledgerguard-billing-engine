import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    unitLabel: { type: String, required: true, trim: true, maxlength: 30, default: "unit" },
    unitPricePaise: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isSafeInteger, message: "Price must be a whole number of paise." },
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

planSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export default mongoose.model("Plan", planSchema);
