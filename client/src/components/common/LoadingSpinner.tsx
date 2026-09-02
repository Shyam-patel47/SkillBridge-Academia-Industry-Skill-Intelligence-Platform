import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  fullPage?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  label = "Loading...",
  fullPage = false,
  className = "",
}) => {
  const content = (
    <div
      className={`flex flex-col items-center justify-center space-y-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2
        className={`${sizeClasses[size]} text-sky-400 animate-spin`}
        aria-hidden="true"
      />
      {label && (
        <span className="text-xs font-medium text-slate-400 tracking-wide">
          {label}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 bg-[#060a14]/80 backdrop-blur-sm flex items-center justify-center">
        <div className="glass-panel p-8 rounded-2xl border border-slate-800 flex flex-col items-center">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
