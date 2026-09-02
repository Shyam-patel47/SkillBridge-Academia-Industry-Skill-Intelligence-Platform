import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type BannerVariant = "success" | "error" | "warning" | "info";

interface NotificationBannerProps {
  variant?: BannerVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const variantStyles: Record<
  BannerVariant,
  { bg: string; border: string; text: string; icon: React.FC<{ className?: string }> }
> = {
  success: {
    bg: "bg-emerald-950/40",
    border: "border-emerald-500/30",
    text: "text-emerald-300",
    icon: CheckCircle2,
  },
  error: {
    bg: "bg-rose-950/40",
    border: "border-rose-500/30",
    text: "text-rose-300",
    icon: AlertCircle,
  },
  warning: {
    bg: "bg-amber-950/40",
    border: "border-amber-500/30",
    text: "text-amber-300",
    icon: AlertTriangle,
  },
  info: {
    bg: "bg-sky-950/40",
    border: "border-sky-500/30",
    text: "text-sky-300",
    icon: Info,
  },
};

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  variant = "info",
  title,
  message,
  onClose,
  className = "",
}) => {
  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <div
      role="alert"
      className={`flex items-start justify-between p-4 rounded-xl border ${style.bg} ${style.border} ${style.text} transition-all ${className}`}
    >
      <div className="flex items-start space-x-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          {title && <h4 className="text-sm font-semibold text-white mb-0.5">{title}</h4>}
          <p className="text-xs leading-relaxed opacity-90">{message}</p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Dismiss notification"
          className="p-1 rounded-lg hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
