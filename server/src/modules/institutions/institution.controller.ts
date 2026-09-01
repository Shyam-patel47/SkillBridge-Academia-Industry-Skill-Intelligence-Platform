import { Request, Response, NextFunction } from "express";
import { institutionService } from "./institution.service.js";
import { sendSuccess } from "../../utils/response.util.js";

export class InstitutionController {
  /**
   * Get institution profile
   */
  async getProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const institution = await institutionService.getProfileByUserId(userId);
      sendSuccess(
        res,
        { institution },
        "Institution profile retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get comprehensive institution analytics
   */
  async getAnalytics(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const analytics = await institutionService.getInstitutionAnalytics(
        userId,
        userRole,
      );
      sendSuccess(
        res,
        { analytics },
        "Institution analytics generated successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }
}

export const institutionController = new InstitutionController();
