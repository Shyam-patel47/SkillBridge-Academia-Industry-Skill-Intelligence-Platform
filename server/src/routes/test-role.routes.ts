import { Router, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { sendSuccess } from "../utils/response.util.js";

const router = Router();

// Student-only test route
router.get(
  "/student-only",
  authenticate,
  authorizeRoles(UserRole.STUDENT),
  (req: Request, res: Response) => {
    sendSuccess(res, { message: "Welcome Student!", user: req.user });
  },
);

// Industry-only test route
router.get(
  "/industry-only",
  authenticate,
  authorizeRoles(UserRole.INDUSTRY),
  (req: Request, res: Response) => {
    sendSuccess(res, { message: "Welcome Recruiter!", user: req.user });
  },
);

// Admin-only test route
router.get(
  "/admin-only",
  authenticate,
  authorizeRoles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN),
  (req: Request, res: Response) => {
    sendSuccess(res, { message: "Welcome Admin!", user: req.user });
  },
);

export const testRoleRoutes = router;
