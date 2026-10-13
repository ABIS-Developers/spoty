import { CheckCircle2, Receipt } from "lucide-react";
import { Chip, EmptyState, Timeline } from "../../../shared/components";
import { formatDisplayDate, formatPeriod } from "../../../shared/lib/dates";
import { formatMoney } from "../../../shared/lib/money";
import type { Payment } from "../api/paymentsApi";
import { newestFirst } from "../lib/monthStrip";
import { paymentsTexts } from "../texts";

/** Vertical timeline of a client's payments, newest first. */
export function PaymentHistory({ payments }: { payments: ReadonlyArray<Payment> }) {
  const { history } = paymentsTexts;

  if (payments.length === 0) {
    return <EmptyState icon={Receipt} title={history.emptyTitle} description={history.emptyDescription} />;
  }

  return (
    <Timeline
      items={newestFirst(payments).map((payment) => ({
        id: payment.id,
        icon: CheckCircle2,
        title: <Chip>{formatPeriod(payment.period)}</Chip>,
        meta: `${history.paidOn} ${formatDisplayDate(payment.paidAt)}`,
        aside: <span className="font-semibold">{formatMoney(payment.amount)}</span>,
      }))}
    />
  );
}
