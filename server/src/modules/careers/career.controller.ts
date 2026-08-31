import { Request, Response, NextFunction } from "express";
import { careerService } from "./career.service.js";
import { sendSuccess } from "../../utils/response.util.js";

export class CareerController {
  async getRecommendations(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const recommendations =
        await careerService.getRecommendationsForStudent(userId);
      sendSuccess(
        res,
        { recommendations, count: recommendations.length },
        "Career recommendations calculated successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getGapAnalysis(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const idOrSlug = req.params.id as string;
      const analysis = await careerService.getCareerRoleGapAnalysis(
        userId,
        idOrSlug,
      );
      sendSuccess(
        res,
        { analysis },
        "Career skill gap analysis generated successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getAllCareerRoles(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { category, search } = req.query as {
        category?: string;
        search?: string;
      };
      const roles = await careerService.getAllCareerRoles(category, search);
      sendSuccess(
        res,
        { roles, count: roles.length },
        "Career roles retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getCareerRoleById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idOrSlug = req.params.id as string;
      const role = await careerService.getCareerRoleById(idOrSlug);
      sendSuccess(res, { role }, "Career role retrieved successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  async createCareerRole(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const adminUserId = req.user!.id;
      const created = await careerService.createCareerRole(
        req.body,
        adminUserId,
      );
      sendSuccess(
        res,
        { role: created },
        "Career role created successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async updateCareerRole(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const adminUserId = req.user!.id;
      const id = req.params.id as string;
      const updated = await careerService.updateCareerRole(
        id,
        req.body,
        adminUserId,
      );
      sendSuccess(
        res,
        { role: updated },
        "Career role updated successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteCareerRole(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const adminUserId = req.user!.id;
      const id = req.params.id as string;
      const result = await careerService.deleteCareerRole(id, adminUserId);
      sendSuccess(res, result, "Career role deleted successfully", 200);
    } catch (error) {
      next(error);
    }
  }
}

export const careerController = new CareerController();
