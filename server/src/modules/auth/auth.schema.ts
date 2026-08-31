import { z } from "zod";
import { UserRole } from "@prisma/client";

export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Please provide a valid email address")
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password cannot exceed 100 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    role: z
      .nativeEnum(UserRole, {
        errorMap: () => ({
          message:
            "Role must be STUDENT, INDUSTRY, INSTITUTION_ADMIN, or SUPER_ADMIN",
        }),
      })
      .default(UserRole.STUDENT),
    // Optional role-specific initial fields
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .optional(),
    companyName: z
      .string()
      .min(2, "Company name must be at least 2 characters")
      .optional(),
    institutionName: z
      .string()
      .min(2, "Institution name must be at least 2 characters")
      .optional(),
    institutionCode: z
      .string()
      .min(2, "Institution code must be at least 2 characters")
      .optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Please provide a valid email address")
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: "Refresh token is required" }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>["body"];
