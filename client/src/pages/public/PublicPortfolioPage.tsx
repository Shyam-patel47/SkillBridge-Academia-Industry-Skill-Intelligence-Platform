import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Globe,
  Lock,
  ExternalLink,
  Github,
  CheckCircle2,
  Award,
  Trophy,
  Layers,
  GraduationCap,
  Code,
  Sparkles,
  Loader2,
  MapPin,
} from "lucide-react";
import {
  portfolioService,
  DigitalPortfolioDossier,
} from "../../services/portfolioService";

export const PublicPortfolioPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();

  const {
    data: portfolio,
    isLoading,
    error,
  } = useQuery<DigitalPortfolioDossier>({
    queryKey: ["public", "portfolio", username],
    queryFn: () => portfolioService.getPublicPortfolio(username!),
    enabled: Boolean(username),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060a14] flex flex-col items-center justify-center space-y-4 text-white">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Loading verified student portfolio...
        </p>
      </div>
    );
  }

  if (error || !portfolio) {
    const isPrivate = (error as any)?.response?.status === 403;

    return (
      <div className="min-h-screen bg-[#060a14] flex items-center justify-center p-4">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 bg-slate-900 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            {isPrivate ? (
              <Lock className="w-6 h-6 text-amber-400" />
            ) : (
              <Globe className="w-6 h-6 text-slate-400" />
            )}
          </div>

          <h2 className="text-xl font-bold text-white">
            {isPrivate ? "This Portfolio is Private" : "Portfolio Not Found"}
          </h2>

          <p className="text-xs text-slate-400 leading-relaxed">
            {isPrivate
              ? "The owner has set their digital portfolio to private mode. Only authorized reviewers can view this profile."
              : "The requested student portfolio handle does not exist or has been removed."}
          </p>

          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all mt-2"
          >
            <span>Back to SkillBridge Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const {
    profile,
    skills,
    projects,
    certifications,
    achievements,
    portfolioSettings,
  } = portfolio;

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100 antialiased py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Top Navbar Header */}
        <div className="flex items-center justify-between border-b border-slate-850 pb-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white font-black text-sm">
              SB
            </div>
            <span className="font-extrabold text-white text-sm tracking-tight">
              Skill<span className="text-sky-400">Bridge</span>
            </span>
          </Link>

          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>SkillBridge Verified Portfolio</span>
            </span>
          </div>
        </div>

        {/* Hero Profile Card */}
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1c30] to-slate-900 relative overflow-hidden space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 border border-sky-500/30 text-sky-400">
                  STUDENT PORTFOLIO
                </span>
                {profile.gradYear && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-300">
                    Class of {profile.gradYear}
                  </span>
                )}
                {profile.cgpa && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    CGPA: {profile.cgpa}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {profile.fullName}
              </h1>

              {profile.headline && (
                <p className="text-sm font-semibold text-sky-400 font-mono">
                  {profile.headline}
                </p>
              )}

              {/* Academic Details */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono pt-1">
                {profile.college && (
                  <div className="flex items-center space-x-1.5 text-white font-semibold">
                    <GraduationCap className="w-4 h-4 text-sky-400" />
                    <span>{profile.college}</span>
                  </div>
                )}
                {profile.branch && <span>• {profile.branch}</span>}
                {profile.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Contact & Verified Badge */}
            <div className="flex flex-col items-start md:items-end space-y-3 shrink-0">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-850 text-right">
                <span className="text-[10px] font-mono text-slate-500 block">
                  Verified Skills
                </span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {skills.filter((s) => s.isVerified).length} / {skills.length}
                </span>
              </div>

              {profile.resumeUrl && (
                <a
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all"
                >
                  <span>Download Resume</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* About Me Bio */}
          {(portfolioSettings.aboutMe || profile.bio) && (
            <div className="pt-4 border-t border-slate-800 text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              {portfolioSettings.aboutMe || profile.bio}
            </div>
          )}
        </div>

        {/* Section 1: Verified Skills Intelligence */}
        {skills.length > 0 && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Verified Assessment Competencies ({skills.length})</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-500">
                Benchmark Evaluated
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {skills.map((s) => (
                <div
                  key={s.skillId}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2 text-xs font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[10px] truncate">
                      {s.category}
                    </span>
                    {s.isVerified && (
                      <span className="text-emerald-400 font-bold text-[10px]">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">
                    {s.skillName}
                  </h4>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-2xl font-extrabold text-emerald-400">
                      {s.score}%
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {s.proficiency || "PROFICIENT"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Projects Showcase */}
        {projects.length > 0 && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-sky-400" />
                <span>Featured Engineering Projects ({projects.length})</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-500">
                Live Code & Architecture
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-6 rounded-2xl bg-slate-950 border border-slate-850 hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white">
                        {proj.title}
                      </h3>
                      {proj.isFeatured && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                          ★ Featured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {proj.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Technologies */}
                    {proj.skillsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {proj.skillsUsed.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-sky-400"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Links */}
                    <div className="flex items-center space-x-4 text-xs font-mono pt-1">
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1.5 text-slate-300 hover:text-white"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>Source Code</span>
                        </a>
                      )}
                      {proj.liveUrl && (
                        <a
                          href={proj.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1.5 text-sky-400 hover:text-sky-300 font-bold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Live Demo</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Professional Certifications */}
        {certifications.length > 0 && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-400" />
                <span>
                  Professional Certifications ({certifications.length})
                </span>
              </h2>
              <span className="text-[11px] font-mono text-slate-500">
                Accredited Credentials
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-850 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">
                      {cert.title}
                    </h3>
                    <p className="text-xs font-mono text-sky-400">
                      {cert.issuer}
                    </p>
                    <span className="text-[11px] font-mono text-slate-500 block">
                      Issued {new Date(cert.issueDate).toLocaleDateString()}
                    </span>
                  </div>

                  {cert.credentialUrl && (
                    <div className="pt-2">
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs font-mono text-sky-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Verify Credential</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Honors & Hackathon Achievements */}
        {achievements.length > 0 && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>
                  Honors & Hackathon Achievements ({achievements.length})
                </span>
              </h2>
              <span className="text-[11px] font-mono text-slate-500">
                Awards & Recognition
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-850 space-y-2"
                >
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{ach.title}</span>
                  </h3>
                  {ach.issuer && (
                    <p className="text-xs font-mono text-slate-400">
                      {ach.issuer}
                    </p>
                  )}
                  {ach.description && (
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {ach.description}
                    </p>
                  )}
                  {ach.certificateUrl && (
                    <div className="pt-1">
                      <a
                        href={ach.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs font-mono text-sky-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Certificate Proof</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Verified Stamp */}
        <div className="text-center py-8 space-y-2 border-t border-slate-850">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>
              Powered by SkillBridge Academia-Industry Skill Intelligence
              Platform
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-mono">
            Deterministic Skill Intelligence • Anti-Gravity Certified
          </p>
        </div>
      </div>
    </div>
  );
};
