import { addMonths, differenceInCalendarDays, parse } from "date-fns";
import type { SlotTileOccupant } from "../../accounts";
import { currentPeriod, dueDate, paymentStatus, type Payment } from "../../payments";
import type { Client } from "../api/clientsApi";

/** Payments grouped by client id. */
export function paymentsByClient(payments: ReadonlyArray<Payment>): Map<string, Payment[]> {
  const grouped = new Map<string, Payment[]>();
  for (const payment of payments) {
    const list = grouped.get(payment.clientId);
    if (list) list.push(payment);
    else grouped.set(payment.clientId, [payment]);
  }
  return grouped;
}

/** Due date of the first unpaid period from the current one on, so payments made in advance push it forward. */
export function nextDueDate(client: Client, payments: ReadonlyArray<Payment>, today: Date): string {
  const paid = new Set(payments.map((payment) => payment.period));
  let months = 0;
  while (paid.has(currentPeriod(addMonths(today, months)))) months += 1;
  return dueDate(currentPeriod(addMonths(today, months)), client.paymentDay);
}

/** ACTIVE clients of `accountId` as slot grid tiles. */
export function buildOccupants(
  accountId: string,
  clients: ReadonlyArray<Client>,
  payments: ReadonlyArray<Payment>,
  today: Date,
): SlotTileOccupant[] {
  const grouped = paymentsByClient(payments);
  return clients
    .filter((client) => client.accountId === accountId && client.status === "ACTIVE")
    .map((client) => {
      const clientPayments = grouped.get(client.id) ?? [];
      return {
        id: client.id,
        name: client.name,
        amount: client.amount,
        planType: client.planType,
        slots: client.slots,
        status: paymentStatus({ ...client, payments: clientPayments }, today),
        nextDueDate: nextDueDate(client, clientPayments, today),
      };
    });
}

/** Calendar days from `today` to `isoDate`; negative when it already passed. */
export function daysUntil(isoDate: string, today: Date): number {
  return differenceInCalendarDays(parse(isoDate, "yyyy-MM-dd", new Date()), today);
}
