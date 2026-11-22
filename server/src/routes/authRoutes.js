import { Router } from "express";
import {
  currentSession,
  inviteUser,
  login,
  logout,
  registerTenant,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/rbacMiddleware.js";

const router = Router();

router.post("/register-tenant", registerTenant);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware, currentSession);
router.post("/invite", authMiddleware, authorizeRoles("OrgAdmin"), inviteUser);

export default router;
