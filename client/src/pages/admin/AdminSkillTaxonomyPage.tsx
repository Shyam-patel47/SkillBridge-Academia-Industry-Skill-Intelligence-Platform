import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Layers,
  Plus,
  Search,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Briefcase,
  Target,
  FolderPlus,
  X,
} from "lucide-react";
import {
  skillService,
  SkillItem,
  SkillCategoryItem,
  CreateCategoryDTO,
  CreateSkillDTO,
} from "../../services/skillService";

export const AdminSkillTaxonomyPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"skills" | "categories">("skills");
  const [search, setSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("ALL");

  // Modal States
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillItem | null>(null);
  const [editingCategory, setEditingCategory] =
    useState<SkillCategoryItem | null>(null);

  // Form inputs
  const [skillName, setSkillName] = useState("");
  const [skillDescription, setSkillDescription] = useState("");
  const [skillCategoryId, setSkillCategoryId] = useState("");

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");
  const [categoryOrder, setCategoryOrder] = useState<number>(0);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fetch Summary Metrics
  const { data: summary } = useQuery({
    queryKey: ["skills", "summary"],
    queryFn: skillService.getSummary,
  });

  // Fetch Taxonomy & Skills
  const { data: taxonomy, isLoading } = useQuery<SkillCategoryItem[]>({
    queryKey: ["skills", "taxonomy"],
    queryFn: skillService.getTaxonomy,
  });

  const { data: allSkills } = useQuery<SkillItem[]>({
    queryKey: ["skills", "all", { search, categoryId: selectedCategoryFilter }],
    queryFn: () =>
      skillService.getAllSkills({
        search: search || undefined,
        categoryId:
          selectedCategoryFilter !== "ALL" ? selectedCategoryFilter : undefined,
      }),
  });

  // Category Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: CreateCategoryDTO) => skillService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      setCategoryModalOpen(false);
      resetCategoryForm();
      showFeedback("success", "Skill category created successfully.");
    },
    onError: (err: any) => {
      showFeedback(
        "error",
        err.response?.data?.error?.message || "Failed to create category.",
      );
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateCategoryDTO>;
    }) => skillService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      setCategoryModalOpen(false);
      resetCategoryForm();
      showFeedback("success", "Skill category updated successfully.");
    },
    onError: (err: any) => {
      showFeedback(
        "error",
        err.response?.data?.error?.message || "Failed to update category.",
      );
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => skillService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      showFeedback("success", "Skill category deleted successfully.");
    },
    onError: (err: any) => {
      showFeedback(
        "error",
        err.response?.data?.error?.message || "Failed to delete category.",
      );
    },
  });

  // Skill Mutations
  const createSkillMutation = useMutation({
    mutationFn: (data: CreateSkillDTO) => skillService.createSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      setSkillModalOpen(false);
      resetSkillForm();
      showFeedback("success", "Skill created successfully.");
    },
    onError: (err: any) => {
      showFeedback(
        "error",
        err.response?.data?.error?.message || "Failed to create skill.",
      );
    },
  });

  const updateSkillMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSkillDTO> }) =>
      skillService.updateSkill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      setSkillModalOpen(false);
      resetSkillForm();
      showFeedback("success", "Skill updated successfully.");
    },
    onError: (err: any) => {
      showFeedback(
        "error",
        err.response?.data?.error?.message || "Failed to update skill.",
      );
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: (id: string) => skillService.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      showFeedback("success", "Skill deleted successfully.");
    },
    onError: (err: any) => {
      showFeedback(
        "error",
        err.response?.data?.error?.message || "Failed to delete skill.",
      );
    },
  });

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const resetSkillForm = () => {
    setEditingSkill(null);
    setSkillName("");
    setSkillDescription("");
    setSkillCategoryId(taxonomy?.[0]?.id || "");
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
    setCategoryIcon("");
    setCategoryOrder(0);
  };

  const handleOpenEditSkill = (skill: SkillItem) => {
    setEditingSkill(skill);
    setSkillName(skill.name);
    setSkillDescription(skill.description || "");
    setSkillCategoryId(skill.categoryId);
    setSkillModalOpen(true);
  };

  const handleOpenEditCategory = (cat: SkillCategoryItem) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryDescription(cat.description || "");
    setCategoryIcon(cat.icon || "");
    setCategoryOrder(cat.order || 0);
    setCategoryModalOpen(true);
  };

  const handleSubmitSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSkill) {
      updateSkillMutation.mutate({
        id: editingSkill.id,
        data: {
          name: skillName,
          description: skillDescription || null,
          categoryId: skillCategoryId,
        },
      });
    } else {
      createSkillMutation.mutate({
        name: skillName,
        description: skillDescription || null,
        categoryId: skillCategoryId,
      });
    }
  };

  const handleSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        data: {
          name: categoryName,
          description: categoryDescription || null,
          icon: categoryIcon || null,
          order: Number(categoryOrder),
        },
      });
    } else {
      createCategoryMutation.mutate({
        name: categoryName,
        description: categoryDescription || null,
        icon: categoryIcon || null,
        order: Number(categoryOrder),
      });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#1f1a10] to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Standardized Skill Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Skill Taxonomy Master Directory
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Centralized taxonomy governing assessments, student proficiency
            matrices, career benchmark mappings, and recruitment skill
            requirements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => {
              resetCategoryForm();
              setCategoryModalOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>New Category</span>
          </button>
          <button
            onClick={() => {
              resetSkillForm();
              setSkillCategoryId(taxonomy?.[0]?.id || "");
              setSkillModalOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill Entity</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-start space-x-3 text-sm transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Categories</p>
            <h3 className="text-xl font-extrabold text-white">
              {summary?.totalCategories ?? 6} Domains
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Structured Taxonomy
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Master Skills</p>
            <h3 className="text-xl font-extrabold text-white">
              {summary?.totalSkills ?? 24} Skills
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Central Entities
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Student Competencies
            </p>
            <h3 className="text-xl font-extrabold text-white">
              {summary?.totalStudentSkills ?? 18} Linked
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Verified Records
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Recruiter Criteria
            </p>
            <h3 className="text-xl font-extrabold text-white">
              {summary?.totalOpportunitySkills ?? 12} Postings
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Requirement Tags
            </span>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        {/* Navigation & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("skills")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "skills"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Skills ({allSkills?.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "categories"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Categories ({taxonomy?.length ?? 0})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search taxonomy..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {activeTab === "skills" && (
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Categories</option>
                {taxonomy?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* TAB 1: ALL SKILLS TABLE */}
        {activeTab === "skills" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Skill Name</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Slug Identifier</th>
                  <th className="pb-3 font-semibold">Student Linkages</th>
                  <th className="pb-3 font-semibold">Opportunity Demand</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                      Loading skills catalog...
                    </td>
                  </tr>
                ) : allSkills && allSkills.length > 0 ? (
                  allSkills.map((skill) => (
                    <tr
                      key={skill.id}
                      className="hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-3.5 font-bold text-white flex items-center gap-2">
                        <span>{skill.name}</span>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-850 text-slate-300 font-medium">
                          {skill.category?.name || "Unassigned"}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-slate-400">
                        {skill.slug}
                      </td>
                      <td className="py-3.5 font-mono text-slate-300">
                        {skill._count?.studentSkills ?? 0} students
                      </td>
                      <td className="py-3.5 font-mono text-slate-300">
                        {skill._count?.opportunitySkills ?? 0} roles
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditSkill(skill)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete skill "${skill.name}"?`)) {
                              deleteSkillMutation.mutate(skill.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No skills match your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: CATEGORIES ACCORDION / TABLE */}
        {activeTab === "categories" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {taxonomy?.map((cat) => (
              <div
                key={cat.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-850 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {cat.name}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-500">
                        {cat.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditCategory(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Delete category "${cat.name}" and associated skills?`,
                          )
                        ) {
                          deleteCategoryMutation.mutate(cat.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  {cat.description || "No description provided."}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {cat.skills?.map((s) => (
                    <span
                      key={s.id}
                      className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 font-medium"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SKILL MODAL (Create / Edit) */}
      {skillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingSkill ? "Edit Skill Entity" : "Create New Skill"}
              </h3>
              <button
                onClick={() => setSkillModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSkill} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Skill Name *
                </label>
                <input
                  type="text"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. Kubernetes"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Skill Category *
                </label>
                <select
                  value={skillCategoryId}
                  onChange={(e) => setSkillCategoryId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                >
                  {taxonomy?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={skillDescription}
                  onChange={(e) => setSkillDescription(e.target.value)}
                  rows={3}
                  placeholder="Brief description of the skill competency..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSkillModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createSkillMutation.isPending ||
                    updateSkillMutation.isPending
                  }
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                >
                  {editingSkill ? "Save Changes" : "Create Skill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL (Create / Edit) */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingCategory ? "Edit Category" : "Create Skill Category"}
              </h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Cybersecurity"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  value={categoryOrder}
                  onChange={(e) => setCategoryOrder(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  rows={3}
                  placeholder="Description of the category domain..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createCategoryMutation.isPending ||
                    updateCategoryMutation.isPending
                  }
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                >
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
