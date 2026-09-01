import { Request, Response, NextFunction } from "express";
import { opportunityService } from "./opportunity.service.js";
import { sendSuccess } from "../../utils/response.util.js";

export class OpportunityController {
  async getCompanyOpportunities(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { status, search, type } = req.query as {
        status?: string;
        search?: string;
        type?: string;
      };
      const opportunities = await opportunityService.getCompanyOpportunities(
        userId,
        { status, search, type },
      );
      sendSuccess(
        res,
        { opportunities, count: opportunities.length },
        "Company opportunities retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getStudentFeed(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const {
        search,
        type,
        skillId,
        location,
        workMode,
        eligibilityOnly,
        sortBy,
      } = req.query as {
        search?: string;
        type?: string;
        skillId?: string;
        location?: string;
        workMode?: string;
        eligibilityOnly?: string;
        sortBy?: "match" | "recent" | "deadline";
      };

      const result = await opportunityService.getStudentOpportunityFeed(
        userId,
        {
          search,
          type,
          skillId,
          location,
          workMode,
          eligibilityOnly: eligibilityOnly === "true",
          sortBy,
        },
      );

      sendSuccess(
        res,
        result,
        "Student opportunity discovery feed retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getStudentOpportunityDetail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idOrSlug = req.params.id as string;
      const userId = req.user!.id;
      const opportunity = await opportunityService.getStudentOpportunityDetail(
        idOrSlug,
        userId,
      );
      sendSuccess(
        res,
        { opportunity },
        "Opportunity details and compatibility retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async getOpportunityById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const idOrSlug = req.params.id as string;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const opportunity = await opportunityService.getOpportunityById(
        idOrSlug,
        userId,
        userRole,
      );
      sendSuccess(
        res,
        { opportunity },
        "Opportunity details retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async createOpportunity(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const opportunity = await opportunityService.createOpportunity(
        userId,
        req.body,
      );
      sendSuccess(
        res,
        { opportunity },
        "Opportunity created successfully",
        201,
      );
    } catch (error) {
      next(error);
    }
  }

  async updateOpportunity(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const updated = await opportunityService.updateOpportunity(
        id,
        userId,
        userRole,
        req.body,
      );
      sendSuccess(
        res,
        { opportunity: updated },
        "Opportunity updated successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async togglePublish(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const { isActive } = req.body;
      const updated = await opportunityService.togglePublish(
        id,
        userId,
        userRole,
        isActive,
      );
      sendSuccess(
        res,
        { opportunity: updated },
        `Opportunity ${isActive ? "published" : "unpublished"} successfully`,
        200,
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteOpportunity(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const result = await opportunityService.deleteOpportunity(
        id,
        userId,
        userRole,
      );
      sendSuccess(res, result, "Opportunity deleted successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  async getPublicOpportunities(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { search, type, workMode, location } = req.query as {
        search?: string;
        type?: string;
        workMode?: string;
        location?: string;
      };
      const opportunities = await opportunityService.getPublicOpportunities({
        search,
        type,
        workMode,
        location,
      });
      sendSuccess(
        res,
        { opportunities, count: opportunities.length },
        "Public opportunities retrieved successfully",
        200,
      );
    } catch (error) {
      next(error);
    }
  }
}

export const opportunityController = new OpportunityController();
