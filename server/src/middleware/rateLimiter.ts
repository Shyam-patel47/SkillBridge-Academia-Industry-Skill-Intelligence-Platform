import rateLimit from "express-rate-limit";
import { sendError } from "../utils/response.util.js";

/**
 * Authentication rate limiter: Protects against credential stuffing & brute-force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 auth requests per 15m window per IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (_req, res) => {
    sendError(
      res,
      "Too many authentication attempts from this IP. Please try again in 15 minutes.",
      429,
      "AUTH_RATE_LIMIT_EXCEEDED",
    );
  },
});

/**
 * AI Service rate limiter: Protects against compute exhaustion and API budget depletion
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Max 20 AI extraction requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      "Too many AI processing requests. Please wait a moment before trying again.",
      429,
      "AI_RATE_LIMIT_EXCEEDED",
    );
  },
});

/**
 * General API rate limiter: Broad DDoS and resource abuse protection
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Max 1000 API requests per 15m window per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      "Too many requests received from this client. Please slow down.",
      429,
      "API_RATE_LIMIT_EXCEEDED",
    );
  },
});
