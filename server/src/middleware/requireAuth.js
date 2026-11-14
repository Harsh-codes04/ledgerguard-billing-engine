import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  const authorization = req.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Sign in to continue." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("name email tenantId role");
    if (!user) {
      return res.status(401).json({ message: "This account is no longer available." });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Your session expired. Please sign in again." });
  }
}
