export type UserRole =
  "STUDENT" | "INDUSTRY" | "INSTITUTION_ADMIN" | "SUPER_ADMIN";

export interface StudentProfile {
  id: string;
  fullName: string;
  headline?: string | null;
  college?: string | null;
  branch?: string | null;
  gradYear?: number | null;
  cgpa?: number | null;
  location?: string | null;
  bio?: string | null;
  careerInterests?: string[];
  preferredLocations?: string[];
  workModePref?: "REMOTE" | "HYBRID" | "ON_SITE" | "ANY";
}

export interface CompanyProfile {
  id: string;
  companyName: string;
  industry?: string | null;
  website?: string | null;
  location?: string | null;
  description?: string | null;
  isVerified: boolean;
}

export interface InstitutionProfile {
  id: string;
  institutionName: string;
  code: string;
  location?: string | null;
  website?: string | null;
  isVerified: boolean;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  student?: StudentProfile | null;
  company?: CompanyProfile | null;
  institution?: InstitutionProfile | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponseData {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: UserRole;
  fullName?: string;
  companyName?: string;
  institutionName?: string;
  institutionCode?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
