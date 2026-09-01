import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { sendError } from "../utils/response.util.js";

export const validateRequest = (schema: AnyZodObject) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if (validated.body !== undefined) req.body = validated.body;
      if (validated.query !== undefined) req.query = validated.query;
      if (validated.params !== undefined) req.params = validated.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((e) => ({
          field: e.path
            .filter((p) => p !== "body" && p !== "query" && p !== "params")
            .join("."),
          message: e.message,
        }));
        sendError(
          res,
          "Input validation failed",
          422,
          "VALIDATION_ERROR",
          formattedErrors,
        );
        return;
      }
      next(error);
    }
  };
};
