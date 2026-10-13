import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-beige-300 bg-white px-6 py-10 text-center">
      <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-beige-100 text-olive-700">
        <Icon aria-hidden="true" className="size-7" />
      </span>
      <p className="text-base font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-olive-700">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
