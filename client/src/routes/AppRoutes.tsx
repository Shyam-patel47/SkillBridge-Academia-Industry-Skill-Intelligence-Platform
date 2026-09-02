import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { LoadingSpinner } from "../components/common/LoadingSpinner";

// Guards & Layouts
import { ProtectedRoute } from "./guards/ProtectedRoute";
import { RoleGuard } from "./guards/RoleGuard";
import { StudentLayout } from "../layouts/StudentLayout";
import { IndustryLayout } from "../layouts/IndustryLayout";
import { InstitutionLayout } from "../layouts/InstitutionLayout";
import { AdminLayout } from "../layouts/AdminLayout";

// Static / Lightweight Public Pages
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { UnauthorizedPage } from "../pages/auth/UnauthorizedPage";

// Code-Split / Lazy-Loaded Student Pages
const StudentDashboardPage = lazy(() =>
  import("../pages/dashboards/StudentDashboardPage").then((m) => ({
    default: m.StudentDashboardPage,
  })),
);
const StudentProfilePage = lazy(() =>
  import("../pages/student/StudentProfilePage").then((m) => ({
    default: m.StudentProfilePage,
  })),
);
const StudentSkillsPage = lazy(() =>
  import("../pages/student/StudentSkillsPage").then((m) => ({
    default: m.StudentSkillsPage,
  })),
);
const CareerPathwaysPage = lazy(() =>
  import("../pages/student/CareerPathwaysPage").then((m) => ({
    default: m.CareerPathwaysPage,
  })),
);
const CareerDetailPage = lazy(() =>
  import("../pages/student/CareerDetailPage").then((m) => ({
    default: m.CareerDetailPage,
  })),
);
const StudentLearningPage = lazy(() =>
  import("../pages/student/StudentLearningPage").then((m) => ({
    default: m.StudentLearningPage,
  })),
);
const StudentOpportunitiesPage = lazy(() =>
  import("../pages/student/StudentOpportunitiesPage").then((m) => ({
    default: m.StudentOpportunitiesPage,
  })),
);
const StudentOpportunityDetailPage = lazy(() =>
  import("../pages/student/StudentOpportunityDetailPage").then((m) => ({
    default: m.StudentOpportunityDetailPage,
  })),
);
const StudentApplicationsPage = lazy(() =>
  import("../pages/student/StudentApplicationsPage").then((m) => ({
    default: m.StudentApplicationsPage,
  })),
);
const StudentApplicationDetailPage = lazy(() =>
  import("../pages/student/StudentApplicationDetailPage").then((m) => ({
    default: m.StudentApplicationDetailPage,
  })),
);
const StudentPortfolioStudioPage = lazy(() =>
  import("../pages/student/StudentPortfolioStudioPage").then((m) => ({
    default: m.StudentPortfolioStudioPage,
  })),
);
const ResumeSkillExtractionPage = lazy(() =>
  import("../pages/student/ResumeSkillExtractionPage").then((m) => ({
    default: m.ResumeSkillExtractionPage,
  })),
);
const PublicPortfolioPage = lazy(() =>
  import("../pages/public/PublicPortfolioPage").then((m) => ({
    default: m.PublicPortfolioPage,
  })),
);
const AssessmentCatalogPage = lazy(() =>
  import("../pages/student/AssessmentCatalogPage").then((m) => ({
    default: m.AssessmentCatalogPage,
  })),
);
const AssessmentSessionPage = lazy(() =>
  import("../pages/student/AssessmentSessionPage").then((m) => ({
    default: m.AssessmentSessionPage,
  })),
);
const AssessmentResultPage = lazy(() =>
  import("../pages/student/AssessmentResultPage").then((m) => ({
    default: m.AssessmentResultPage,
  })),
);

