import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Tenant from "../models/Tenant.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

function makeToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "12h" });
}

async function accountResponse(user) {
  const tenant = await Tenant.findById(user.tenantId).select("name");
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      workspaceName: tenant?.name || "Workspace",
    },
  };
}

router.post("/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const workspaceName = String(req.body.workspaceName || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !workspaceName || !email || !password) {
    return res.status(400).json({ message: "Fill in every field." });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({ message: "Use a password between 8 and 72 bytes." });
  }
  if (await User.exists({ email })) {
    return res.status(409).json({ message: "An account with that email already exists." });
  }

  const tenant = await Tenant.create({ name: workspaceName });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      tenantId: tenant.id,
      name,
      email,
      passwordHash,
      role: "owner",
    });
    return res.status(201).json({ token: makeToken(user), ...(await accountResponse(user)) });
  } catch (error) {
    await Tenant.findByIdAndDelete(tenant.id);
    throw error;
  }
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }

  return res.json({ token: makeToken(user), ...(await accountResponse(user)) });
});

router.get("/me", requireAuth, async (req, res) => {
  return res.json(await accountResponse(req.user));
});

export default router;
