import { Router } from "express";
import { UserRole } from "@prisma/client";
import { learningController } from "./learning.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { createLearningProgramSchema } from "./learning.schema.js";

const router = Router();

// Student Tailored Learning Recommendations (Protected: STUDENT, SUPER_ADMIN)
router.get(
  "/recommendations",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  (req, res, next) => learningController.getRecommendations(req, res, next),
);

// Public / Authenticated Catalog
router.get("/", (req, res, next) =>
  learningController.getAllPrograms(req, res, next),
);
router.get("/:id", (req, res, next) =>
  learningController.getProgramById(req, res, next),
);

// Admin Program Management
router.post(
  "/",
  authenticate,
  authorizeRoles(UserRole.SUPER_ADMIN),
  validateRequest(createLearningProgramSchema),
  (req, res, next) => learningController.createProgram(req, res, next),
);

export const learningRoutes = router;
