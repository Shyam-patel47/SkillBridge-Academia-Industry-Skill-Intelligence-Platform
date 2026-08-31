import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { sendError } from "../utils/response.util.js";
import { config } from "../config/index.js";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    sendError(
      res,
      "Validation error",
      422,
      "VALIDATION_ERROR",
      formattedErrors,
    );
    return;
  }

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "An unexpected error occurred";
  const details = config.isDevelopment ? { stack: err.stack } : undefined;

  sendError(res, message, statusCode, errorCode, details);
};
