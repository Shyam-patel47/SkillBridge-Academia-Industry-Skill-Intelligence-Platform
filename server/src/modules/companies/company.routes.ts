import { Router } from "express";
import { UserRole } from "@prisma/client";
import { companyController } from "./company.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { updateCompanyProfileSchema } from "./company.schema.js";

const router = Router();

// Current Company Profile (Read)
router.get(
  "/me",
  authenticate,
  authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
  (req, res, next) => companyController.getMe(req, res, next),
);

// Current Company Profile (Update)
router.put(
  "/me",
  authenticate,
  authorizeRoles(UserRole.INDUSTRY),
  validateRequest(updateCompanyProfileSchema),
  (req, res, next) => companyController.updateMe(req, res, next),
);

// Current Company Dashboard Metrics
router.get(
  "/me/dashboard",
  authenticate,
  authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
  (req, res, next) => companyController.getDashboardMetrics(req, res, next),
);

export const companyRoutes = router;
