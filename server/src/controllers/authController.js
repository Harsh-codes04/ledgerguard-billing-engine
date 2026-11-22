import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Tenant from "../models/Tenant.js";
import User from "../models/User.js";

const ROLE_NAMES = new Set(["OrgAdmin", "BillingManager", "Auditor"]);

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Set JWT_SECRET to a random secret with at least 32 characters.");
  }
  return secret;
}

function tokenExpiry() {
  return process.env.JWT_EXPIRES_IN || "7d";
}

function cookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };
}

function signAccessToken(user, secret) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      tenantId: user.tenantId.toString(),
      role: user.role,
      email: user.email,
    },
    secret,
    { expiresIn: tokenExpiry(), algorithm: "HS256" }
  );
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    tenantId: user.tenantId.toString(),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
}

function publicTenant(tenant) {
  return {
    id: tenant._id.toString(),
    name: tenant.name,
    slug: tenant.slug,
    planTier: tenant.planTier,
    isActive: tenant.isActive,
  };
}

function makeSlug(name) {
  const base = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "workspace";
  return `${base}-${randomBytes(4).toString("hex")}`;
}

async function createTenantAndAdmin(tenantData, adminData) {
  const session = await mongoose.startSession();
  try {
    let tenant;
    let admin;
    await session.withTransaction(async () => {
      [tenant] = await Tenant.create([tenantData], { session });
      [admin] = await User.create([{ ...adminData, tenantId: tenant._id }], { session });
    });
    return { tenant, admin };
  } finally {
    await session.endSession();
  }
}

function transactionUnsupported(error) {
  return error?.code === 20 || /Transaction numbers are only allowed on a replica set member or mongos/i.test(error?.message || "");
}

function validEmail(email) {
  return email.length <= 254 && /^\S+@\S+\.\S+$/.test(email);
}

function validPassword(password) {
  // bcrypt truncates inputs after 72 UTF-8 bytes, so reject longer passwords.
  return password.length >= 8 && Buffer.byteLength(password, "utf8") <= 72;
}

export async function registerTenant(req, res) {
  const secret = getJwtSecret();
  const fullName = String(req.body.fullName || "").trim();
  const tenantName = String(req.body.tenantName || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!fullName || fullName.length > 120 || !tenantName || tenantName.length > 100) {
    return res.status(400).json({ message: "Enter your name and a workspace name within the allowed length." });
  }
  if (!validEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }
  if (!validPassword(password)) {
    return res.status(400).json({ message: "Password must be at least 8 characters and no more than 72 UTF-8 bytes." });
  }
  if (await User.exists({ email })) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  let tenant;
  let admin;
  try {
    ({ tenant, admin } = await createTenantAndAdmin(
      {
        name: tenantName,
        slug: makeSlug(tenantName),
        vaultSalt: randomBytes(16).toString("hex"),
        planTier: "STARTER",
        isActive: true,
      },
      { fullName, email, passwordHash, role: "OrgAdmin" }
    ));
  } catch (error) {
    if (transactionUnsupported(error)) {
      return res.status(503).json({ message: "Workspace registration requires MongoDB Atlas or a replica-set database for atomic creation." });
    }
    throw error;
  }

  const token = signAccessToken(admin, secret);
  res.cookie("token", token, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });
  return res.status(201).json({ user: publicUser(admin), tenant: publicTenant(tenant) });
}

export async function login(req, res) {
  const secret = getJwtSecret();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!validEmail(email) || !password) {
    return res.status(400).json({ message: "Enter a valid email and password." });
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({ message: "Password cannot exceed 72 UTF-8 bytes." });
  }

  const account = await User.findOne({ email });
  if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }

  const tenant = await Tenant.findOne({ _id: account.tenantId, isActive: true });
  if (!tenant) {
    return res.status(403).json({ message: "This workspace is inactive." });
  }

  const token = signAccessToken(account, secret);
  res.cookie("token", token, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });
  return res.json({ user: publicUser(account), tenant: publicTenant(tenant) });
}

export function logout(_req, res) {
  res.clearCookie("token", cookieOptions());
  return res.json({ message: "Signed out." });
}

export function currentSession(req, res) {
  return res.json({ user: publicUser(req.authUser), tenant: publicTenant(req.tenant) });
}

export async function inviteUser(req, res) {
  const fullName = String(req.body.fullName || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const role = String(req.body.role || "");

  if (!fullName || fullName.length > 120 || !validEmail(email)) {
    return res.status(400).json({ message: "Enter a valid name and email address." });
  }
  if (!validPassword(password)) {
    return res.status(400).json({ message: "Password must be at least 8 characters and no more than 72 UTF-8 bytes." });
  }
  if (!ROLE_NAMES.has(role) || role === "OrgAdmin") {
    return res.status(400).json({ message: "Invited users can be BillingManager or Auditor." });
  }
  if (await User.exists({ email })) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    tenantId: req.tenantId,
    fullName,
    email,
    passwordHash,
    role,
  });
  return res.status(201).json({ user: publicUser(user) });
}
