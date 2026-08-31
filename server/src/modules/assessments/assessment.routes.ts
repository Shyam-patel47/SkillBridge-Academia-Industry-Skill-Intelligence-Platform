import { Router } from "express";
import { UserRole } from "@prisma/client";
import { assessmentController } from "./assessment.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import {
  submitAssessmentSchema,
  assessmentQuerySchema,
} from "./assessment.schema.js";

const router = Router();

// List all assessments (Authenticated or public)
router.get("/", validateRequest(assessmentQuerySchema), (req, res, next) =>
  assessmentController.getAssessments(req, res, next),
);

// Get assessment for active quiz session (Protected: STUDENT, SUPER_ADMIN)
router.get("/:id", authenticate, (req, res, next) =>
  assessmentController.getAssessmentForSession(req, res, next),
);

// Submit answers and compute scores (Protected: STUDENT)
router.post(
  "/:id/submit",
  authenticate,
  authorizeRoles(UserRole.STUDENT),
  validateRequest(submitAssessmentSchema),
  (req, res, next) => assessmentController.submitAssessment(req, res, next),
);

// Get assessment result (Protected: STUDENT, SUPER_ADMIN)
router.get("/:id/result", authenticate, (req, res, next) =>
  assessmentController.getResult(req, res, next),
);

export const assessmentRoutes = router;
