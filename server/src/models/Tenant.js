import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
  },
  { timestamps: true }
);

export default mongoose.model("Tenant", tenantSchema);
