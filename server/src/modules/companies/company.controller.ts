import { Request, Response, NextFunction } from "express";
import { companyService } from "./company.service.js";
import { sendSuccess } from "../../utils/response.util.js";

export class CompanyController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const company = await companyService.getProfileByUserId(userId);
      sendSuccess(
        res,
        { company },
        "Company profile retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async updateMe(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const updated = await companyService.updateProfileByUserId(
        userId,
        req.body,
      );
      sendSuccess(
        res,
        { company: updated },
        "Company profile updated successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getDashboardMetrics(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const dashboard = await companyService.getDashboardMetrics(userId);
      sendSuccess(
        res,
        dashboard,
        "Company dashboard metrics retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }
}

export const companyController = new CompanyController();
