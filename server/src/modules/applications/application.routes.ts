import { Router } from "express";
import { UserRole } from "@prisma/client";
import { applicationController } from "./application.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import {
  applyOpportunitySchema,
  updateApplicationStatusSchema,
  withdrawApplicationSchema,
  recruiterApplicantsQuerySchema,
} from "./application.schema.js";

const router = Router();

// ==========================================
// 1. Student Application Endpoints
// ==========================================

// Submit Application (Protected: STUDENT)
router.post(
  "/",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  validateRequest(applyOpportunitySchema),
  (req, res, next) => applicationController.apply(req, res, next),
);

// List Student's Own Applications (Protected: STUDENT)
router.get(
  "/me",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  (req, res, next) =>
    applicationController.getStudentApplications(req, res, next),
);

// Get Student's Single Application Detail (Protected: STUDENT)
router.get(
  "/me/:id",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  (req, res, next) =>
    applicationController.getStudentApplicationDetail(req, res, next),
);

// Withdraw Application (Protected: STUDENT)
router.post(
  "/:id/withdraw",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  validateRequest(withdrawApplicationSchema),
  (req, res, next) => applicationController.withdrawApplication(req, res, next),
);

// ==========================================
// 2. Recruiter / Company Endpoints
// ==========================================

// List Applicants for Company (Protected: INDUSTRY, SUPER_ADMIN)
router.get(
  "/recruiter",
  authenticate,
  authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
  validateRequest(recruiterApplicantsQuerySchema),
  (req, res, next) =>
    applicationController.getRecruiterApplications(req, res, next),
);

// Get Candidate Application Dossier (Protected: INDUSTRY, SUPER_ADMIN)
router.get(
  "/recruiter/:id",
  authenticate,
  authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
  (req, res, next) =>
    applicationController.getRecruiterApplicationDetail(req, res, next),
);

// Update Candidate Pipeline Status (Protected: INDUSTRY, SUPER_ADMIN)
router.patch(
  "/recruiter/:id/status",
  authenticate,
  authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
  validateRequest(updateApplicationStatusSchema),
  (req, res, next) =>
    applicationController.updateApplicationStatus(req, res, next),
);

export const applicationRoutes = router;
