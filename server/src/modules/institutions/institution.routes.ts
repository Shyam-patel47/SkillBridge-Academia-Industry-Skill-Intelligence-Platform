import { Router } from "express";
import { UserRole } from "@prisma/client";
import { institutionController } from "./institution.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";

const router = Router();

// ==========================================
// Institution Endpoints (Protected: INSTITUTION_ADMIN & SUPER_ADMIN)
// ==========================================

router.get(
  "/me",
  authenticate,
  authorizeRoles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN),
  (req, res, next) => institutionController.getProfile(req, res, next),
);

router.get(
  "/analytics",
  authenticate,
  authorizeRoles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN),
  (req, res, next) => institutionController.getAnalytics(req, res, next),
);

export const institutionRoutes = router;
