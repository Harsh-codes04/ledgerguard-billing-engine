import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { getJwtPublicKey, JWT_AUDIENCE, JWT_ISSUER } from "../config/jwtKeys.js";
import Tenant from "../models/Tenant.js";
import User from "../models/User.js";

function readToken(req) {
  if (req.cookies?.token) return req.cookies.token;
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

export async function authMiddleware(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ message: "Sign in to continue." });
  }

  let claims;
  try {
    claims = jwt.verify(token, getJwtPublicKey(), {
      algorithms: ["RS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  } catch (error) {
    if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)) {
      return res.status(401).json({ message: "Your session is invalid or has expired. Sign in again." });
    }
    return next(error);
  }

  if (!mongoose.isValidObjectId(claims.userId) || !mongoose.isValidObjectId(claims.tenantId)) {
    return res.status(401).json({ message: "Your session is invalid. Sign in again." });
  }

  try {
    const account = await User.findOne({
      _id: claims.userId,
      tenantId: claims.tenantId,
    }).select("_id tenantId fullName email role");

    if (!account) {
      return res.status(401).json({ message: "This account is no longer available." });
    }

    const tenant = await Tenant.findOne({ _id: account.tenantId, isActive: true })
      .select("_id name slug planTier");

    if (!tenant) {
      return res.status(403).json({ message: "This workspace is inactive." });
    }

    req.user = Object.freeze({
      userId: account._id.toString(),
      tenantId: account.tenantId.toString(),
      role: account.role,
      email: account.email,
    });
    // Derive tenant scope from the authenticated account, never from request input.
    Object.defineProperty(req, "tenantId", {
      value: req.user.tenantId,
      enumerable: true,
      writable: false,
      configurable: false,
    });
    req.authUser = account;
    req.tenant = tenant;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function tenantScopedFilter(req, filters = {}) {
  if (!req.tenantId) {
    throw new Error("Tenant-scoped query attempted without authenticated tenant context.");
  }
  return { ...filters, tenantId: req.tenantId };
}
