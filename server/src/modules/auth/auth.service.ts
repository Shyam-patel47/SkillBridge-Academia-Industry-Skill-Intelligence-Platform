import bcrypt from "bcryptjs";
import { UserRole, AuditAction } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import {
  generateAccessToken,
  generateRefreshTokenString,
  hashToken,
} from "../../utils/token.util.js";
import { RegisterInput, LoginInput } from "./auth.schema.js";
import { AppError } from "../../middleware/error.middleware.js";
import { AuthUserPayload } from "../../types/auth.types.js";

export class AuthService {
  /**
   * Register a new user with role-specific profile & initial credentials
   */
  async register(input: RegisterInput, ipAddress?: string, userAgent?: string) {
    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      const error: AppError = new Error(
        "An account with this email address already exists.",
      );
      error.statusCode = 409;
      error.code = "EMAIL_ALREADY_EXISTS";
      throw error;
    }

    // 2. Hash password with bcrypt
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    // 3. Create user and linked role profile inside a database transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: input.role,
          isVerified: input.role === UserRole.SUPER_ADMIN, // SuperAdmin pre-verified if needed
        },
      });

      // Role-specific profile initialization
      if (input.role === UserRole.STUDENT) {
        await tx.student.create({
          data: {
            userId: newUser.id,
            fullName: input.fullName || input.email.split("@")[0],
          },
        });
      } else if (input.role === UserRole.INDUSTRY) {
        await tx.company.create({
          data: {
            userId: newUser.id,
            companyName:
              input.companyName || `${input.email.split("@")[0]} Org`,
          },
        });
      } else if (input.role === UserRole.INSTITUTION_ADMIN) {
        const code =
          input.institutionCode || `INST-${Date.now().toString().slice(-4)}`;
        await tx.institution.create({
          data: {
            userId: newUser.id,
            institutionName:
              input.institutionName || `${input.email.split("@")[0]} College`,
            code,
          },
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          action: AuditAction.CREATE,
          entityType: "User",
          entityId: newUser.id,
          details: { role: input.role, email: input.email },
          ipAddress,
          userAgent,
        },
      });

      return newUser;
    });

    // 4. Generate Auth Tokens
    const tokenPayload: AuthUserPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshTokenString = generateRefreshTokenString();
    const tokenHash = hashToken(refreshTokenString);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // 5. Fetch complete user object with profile
    const fullUser = await this.getCurrentUser(user.id);

    return {
      user: fullUser,
      tokens: {
        accessToken,
        refreshToken: refreshTokenString,
        expiresIn: "15m",
      },
    };
  }

  /**
   * Authenticate user credentials & issue fresh tokens
   */
  async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    // 1. Locate user
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      const error: AppError = new Error("Invalid email or password.");
      error.statusCode = 401;
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    // 2. Check account status
    if (!user.isActive) {
      const error: AppError = new Error(
        "Your account has been deactivated. Please contact support.",
      );
      error.statusCode = 403;
      error.code = "ACCOUNT_DEACTIVATED";
      throw error;
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      const error: AppError = new Error("Invalid email or password.");
      error.statusCode = 401;
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    // 4. Record Login in AuditLog
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.LOGIN,
        entityType: "User",
        entityId: user.id,
        details: { email: user.email, role: user.role },
        ipAddress,
        userAgent,
      },
    });

    // 5. Issue Tokens
    const tokenPayload: AuthUserPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshTokenString = generateRefreshTokenString();
    const tokenHash = hashToken(refreshTokenString);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const fullUser = await this.getCurrentUser(user.id);

    return {
      user: fullUser,
      tokens: {
        accessToken,
        refreshToken: refreshTokenString,
        expiresIn: "15m",
      },
    };
  }

  /**
   * Secure Refresh Token Rotation with automatic reuse detection
   */
  async refresh(refreshTokenString: string) {
    if (!refreshTokenString) {
      const error: AppError = new Error("Refresh token is required.");
      error.statusCode = 400;
      error.code = "MISSING_REFRESH_TOKEN";
      throw error;
    }

    const tokenHash = hashToken(refreshTokenString);

    // Find token in DB
    const existingToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existingToken) {
      const error: AppError = new Error("Invalid refresh token.");
      error.statusCode = 401;
      error.code = "INVALID_REFRESH_TOKEN";
      throw error;
    }

    // Reuse detection: If token was already revoked, someone is trying to reuse an old token!
    // Invalidate ALL tokens for this user as a security protection.
    if (existingToken.isRevoked) {
      await prisma.refreshToken.updateMany({
        where: { userId: existingToken.userId },
        data: { isRevoked: true },
      });

      const error: AppError = new Error(
        "Security alert: Refresh token reuse detected. All sessions revoked.",
      );
      error.statusCode = 401;
      error.code = "TOKEN_REUSE_DETECTED";
      throw error;
    }

    // Check expiration
    if (new Date() > existingToken.expiresAt) {
      await prisma.refreshToken.update({
        where: { id: existingToken.id },
        data: { isRevoked: true },
      });

      const error: AppError = new Error(
        "Refresh token has expired. Please login again.",
      );
      error.statusCode = 401;
      error.code = "REFRESH_TOKEN_EXPIRED";
      throw error;
    }

    // Check if user is still active
    if (!existingToken.user.isActive) {
      const error: AppError = new Error("Account is inactive.");
      error.statusCode = 403;
      error.code = "ACCOUNT_INACTIVE";
      throw error;
    }

    // Generate new token pair
    const newRefreshTokenString = generateRefreshTokenString();
    const newTokenHash = hashToken(newRefreshTokenString);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Rotate: Revoke the used token and create new one atomically
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: existingToken.id },
        data: {
          isRevoked: true,
          replacedByToken: newTokenHash,
        },
      }),
      prisma.refreshToken.create({
        data: {
          userId: existingToken.userId,
          tokenHash: newTokenHash,
          expiresAt: newExpiresAt,
        },
      }),
    ]);

    const tokenPayload: AuthUserPayload = {
      id: existingToken.user.id,
      email: existingToken.user.email,
      role: existingToken.user.role,
      isVerified: existingToken.user.isVerified,
    };

    const newAccessToken = generateAccessToken(tokenPayload);

    return {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshTokenString,
        expiresIn: "15m",
      },
    };
  }

  /**
   * Logout user by revoking the specified refresh token
   */
  async logout(refreshTokenString?: string, userId?: string) {
    if (refreshTokenString) {
      const tokenHash = hashToken(refreshTokenString);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    }

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          entityType: "User",
          entityId: userId,
          details: { action: "LOGOUT" },
        },
      });
    }

    return { message: "Logged out successfully." };
  }

  /**
   * Fetch current user profile with role-specific details
   */
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            fullName: true,
            headline: true,
            college: true,
            branch: true,
            gradYear: true,
            cgpa: true,
            location: true,
            bio: true,
            careerInterests: true,
            preferredLocations: true,
            workModePref: true,
          },
        },
        company: {
          select: {
            id: true,
            companyName: true,
            industry: true,
            website: true,
            location: true,
            description: true,
            isVerified: true,
          },
        },
        institution: {
          select: {
            id: true,
            institutionName: true,
            code: true,
            location: true,
            website: true,
            isVerified: true,
          },
        },
      },
    });

    if (!user) {
      const error: AppError = new Error("User not found.");
      error.statusCode = 404;
      error.code = "USER_NOT_FOUND";
      throw error;
    }

    return user;
  }
}

export const authService = new AuthService();
