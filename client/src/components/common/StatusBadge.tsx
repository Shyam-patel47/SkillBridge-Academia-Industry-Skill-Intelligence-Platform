import React from "react";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Award,
} from "lucide-react";

export type StatusType =
  | "APPLIED"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "OFFERED"
  | "REJECTED"
  | "WITHDRAWN"
  | "HIGH_FIT"
  | "MODERATE_FIT"
  | "DEVELOPING"
  | "VERIFIED"
  | "UNVERIFIED";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.FC<{ className?: string }>;
  }
> = {
  APPLIED: {
    label: "Applied",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    icon: Clock,
  },
  SHORTLISTED: {
    label: "Shortlisted",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
    icon: Award,
  },
  INTERVIEW: {
    label: "Interview",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    icon: Clock,
  },
  OFFERED: {
    label: "Offered",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rejected",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    icon: XCircle,
  },
  WITHDRAWN: {
    label: "Withdrawn",
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/30",
    icon: XCircle,
  },
  HIGH_FIT: {
    label: "High Fit (80%+)",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    icon: CheckCircle,
  },
  MODERATE_FIT: {
    label: "Moderate Fit (60-79%)",
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    border: "border-sky-500/30",
    icon: AlertTriangle,
  },
  DEVELOPING: {
    label: "Developing (<60%)",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    icon: AlertTriangle,
  },
  VERIFIED: {
    label: "Verified Skill",
    bg: "bg-sky-500/15",
    text: "text-sky-400",
    border: "border-sky-500/30",
    icon: CheckCircle,
  },
  UNVERIFIED: {
    label: "Self-Reported",
    bg: "bg-slate-500/15",
    text: "text-slate-400",
    border: "border-slate-500/30",
    icon: Clock,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = "",
}) => {
  const config = statusConfig[status] || {
    label: status,
    bg: "bg-slate-500/10",
    text: "text-slate-300",
    border: "border-slate-500/30",
    icon: Clock,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
};
