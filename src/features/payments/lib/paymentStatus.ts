import { format, getDaysInMonth, parse } from "date-fns";

export type PaymentStatus = "PAID" | "PENDING" | "OVERDUE";

export type PaymentStatusInput = {
  status: "ACTIVE" | "CANCELLED";
  paymentDay: number;
  payments: ReadonlyArray<{ period: string }>;
};

const ISO_DATE = "yyyy-MM-dd";
const PERIOD = "yyyy-MM";

/** `today` formatted as `YYYY-MM`. */
export function currentPeriod(today: Date): string {
  return format(today, PERIOD);
}

/** Due date (`YYYY-MM-DD`) of `period`, clamped to the month's last day. */
export function dueDate(period: string, paymentDay: number): string {
  const firstDay = parse(period, PERIOD, new Date());
  const day = Math.min(paymentDay, getDaysInMonth(firstDay));
  return format(new Date(firstDay.getFullYear(), firstDay.getMonth(), day), ISO_DATE);
}

/** Status for the current period, or `null` for cancelled clients. */
export function paymentStatus(client: PaymentStatusInput, today: Date): PaymentStatus | null {
  if (client.status === "CANCELLED") return null;

  const period = currentPeriod(today);
  if (client.payments.some((payment) => payment.period === period)) return "PAID";

  // ISO date strings compare correctly as plain strings.
  return format(today, ISO_DATE) <= dueDate(period, client.paymentDay) ? "PENDING" : "OVERDUE";
}
