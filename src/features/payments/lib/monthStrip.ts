import { addMonths, format, parse } from "date-fns";
import { currentPeriod, paymentStatus } from "./paymentStatus";

export type MonthState = "PAID" | "PENDING" | "OVERDUE" | "NOT_APPLICABLE";

export type MonthStripInput = {
  status: "ACTIVE" | "CANCELLED";
  /** `YYYY-MM-DD` */
  startDate: string;
  /** `YYYY-MM-DD` or null */
  cancelledAt: string | null;
  paymentDay: number;
  payments: ReadonlyArray<{ period: string }>;
};

const PERIOD = "yyyy-MM";

/** Last `months` periods ending with the current one, oldest first. */
export function monthStrip(
  client: MonthStripInput,
  today: Date,
  months = 12,
): Array<{ period: string; state: MonthState }> {
  const current = currentPeriod(today);
  const startPeriod = client.startDate.slice(0, 7);
  const endPeriod = client.cancelledAt?.slice(0, 7) ?? null;
  const paid = new Set(client.payments.map((payment) => payment.period));
  const first = parse(current, PERIOD, new Date());

  return Array.from({ length: months }, (_, index) => {
    const period = format(addMonths(first, index - (months - 1)), PERIOD);
    let state: MonthState;
    if (period < startPeriod || (endPeriod !== null && period > endPeriod)) state = "NOT_APPLICABLE";
    else if (paid.has(period)) state = "PAID";
    else if (period === current) state = paymentStatus(client, today) ?? "NOT_APPLICABLE";
    else state = "OVERDUE";
    return { period, state };
  });
}

/** Payments sorted newest period first. */
export function newestFirst<T extends { period: string; paidAt: string }>(payments: ReadonlyArray<T>): T[] {
  return [...payments].sort((a, b) => b.period.localeCompare(a.period) || b.paidAt.localeCompare(a.paidAt));
}
