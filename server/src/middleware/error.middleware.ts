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
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // 1. Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    sendError(
      res,
      "Request validation failed. Please check input parameters.",
      422,
      "VALIDATION_ERROR",
      formattedErrors,
    );
    return;
  }

  // 2. Handle Prisma Database Constraint & Query Errors (Sanitize database disclosures)
  if (err?.code && typeof err.code === "string" && err.code.startsWith("P")) {
    switch (err.code) {
      case "P2002": {
        const target = Array.isArray(err.meta?.target)
          ? err.meta.target.join(", ")
          : "resource";
        sendError(
          res,
          `A record with this ${target} already exists.`,
          409,
          "DUPLICATE_RESOURCE_CONFLICT",
        );
        return;
      }
      case "P2025": {
        sendError(
          res,
          "The requested resource was not found.",
          404,
          "RESOURCE_NOT_FOUND",
        );
        return;
      }
      case "P2003": {
        sendError(
          res,
          "Foreign key relation integrity failed.",
          400,
          "FOREIGN_KEY_CONSTRAINT_FAILED",
        );
        return;
      }
      default: {
        sendError(
          res,
          "Database operation failed. Please try again.",
          500,
          "DATABASE_ERROR",
        );
        return;
      }
    }
  }

  // 3. Handle JSON Body Parsing Malformed Errors
  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    sendError(
      res,
      "Malformed JSON payload in request body.",
      400,
      "INVALID_JSON_BODY",
    );
    return;
  }

  // 4. Standard Application Error Handlers
  const statusCode =
    err.statusCode ||
    (err.status && typeof err.status === "number" ? err.status : 500);
  const errorCode =
    err.code || (statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR");

  // In production, prevent raw uncaught exception details from leaking
  let message = err.message || "An unexpected error occurred.";
  if (statusCode >= 500 && config.isProduction) {
    message =
      "An unexpected internal server error occurred. Our engineers have been notified.";
  }

  const details = config.isDevelopment ? { stack: err.stack } : undefined;

  sendError(res, message, statusCode, errorCode, details);
};
