import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  GraduationCap,
  Compass,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  X,
  MapPin,
  Phone,
  Briefcase,
  Building2,
  Sparkles,
  Award,
  Laptop,
} from "lucide-react";
import {
  studentService,
  StudentProfileData,
  UpdateStudentProfileDTO,
} from "../../services/studentService";
import { skillService, SkillCategoryItem } from "../../services/skillService";

export const StudentProfilePage: React.FC = () => {
  const queryClient = useQueryClient();

  // Active section tab for mobile/desktop convenience
  const [activeTab, setActiveTab] = useState<
    "personal" | "academic" | "career" | "skills"
  >("personal");

  // Form State
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [gradYear, setGradYear] = useState<number | "">(2025);
  const [cgpa, setCgpa] = useState<number | "">(8.5);
  const [bio, setBio] = useState("");
  const [careerInterests, setCareerInterests] = useState<string[]>([]);
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [workModePref, setWorkModePref] = useState<
    "REMOTE" | "HYBRID" | "ON_SITE" | "ANY"
  >("HYBRID");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);

  // Input states for tag additions
  const [newInterest, setNewInterest] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [skillSearch, setSkillSearch] = useState("");

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fetch Student Profile
  const { data: profile, isLoading: isProfileLoading } =
    useQuery<StudentProfileData>({
      queryKey: ["student", "me"],
      queryFn: studentService.getMyProfile,
    });

  // Fetch Skill Taxonomy
  const { data: taxonomy } = useQuery<SkillCategoryItem[]>({
    queryKey: ["skills", "taxonomy"],
    queryFn: skillService.getTaxonomy,
  });

  // Populate form when profile data loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setHeadline(profile.headline || "");
      setPhone(profile.phone || "");
      setLocation(profile.location || "");
      setCollege(profile.college || "");
      setBranch(profile.branch || "");
      setGradYear(profile.gradYear ?? 2025);
      setCgpa(profile.cgpa ?? "");
      setBio(profile.bio || "");
      setCareerInterests(profile.careerInterests || []);
      setPreferredLocations(profile.preferredLocations || []);
      setWorkModePref(profile.workModePref || "HYBRID");
      setSelectedSkillIds(
        profile.skills ? profile.skills.map((s) => s.skillId) : [],
      );
    }
  }, [profile]);

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateStudentProfileDTO) =>
      studentService.updateMyProfile(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["student", "me"], updated);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      setNotification({
        type: "success",
        message: "Profile updated successfully!",
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      const errorMsg =
        err.response?.data?.error?.message ||
        "Failed to update profile. Please check your inputs.";
      setNotification({ type: "error", message: errorMsg });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    const payload: UpdateStudentProfileDTO = {
      fullName,
      headline: headline || null,
      phone: phone || null,
      location: location || null,
      college: college || null,
      branch: branch || null,
      gradYear: gradYear === "" ? null : Number(gradYear),
      cgpa: cgpa === "" ? null : Number(cgpa),
      bio: bio || null,
      careerInterests,
      preferredLocations,
      workModePref,
      selectedSkillIds,
    };

    updateMutation.mutate(payload);
  };

  // Tag helper functions
  const addInterest = () => {
    if (newInterest.trim() && !careerInterests.includes(newInterest.trim())) {
      setCareerInterests([...careerInterests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (item: string) => {
    setCareerInterests(careerInterests.filter((i) => i !== item));
  };

  const addLocation = () => {
    if (
      newLocation.trim() &&
      !preferredLocations.includes(newLocation.trim())
    ) {
      setPreferredLocations([...preferredLocations, newLocation.trim()]);
      setNewLocation("");
    }
  };

  const removeLocation = (loc: string) => {
    setPreferredLocations(preferredLocations.filter((l) => l !== loc));
  };

  const toggleSkill = (skillId: string) => {
    if (selectedSkillIds.includes(skillId)) {
      setSelectedSkillIds(selectedSkillIds.filter((id) => id !== skillId));
    } else {
      setSelectedSkillIds([...selectedSkillIds, skillId]);
    }
  };

  // Calculate Profile Completeness %
  const calculateCompleteness = () => {
    let score = 0;
    if (fullName) score += 15;
    if (headline) score += 10;
    if (bio) score += 10;
    if (college) score += 15;
    if (branch) score += 10;
    if (gradYear) score += 10;
    if (cgpa) score += 10;
    if (careerInterests.length > 0) score += 10;
    if (selectedSkillIds.length > 0) score += 10;
    return Math.min(score, 100);
  };

  const completeness = calculateCompleteness();

  if (isProfileLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Loading student profile...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Profile Hero Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0c1527] to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center space-x-5 z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl uppercase shadow-xl shadow-sky-500/20 shrink-0">
            {fullName ? fullName.slice(0, 2) : "ST"}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                {fullName || "Student Profile"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-[10px] font-mono font-semibold uppercase">
                Student Account
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              {headline ||
                "Define your professional headline (e.g. Aspiring Full Stack Engineer)"}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
              {college && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{college}</span>
                </span>
              )}
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{location}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Completeness Gauge */}
        <div className="w-full md:w-56 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 z-10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Profile Strength</span>
            </span>
            <span className="font-mono font-bold text-sky-400">
              {completeness}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${completeness}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-400">
            {completeness === 100
              ? "All key profile attributes complete"
              : "Add missing details for higher match precision"}
          </p>
        </div>
      </div>

      {/* Notification Toast Banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-start space-x-3 text-sm transition-all ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3 overflow-x-auto">
          {[
            { id: "personal", label: "1. Personal Information", icon: User },
            {
              id: "academic",
              label: "2. Academic Information",
              icon: GraduationCap,
            },
            {
              id: "career",
              label: "3. Career & Work Preferences",
              icon: Compass,
            },
            { id: "skills", label: "4. Skills Selection", icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* SECTION 1: PERSONAL INFORMATION */}
        {activeTab === "personal" && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-sky-400" />
                <span>Personal Information</span>
              </h3>
              <p className="text-xs text-slate-400">
                Basic contact and biographical background
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Professional Headline
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Final Year CS Student | Full Stack & React Developer"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Current Location / City
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bangalore, India"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  About You / Professional Summary
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Briefly describe your passions, technical strengths, and project experience..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500 leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: ACADEMIC INFORMATION */}
        {activeTab === "academic" && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-sky-400" />
                <span>Academic & Educational Credentials</span>
              </h3>
              <p className="text-xs text-slate-400">
                Institutional records used for recruiter eligibility
                verification
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  College / University Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Apex Institute of Technology"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Branch / Degree Program
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science & Engineering"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Graduation Year
                </label>
                <select
                  value={gradYear}
                  onChange={(e) =>
                    setGradYear(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                >
                  {[2023, 2024, 2025, 2026, 2027, 2028].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Cumulative CGPA (out of 10.0)
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={cgpa}
                    onChange={(e) =>
                      setCgpa(e.target.value ? parseFloat(e.target.value) : "")
                    }
                    placeholder="e.g. 8.75"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: CAREER & WORK PREFERENCES */}
        {activeTab === "career" && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-400" />
                <span>Career Goals & Work Preferences</span>
              </h3>
              <p className="text-xs text-slate-400">
                Used by the recommendation formula to calculate interest
                alignment
              </p>
            </div>

            {/* Career Interests Tag Input */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Target Career Roles (Press Add or Enter)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addInterest();
                    }
                  }}
                  placeholder="e.g. Full Stack Developer, Frontend Engineer, DevOps"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={addInterest}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {careerInterests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-medium"
                  >
                    <span>{interest}</span>
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="hover:text-rose-400 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Locations */}
            <div className="space-y-2 border-t border-slate-850 pt-5">
              <label className="block text-xs font-medium text-slate-300">
                Preferred Work Locations (Press Add or Enter)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLocation();
                    }
                  }}
                  placeholder="e.g. Bangalore, Hyderabad, Pune, Remote"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={addLocation}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {preferredLocations.map((loc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
                  >
                    <MapPin className="w-3 h-3 text-indigo-400" />
                    <span>{loc}</span>
                    <button
                      type="button"
                      onClick={() => removeLocation(loc)}
                      className="hover:text-rose-400 focus:outline-none"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Work Mode */}
            <div className="border-t border-slate-850 pt-5 space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Preferred Work Arrangement
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    id: "REMOTE",
                    label: "Remote",
                    desc: "Work from anywhere",
                    icon: Laptop,
                  },
                  {
                    id: "HYBRID",
                    label: "Hybrid",
                    desc: "Office & home mix",
                    icon: Briefcase,
                  },
                  {
                    id: "ON_SITE",
                    label: "On-Site",
                    desc: "In-office primary",
                    icon: Building2,
                  },
                  {
                    id: "ANY",
                    label: "Flexible / Any",
                    desc: "Open to all modes",
                    icon: Compass,
                  },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = workModePref === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setWorkModePref(mode.id as any)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "bg-sky-500/15 border-sky-500 text-white shadow-md shadow-sky-500/10"
                          : "bg-slate-900 border-slate-850 text-slate-400 hover:border-slate-750"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 mb-2 ${isSelected ? "text-sky-400" : "text-slate-500"}`}
                      />
                      <div className="text-xs font-bold text-white">
                        {mode.label}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {mode.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: SKILLS SELECTION */}
        {activeTab === "skills" && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>Centralized Skill Selection</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select your core technical and soft skill competencies from
                  the centralized taxonomy
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Selected:{" "}
                <span className="font-bold text-sky-400">
                  {selectedSkillIds.length} skills
                </span>
              </div>
            </div>

            {/* Filter Search */}
            <div>
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Search skills (e.g. React, Node.js, Docker, SQL)..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Taxonomy Categories */}
            <div className="space-y-6">
              {taxonomy?.map((cat) => {
                const filteredSkills = cat.skills.filter((s) =>
                  s.name.toLowerCase().includes(skillSearch.toLowerCase()),
                );

                if (filteredSkills.length === 0) return null;

                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                      <span className="text-xs font-bold text-slate-200">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {filteredSkills.length} skills
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {filteredSkills.map((skill) => {
                        const isSelected = selectedSkillIds.includes(skill.id);
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => toggleSkill(skill.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all ${
                              isSelected
                                ? "bg-sky-500 text-white shadow-sm shadow-sky-500/20 font-semibold"
                                : "bg-slate-800/80 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/50"
                            }`}
                          >
                            <span>{skill.name}</span>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Save Button */}
        <div className="sticky bottom-4 z-20 glass-panel p-4 rounded-2xl border border-slate-800/90 shadow-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Changes will instantly update your career match metrics</span>
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Update Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
