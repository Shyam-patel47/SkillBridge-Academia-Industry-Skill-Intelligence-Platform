import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { UnauthorizedPage } from "../pages/auth/UnauthorizedPage";

import { ProtectedRoute } from "./guards/ProtectedRoute";
import { RoleGuard } from "./guards/RoleGuard";

import { StudentLayout } from "../layouts/StudentLayout";
import { IndustryLayout } from "../layouts/IndustryLayout";
import { InstitutionLayout } from "../layouts/InstitutionLayout";
import { AdminLayout } from "../layouts/AdminLayout";

import { StudentDashboardPage } from "../pages/dashboards/StudentDashboardPage";
import { StudentProfilePage } from "../pages/student/StudentProfilePage";
import { IndustryDashboardPage } from "../pages/dashboards/IndustryDashboardPage";
import { InstitutionDashboardPage } from "../pages/dashboards/InstitutionDashboardPage";
import { AdminDashboardPage } from "../pages/dashboards/AdminDashboardPage";
import { AdminSkillTaxonomyPage } from "../pages/admin/AdminSkillTaxonomyPage";

// Placeholder view for subroutes
const FeaturePlaceholder: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => (
  <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 text-center max-w-2xl mx-auto my-12 space-y-3">
    <h2 className="text-2xl font-bold text-white">{title}</h2>
    <p className="text-sm text-slate-400 leading-relaxed">{subtitle}</p>
    <div className="pt-4">
      <span className="px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-semibold">
        Module Initialized • Ready for Domain Integration
      </span>
    </div>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages with AppShell Layout */}
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {/* Protected Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["STUDENT"]}>
              <StudentLayout />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboardPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route
          path="assessments"
          element={
            <FeaturePlaceholder
              title="Skill Assessment Engine"
              subtitle="Timed adaptive quizzes to evaluate technical proficiency and generate verified competency scores."
            />
          }
        />
        <Route
          path="skills"
          element={
            <FeaturePlaceholder
              title="Skill Profile & Gap Analysis"
              subtitle="Granular 0-100 skill scores, radar comparisons, and specific target proficiency gaps."
            />
          }
        />
        <Route
          path="careers"
          element={
            <FeaturePlaceholder
              title="Career Pathway Recommendations"
              subtitle="Explainable career matches with prioritized learning roadmap curricula."
            />
          }
        />
        <Route
          path="opportunities"
          element={
            <FeaturePlaceholder
              title="Opportunity Matching Feed"
              subtitle="AI & formula-matched internships and jobs with explainable compatibility scores."
            />
          }
        />
        <Route
          path="applications"
          element={
            <FeaturePlaceholder
              title="My Applications"
              subtitle="Track your submission lifecycle from Applied to Shortlisted, Interview, and Offer."
            />
          }
        />
        <Route
          path="portfolio"
          element={
            <FeaturePlaceholder
              title="Digital Portfolio & Shareable Profile"
              subtitle="Verified competencies, live projects, certifications, and public vanity URL."
            />
          }
        />
      </Route>

      {/* Protected Industry / Recruiter Routes */}
      <Route
        path="/industry"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["INDUSTRY"]}>
              <IndustryLayout />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/industry/dashboard" replace />} />
        <Route path="dashboard" element={<IndustryDashboardPage />} />
        <Route
          path="create-opportunity"
          element={
            <FeaturePlaceholder
              title="Post New Opportunity"
              subtitle="Define role requirements, required skill benchmarks, and candidate eligibility criteria."
            />
          }
        />
        <Route
          path="opportunities"
          element={
            <FeaturePlaceholder
              title="Active Opportunity Catalog"
              subtitle="View and manage live job and internship listings."
            />
          }
        />
        <Route
          path="applicants"
          element={
            <FeaturePlaceholder
              title="Applicant Review & Ranking Pipeline"
              subtitle="Review candidates ranked by deterministic skill compatibility scores."
            />
          }
        />
        <Route
          path="profile"
          element={
            <FeaturePlaceholder
              title="Company Profile & Verification"
              subtitle="Manage enterprise details and official verification status."
            />
          }
        />
      </Route>

      {/* Protected Institution Admin Routes */}
      <Route
        path="/institution"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["INSTITUTION_ADMIN", "SUPER_ADMIN"]}>
              <InstitutionLayout />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<Navigate to="/institution/dashboard" replace />}
        />
        <Route path="dashboard" element={<InstitutionDashboardPage />} />
        <Route
          path="students"
          element={
            <FeaturePlaceholder
              title="Student Skill Distribution"
              subtitle="Macro analytics across departments, batches, and assessed technical domains."
            />
          }
        />
        <Route
          path="demand-matrix"
          element={
            <FeaturePlaceholder
              title="Industry Demand vs Supply Matrix"
              subtitle="Pinpoint critical student skill deficits compared to active hiring benchmarks."
            />
          }
        />
        <Route
          path="curriculum"
          element={
            <FeaturePlaceholder
              title="Curricular Intelligence"
              subtitle="Data-driven suggestions for workshops, electives, and bridge courses."
            />
          }
        />
        <Route
          path="placements"
          element={
            <FeaturePlaceholder
              title="Placement Readiness Analytics"
              subtitle="Monitor internship participation and placement success rates."
            />
          }
        />
      </Route>

      {/* Protected Super Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
              <AdminLayout />
            </RoleGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="skills" element={<AdminSkillTaxonomyPage />} />
        <Route
          path="companies"
          element={
            <FeaturePlaceholder
              title="Company Verifications"
              subtitle="Review and verify registered corporate accounts."
            />
          }
        />
        <Route
          path="institutions"
          element={
            <FeaturePlaceholder
              title="Institution Verifications"
              subtitle="Review and verify partner academic institutions."
            />
          }
        />
        <Route
          path="opportunities"
          element={
            <FeaturePlaceholder
              title="Opportunity Moderation"
              subtitle="Review and moderate opportunities posted on the platform."
            />
          }
        />
        <Route
          path="audit-logs"
          element={
            <FeaturePlaceholder
              title="Security & Platform Audit Logs"
              subtitle="Inspect raw security events, authentication attempts, and data transactions."
            />
          }
        />
      </Route>

      {/* 404 Catch All */}
      <Route element={<AppShell />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
