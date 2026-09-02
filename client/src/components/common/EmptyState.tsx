import React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`glass-panel rounded-2xl p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto my-6 border border-slate-800/80 ${className}`}
      role="status"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-sky-400 mb-4 shadow-inner">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">
        {description}
      </p>
      {actionLabel &&
        (actionHref || onAction) &&
        (actionHref ? (
          <Link
            to={actionHref}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition-all shadow-md shadow-sky-500/20 active:scale-95"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            type="button"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition-all shadow-md shadow-sky-500/20 active:scale-95"
          >
            {actionLabel}
          </button>
        ))}
    </div>
  );
};
