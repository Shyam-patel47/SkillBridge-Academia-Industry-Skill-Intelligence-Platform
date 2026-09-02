import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const isProduction = process.env.NODE_ENV === "production";
const isDevelopment =
  process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

const accessSecret =
  process.env.JWT_ACCESS_SECRET || "dev-access-secret-key-1234567890-secure";
const refreshSecret =
  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-key-1234567890-secure";

// Production Security Guard: Fail fast if insecure JWT secrets are configured in production
if (isProduction) {
  if (accessSecret.includes("dev-") || accessSecret.length < 32) {
    throw new Error(
      "FATAL SECURITY ERROR: Insecure JWT_ACCESS_SECRET detected in production. Secret must be at least 32 characters long.",
    );
  }
  if (refreshSecret.includes("dev-") || refreshSecret.length < 32) {
    throw new Error(
      "FATAL SECURITY ERROR: Insecure JWT_REFRESH_SECRET detected in production. Secret must be at least 32 characters long.",
    );
  }
}

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwt: {
    accessSecret,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshSecret,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  databaseUrl: process.env.DATABASE_URL || "",
  isProduction,
  isDevelopment,
};
