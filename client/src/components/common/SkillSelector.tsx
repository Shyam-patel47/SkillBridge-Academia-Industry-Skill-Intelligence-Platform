import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Check, X, Layers, Plus } from "lucide-react";
import { skillService, SkillCategoryItem } from "../../services/skillService";

interface SkillSelectorProps {
  selectedSkillIds: string[];
  onChange: (selectedIds: string[]) => void;
  maxSelections?: number;
  label?: string;
}

export const SkillSelector: React.FC<SkillSelectorProps> = ({
  selectedSkillIds,
  onChange,
  maxSelections,
  label = "Select Competencies",
}) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const { data: taxonomy, isLoading } = useQuery<SkillCategoryItem[]>({
    queryKey: ["skills", "taxonomy"],
    queryFn: skillService.getTaxonomy,
  });

  const toggleSkill = (skillId: string) => {
    if (selectedSkillIds.includes(skillId)) {
      onChange(selectedSkillIds.filter((id) => id !== skillId));
    } else {
      if (maxSelections && selectedSkillIds.length >= maxSelections) {
        return;
      }
      onChange([...selectedSkillIds, skillId]);
    }
  };

  const removeSkill = (skillId: string) => {
    onChange(selectedSkillIds.filter((id) => id !== skillId));
  };

  // Find names of selected skills
  const getSelectedSkillObjects = () => {
    if (!taxonomy) return [];
    const allSkills = taxonomy.flatMap((cat) => cat.skills);
    return allSkills.filter((s) => selectedSkillIds.includes(s.id));
  };

  const selectedSkills = getSelectedSkillObjects();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-xs font-mono text-slate-400">
          Selected:{" "}
          <span className="text-sky-400 font-bold">
            {selectedSkillIds.length}
            {maxSelections ? ` / ${maxSelections}` : ""}
          </span>
        </span>
      </div>

      {/* Selected Chips Bar */}
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          {selectedSkills.map((skill) => (
            <span
              key={skill.id}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-medium"
            >
              <span>{skill.name}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill.id)}
                className="hover:text-rose-400 focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search & Category Tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills by keyword (e.g. React, Docker, Python)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              selectedCategory === "ALL"
                ? "bg-slate-800 text-white font-semibold border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Categories
          </button>
          {taxonomy?.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="max-h-60 overflow-y-auto space-y-4 pr-1">
        {isLoading ? (
          <div className="text-center py-6 text-xs text-slate-500">
            Loading taxonomy...
          </div>
        ) : (
          taxonomy?.map((cat) => {
            if (selectedCategory !== "ALL" && selectedCategory !== cat.id)
              return null;

            const matchingSkills = cat.skills.filter((s) =>
              s.name.toLowerCase().includes(search.toLowerCase()),
            );

            if (matchingSkills.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span>{cat.name}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {matchingSkills.map((skill) => {
                    const isSelected = selectedSkillIds.includes(skill.id);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleSkill(skill.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center space-x-1 ${
                          isSelected
                            ? "bg-sky-500 text-white font-semibold shadow-sm"
                            : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                        }`}
                      >
                        <span>{skill.name}</span>
                        {isSelected ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <Plus className="w-3 h-3 text-slate-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
