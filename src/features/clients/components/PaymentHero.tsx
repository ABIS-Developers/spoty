import { AlertTriangle, CalendarClock, CalendarDays, CheckCircle2, Clock, Plus, UserX, Wallet, type LucideIcon } from "lucide-react";
import { Button } from "../../../shared/components";
import { formatDisplayDate, formatPeriod } from "../../../shared/lib/dates";
import { formatMoney } from "../../../shared/lib/money";
import { sharedTexts } from "../../../shared/texts";
import type { PaymentStatus } from "../../payments";
import { clientsTexts } from "../texts";

type Tone = PaymentStatus | "CANCELLED";

const TONES: Record<Tone, { icon: LucideIcon; panel: string; iconBubble: string; title: string }> = {
  PAID: {
    icon: CheckCircle2,
    panel: "border-status-paid bg-status-paid-soft",
    iconBubble: "bg-status-paid",
    title: "text-status-paid",
  },
  PENDING: {
    icon: Clock,
    panel: "border-status-pending bg-status-pending-soft",
    iconBubble: "bg-status-pending",
    title: "text-status-pending",
  },
  OVERDUE: {
    icon: AlertTriangle,
    panel: "border-status-overdue bg-status-overdue-soft",
    iconBubble: "bg-status-overdue",
    title: "text-status-overdue",
  },
  CANCELLED: {
    icon: UserX,
    panel: "border-olive-700 bg-olive-100",
    iconBubble: "bg-olive-700",
    title: "text-olive-900",
  },
};

type PaymentHeroProps = {
  status: PaymentStatus | null;
  /** `YYYY-MM-DD` of the first unpaid period; null for cancelled clients. */
  nextDue: string | null;
  /** Days from today to `nextDue`. */
  daysToDue: number | null;
  /** `YYYY-MM` the status refers to (current period). */
  period: string;
  amount: number;
  paymentDay: number;
  cancelledAt: string | null;
  onRegisterPayment: () => void;
};

/** Status-tinted panel with what matters most: status, next due date, amount. */
export function PaymentHero({
  status,
  nextDue,
  daysToDue,
  period,
  amount,
  paymentDay,
  cancelledAt,
  onRegisterPayment,
}: PaymentHeroProps) {
  const tone: Tone = status ?? "CANCELLED";
  const { icon: Icon, panel, iconBubble, title } = TONES[tone];
  const { hero } = clientsTexts.detail;

  const subtitle =
    status === null
      ? cancelledAt
        ? `${clientsTexts.detail.cancelledOn} ${formatDisplayDate(cancelledAt)}`
        : null
      : status === "PAID" && nextDue
        ? `${hero.coveredUntil} ${formatPeriod(previousPeriod(nextDue))}`
        : `${status === "OVERDUE" ? hero.overdueFor : hero.pendingFor} ${formatPeriod(period)}`;

  const countdown =
    daysToDue === null
      ? null
      : daysToDue === 0
        ? hero.dueToday
        : daysToDue > 0
          ? hero.dueIn(daysToDue)
          : hero.overdueBy(-daysToDue);

  return (
    <section aria-label={hero.label} className={`flex flex-col gap-5 rounded-2xl border-l-4 p-4 shadow-sm sm:p-6 ${panel}`}>
      <div className="flex items-center gap-3">
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-full text-white ${iconBubble}`}>
          <Icon aria-hidden="true" className="size-6" />
        </span>
        <div className="min-w-0">
          <p className={`text-2xl font-bold ${title}`}>
            {status ? sharedTexts.status[status] : hero.cancelledTitle}
          </p>
          {subtitle && <p className="text-sm font-medium text-olive-950">{subtitle}</p>}
        </div>
      </div>

      {nextDue && (
        <div className="rounded-xl bg-white/80 p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium text-olive-700">
            <CalendarClock aria-hidden="true" className="size-4" />
            {hero.nextDue}
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-olive-950">{formatDisplayDate(nextDue)}</p>
          {countdown && <p className={`mt-1 text-base font-semibold ${title}`}>{countdown}</p>}
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/80 px-4 py-3">
          <dt className="flex items-center gap-1.5 text-sm text-olive-700">
            <Wallet aria-hidden="true" className="size-4" />
            {hero.amount}
          </dt>
          <dd className="mt-0.5 text-xl font-bold text-olive-950">{formatMoney(amount)}</dd>
        </div>
        <div className="rounded-xl bg-white/80 px-4 py-3">
          <dt className="flex items-center gap-1.5 text-sm text-olive-700">
            <CalendarDays aria-hidden="true" className="size-4" />
            {hero.paymentDay}
          </dt>
          <dd className="mt-0.5 text-xl font-bold text-olive-950">
            {sharedTexts.day} {paymentDay}
          </dd>
        </div>
      </dl>

      <Button icon={Plus} onClick={onRegisterPayment} fullWidth className="sm:w-auto sm:self-start">
        {clientsTexts.registerPayment}
      </Button>
    </section>
  );
}

/** `2026-12-11` → `2026-11`. */
function previousPeriod(isoDate: string): string {
  const [year, month] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
