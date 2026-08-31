import { UserRole } from "@prisma/client";

export interface AuthUserPayload {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}
