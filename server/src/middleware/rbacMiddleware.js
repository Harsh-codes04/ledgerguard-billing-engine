const VALID_ROLES = new Set(["OrgAdmin", "BillingManager", "Auditor"]);

export function authorizeRoles(...allowedRoles) {
  const allowed = new Set(allowedRoles);
  const invalidRole = [...allowed].find((role) => !VALID_ROLES.has(role));
  if (invalidRole) {
    throw new Error(`Unknown role configured in route: ${invalidRole}`);
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Sign in to continue." });
    }
    if (!allowed.has(req.user.role)) {
      return res.status(403).json({ message: "Your workspace role cannot perform this action." });
    }
    return next();
  };
}
