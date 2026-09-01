import { Request, Response, NextFunction } from "express";
import { portfolioService } from "./portfolio.service.js";
import { sendSuccess } from "../../utils/response.util.js";

export class PortfolioController {
  /**
   * Student: Get My Portfolio Studio Data
   */
  async getMyPortfolio(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const portfolio = await portfolioService.getMyPortfolio(userId);
      sendSuccess(
        res,
        { portfolio },
        "Student portfolio retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Student: Update Portfolio Settings (Public/Private, Custom Slug, Bio)
   */
  async updatePortfolioSettings(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const settings = await portfolioService.updatePortfolioSettings(
        userId,
        req.body,
      );
      sendSuccess(
        res,
        { settings },
        "Portfolio settings updated successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public: View Student Portfolio by Custom Slug or Student ID
   */
  async getPublicPortfolio(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const slug = req.params.slug as string;
      const portfolio = await portfolioService.getPublicPortfolioBySlug(slug);
      sendSuccess(
        res,
        { portfolio },
        "Public portfolio retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Projects Endpoints
  // ==========================================

  async addProject(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const project = await portfolioService.addProject(userId, req.body);
      sendSuccess(res, { project }, "Project added successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async updateProject(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const projectId = req.params.id as string;
      const project = await portfolioService.updateProject(
        userId,
        projectId,
        req.body,
      );
      sendSuccess(res, { project }, "Project updated successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const projectId = req.params.id as string;
      const result = await portfolioService.deleteProject(userId, projectId);
      sendSuccess(res, result, "Project deleted successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Certifications Endpoints
  // ==========================================

  async addCertification(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const certification = await portfolioService.addCertification(
        userId,
        req.body,
      );
      sendSuccess(
        res,
        { certification },
        "Certification added successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async updateCertification(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const certId = req.params.id as string;
      const certification = await portfolioService.updateCertification(
        userId,
        certId,
        req.body,
      );
      sendSuccess(
        res,
        { certification },
        "Certification updated successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteCertification(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const certId = req.params.id as string;
      const result = await portfolioService.deleteCertification(userId, certId);
      sendSuccess(res, result, "Certification deleted successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Achievements Endpoints
  // ==========================================

  async addAchievement(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const achievement = await portfolioService.addAchievement(
        userId,
        req.body,
      );
      sendSuccess(res, { achievement }, "Achievement added successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async updateAchievement(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const achievementId = req.params.id as string;
      const achievement = await portfolioService.updateAchievement(
        userId,
        achievementId,
        req.body,
      );
      sendSuccess(
        res,
        { achievement },
        "Achievement updated successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteAchievement(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const achievementId = req.params.id as string;
      const result = await portfolioService.deleteAchievement(
        userId,
        achievementId,
      );
      sendSuccess(res, result, "Achievement deleted successfully", 200);
    } catch (error) {
      next(error);
    }
  }
}

export const portfolioController = new PortfolioController();
