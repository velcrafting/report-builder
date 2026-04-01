import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      {Icon && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <Icon className="h-6 w-6 text-white/30" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white/70">{title}</p>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
