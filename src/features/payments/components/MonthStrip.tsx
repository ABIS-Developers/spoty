import { AlertTriangle, CheckCircle2, Clock, Minus, type LucideIcon } from "lucide-react";
import { formatPeriod } from "../../../shared/lib/dates";
import { monthStrip, type MonthState, type MonthStripInput } from "../lib/monthStrip";
import { paymentsTexts } from "../texts";

const STATE_STYLES: Record<MonthState, { icon: LucideIcon; className: string }> = {
  PAID: { icon: CheckCircle2, className: "bg-status-paid text-white" },
  PENDING: { icon: Clock, className: "bg-status-pending text-white" },
  OVERDUE: { icon: AlertTriangle, className: "bg-status-overdue text-white" },
  NOT_APPLICABLE: { icon: Minus, className: "border border-dashed border-beige-300 bg-beige-100 text-olive-700" },
};

/** One dot per month for the last 12 months; each dot carries an icon, not color alone. */
export function MonthStrip({ client, today }: { client: MonthStripInput; today: Date }) {
  const months = monthStrip(client, today);
  const { strip } = paymentsTexts;

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold tracking-wide text-olive-700 uppercase">{strip.title}</h3>
      <ol className="grid grid-cols-6 gap-x-1 gap-y-3 sm:grid-cols-12">
        {months.map(({ period, state }) => {
          const { icon: Icon, className } = STATE_STYLES[state];
          const label = `${formatPeriod(period)}: ${strip.states[state]}`;
          return (
            <li key={period} className="flex flex-col items-center gap-1" title={label}>
              <span className={`flex size-7 items-center justify-center rounded-full ${className}`}>
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span aria-hidden="true" className="text-sm text-olive-700">
                {formatPeriod(period).slice(0, 3)}
              </span>
              <span className="sr-only">{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
