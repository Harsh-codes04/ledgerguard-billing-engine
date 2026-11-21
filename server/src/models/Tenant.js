import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    planTier: {
      type: String,
      enum: ["STARTER", "GROWTH", "ENTERPRISE"],
      default: "STARTER",
    },
    // This salt supports future client-side PBKDF2 key derivation; it is not a key.
    vaultSalt: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Tenant", tenantSchema);
