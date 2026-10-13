import { AlertTriangle, CheckCircle2, Clock, type LucideIcon } from "lucide-react";
import { sharedTexts } from "../texts";

export type BadgeStatus = "PAID" | "PENDING" | "OVERDUE";

const STATUS_STYLES: Record<BadgeStatus, { icon: LucideIcon; className: string }> = {
  PAID: { icon: CheckCircle2, className: "bg-status-paid" },
  PENDING: { icon: Clock, className: "bg-status-pending" },
  OVERDUE: { icon: AlertTriangle, className: "bg-status-overdue" },
};

/** Icon + Spanish label, never color alone. */
export function StatusBadge({ status }: { status: BadgeStatus }) {
  const { icon: Icon, className } = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium whitespace-nowrap text-white ${className}`}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {sharedTexts.status[status]}
    </span>
  );
}
