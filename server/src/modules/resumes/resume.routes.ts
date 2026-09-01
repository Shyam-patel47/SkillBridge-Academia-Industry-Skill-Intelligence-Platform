import { Router } from "express";
import { UserRole } from "@prisma/client";
import { resumeController } from "./resume.controller.js";
import { uploadResumeFile } from "./resume-upload.middleware.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { confirmExtractedSkillsSchema } from "./resume.schema.js";

const router = Router();

// ==========================================
// AI Resume Skill Extraction (Protected: STUDENT)
// ==========================================

router.post(
  "/extract",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  uploadResumeFile,
  (req, res, next) => resumeController.extractSkills(req, res, next),
);

router.post(
  "/confirm-skills",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  validateRequest(confirmExtractedSkillsSchema),
  (req, res, next) => resumeController.confirmSkills(req, res, next),
);

export const resumeRoutes = router;