// Code-Split / Lazy-Loaded Industry & Recruiter Pages
const IndustryDashboardPage = lazy(() =>
  import("../pages/dashboards/IndustryDashboardPage").then((m) => ({
    default: m.IndustryDashboardPage,
  })),
);
const CompanyProfilePage = lazy(() =>
  import("../pages/industry/CompanyProfilePage").then((m) => ({
    default: m.CompanyProfilePage,
  })),
);
const IndustryOpportunitiesPage = lazy(() =>
  import("../pages/industry/IndustryOpportunitiesPage").then((m) => ({
    default: m.IndustryOpportunitiesPage,
  })),
);
const CreateOpportunityPage = lazy(() =>
  import("../pages/industry/CreateOpportunityPage").then((m) => ({
    default: m.CreateOpportunityPage,
  })),
);
const EditOpportunityPage = lazy(() =>
  import("../pages/industry/EditOpportunityPage").then((m) => ({
    default: m.EditOpportunityPage,
  })),
);
const OpportunityDetailPage = lazy(() =>
  import("../pages/industry/OpportunityDetailPage").then((m) => ({
    default: m.OpportunityDetailPage,
  })),
);
const RecruiterApplicantsPage = lazy(() =>
  import("../pages/industry/RecruiterApplicantsPage").then((m) => ({
    default: m.RecruiterApplicantsPage,
  })),
);

// Code-Split / Lazy-Loaded Administration Pages
const InstitutionDashboardPage = lazy(() =>
  import("../pages/dashboards/InstitutionDashboardPage").then((m) => ({
    default: m.InstitutionDashboardPage,
  })),
);
const AdminDashboardPage = lazy(() =>
  import("../pages/dashboards/AdminDashboardPage").then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const AdminSkillTaxonomyPage = lazy(() =>
  import("../pages/admin/AdminSkillTaxonomyPage").then((m) => ({
    default: m.AdminSkillTaxonomyPage,
  })),
);

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
    <Suspense
      fallback={<LoadingSpinner fullPage label="Loading SkillBridge..." />}
    >
      <Routes>
        {/* Public Pages with AppShell Layout */}
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>

        {/* Public Shareable Digital Portfolio */}
        <Route path="/portfolio/:username" element={<PublicPortfolioPage />} />

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
          <Route path="assessments" element={<AssessmentCatalogPage />} />
          <Route path="assessments/:id" element={<AssessmentSessionPage />} />
          <Route
            path="assessments/:id/result"
            element={<AssessmentResultPage />}
          />
          <Route path="assessment" element={<AssessmentCatalogPage />} />
          <Route path="assessment/:id" element={<AssessmentSessionPage />} />
          <Route
            path="assessment/:id/result"
            element={<AssessmentResultPage />}
          />
          <Route path="skills" element={<StudentSkillsPage />} />
          <Route path="careers" element={<CareerPathwaysPage />} />
          <Route path="careers/:id" element={<CareerDetailPage />} />
          <Route path="learning" element={<StudentLearningPage />} />
          <Route path="opportunities" element={<StudentOpportunitiesPage />} />
          <Route
            path="opportunities/:id"
            element={<StudentOpportunityDetailPage />}
          />
          <Route path="applications" element={<StudentApplicationsPage />} />
          <Route
            path="applications/:id"
            element={<StudentApplicationDetailPage />}
          />
          <Route path="portfolio" element={<StudentPortfolioStudioPage />} />
          <Route
            path="resume-extractor"
            element={<ResumeSkillExtractionPage />}
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
          <Route
            index
            element={<Navigate to="/industry/dashboard" replace />}
          />
          <Route path="dashboard" element={<IndustryDashboardPage />} />
          <Route path="profile" element={<CompanyProfilePage />} />
          <Route path="opportunities" element={<IndustryOpportunitiesPage />} />
          <Route
            path="opportunities/create"
            element={<CreateOpportunityPage />}
          />
          <Route path="opportunities/:id" element={<OpportunityDetailPage />} />
          <Route
            path="opportunities/:id/edit"
            element={<EditOpportunityPage />}
          />
          <Route
            path="opportunities/:id/applicants"
            element={<RecruiterApplicantsPage />}
          />
          <Route
            path="create-opportunity"
            element={<CreateOpportunityPage />}
          />
          <Route path="applicants" element={<RecruiterApplicantsPage />} />
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
    </Suspense>
  );
};
