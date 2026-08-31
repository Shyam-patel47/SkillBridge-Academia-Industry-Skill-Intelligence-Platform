import { Router } from "express";
import { UserRole } from "@prisma/client";
import { careerController } from "./career.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import {
  createCareerRoleSchema,
  updateCareerRoleSchema,
} from "./career.schema.js";

const router = Router();

// Student Career Recommendation Engine & Gap Matrix
router.get(
  "/recommendations",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  (req, res, next) => careerController.getRecommendations(req, res, next),
);

router.get(
  "/:id/gap-analysis",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  (req, res, next) => careerController.getGapAnalysis(req, res, next),
);

// Public / Authenticated Career Roles Directory
router.get("/", (req, res, next) =>
  careerController.getAllCareerRoles(req, res, next),
);
router.get("/:id", (req, res, next) =>
  careerController.getCareerRoleById(req, res, next),
);

// Admin Management
router.post(
  "/",
  authenticate,
  authorizeRoles(UserRole.SUPER_ADMIN),
  validateRequest(createCareerRoleSchema),
  (req, res, next) => careerController.createCareerRole(req, res, next),
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles(UserRole.SUPER_ADMIN),
  validateRequest(updateCareerRoleSchema),
  (req, res, next) => careerController.updateCareerRole(req, res, next),
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles(UserRole.SUPER_ADMIN),
  (req, res, next) => careerController.deleteCareerRole(req, res, next),
);

export const careerRoutes = router;
