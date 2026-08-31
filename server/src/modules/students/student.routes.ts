import { Router } from "express";
import { UserRole } from "@prisma/client";
import { studentController } from "./student.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { updateStudentProfileSchema } from "./student.schema.js";

const router = Router();

// Current Student Profile (Read)
router.get(
  "/me",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  (req, res, next) => studentController.getMe(req, res, next),
);

// Current Student Skills Breakdown & Verified Evidence
router.get(
  "/me/skills",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  (req, res, next) => studentController.getMySkills(req, res, next),
);

// Current Student Skill Advancement & Assessment History
router.get(
  "/me/skill-history",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  (req, res, next) => studentController.getMySkillHistory(req, res, next),
);

// Current Student Profile (Update)
router.put(
  "/me",
  authenticate,
  authorizeRoles(UserRole.STUDENT),
  validateRequest(updateStudentProfileSchema),
  (req, res, next) => studentController.updateMe(req, res, next),
);

// Public / Recruiter / Admin Student Profile (Read-only by ID)
router.get("/:id", authenticate, (req, res, next) =>
  studentController.getById(req, res, next),
);

export const studentRoutes = router;
