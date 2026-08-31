import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { sendError } from "../utils/response.util.js";

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(
        res,
        "Authentication required before role verification.",
        401,
        "UNAUTHORIZED",
      );
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Access denied. Requires one of roles: [${allowedRoles.join(", ")}]. Current role: ${req.user.role}`,
        403,
        "FORBIDDEN",
      );
      return;
    }

    next();
  };
};
