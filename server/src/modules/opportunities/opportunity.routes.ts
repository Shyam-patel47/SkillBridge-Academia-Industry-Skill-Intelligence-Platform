import { Router } from "express";
import { UserRole } from "@prisma/client";
import { opportunityController } from "./opportunity.controller.js";
import {
  authenticate,
  optionalAuthenticate,
} from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/role.middleware.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import {
  createOpportunitySchema,
  updateOpportunitySchema,
  togglePublishSchema,
  parseJobDescriptionSchema,
} from "./opportunity.schema.js";

const router = Router();

// AI Job Description Extraction (Protected: INDUSTRY, SUPER_ADMIN)
router.post(
  "/parse-jd",
  authenticate,
  authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
  validateRequest(parseJobDescriptionSchema),
  (req, res, next) => opportunityController.parseJobDescription(req, res, next),
);

// Student Opportunity Discovery Feed (Protected: STUDENT, SUPER_ADMIN)
router.get(
  "/feed",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  (req, res, next) => opportunityController.getStudentFeed(req, res, next),
);

// Student Single Opportunity Details with Compatibility (Protected: STUDENT, SUPER_ADMIN)
router.get(
  "/:id/student-details",
  authenticate,
  authorizeRoles(UserRole.STUDENT, UserRole.SUPER_ADMIN),
  (req, res, next) =>
    opportunityController.getStudentOpportunityDetail(req, res, next),
);

// Company's Own Postings (Protected: INDUSTRY, SUPER_ADMIN)
router.get(
  "/company/me",
  authenticate,
  authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
  (req, res, next) =>
    opportunityController.getCompanyOpportunities(req, res, next),
);

// Create Opportunity (Protected: INDUSTRY, SUPER_ADMIN)
router.post(
  "/",
  authenticate,
  authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
  validateRequest(createOpportunitySchema),
  (req, res, next) => opportunityController.createOpportunity(req, res, next),
);

// Update Opportunity (Protected: INDUSTRY, SUPER_ADMIN)
router.put(
  "/:id",
  authenticate,
  authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
  validateRequest(updateOpportunitySchema),
  (req, res, next) => opportunityController.updateOpportunity(req, res, next),
);

// Publish / Unpublish Toggle (Protected: INDUSTRY, SUPER_ADMIN)
router.patch(
  "/:id/publish",
  authenticate,
  authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
  validateRequest(togglePublishSchema),
  (req, res, next) => opportunityController.togglePublish(req, res, next),
);

// Delete Opportunity (Protected: INDUSTRY, SUPER_ADMIN)
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN),
  (req, res, next) => opportunityController.deleteOpportunity(req, res, next),
);

// Public / Student Feed & Single Detail
router.get("/", (req, res, next) =>
  opportunityController.getPublicOpportunities(req, res, next),
);
router.get("/:id", optionalAuthenticate, (req, res, next) =>
  opportunityController.getOpportunityById(req, res, next),
);

export const opportunityRoutes = router;
