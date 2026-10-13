import { addMonths, differenceInCalendarDays, parse } from "date-fns";
import { slotsInAccount, type SlotTileOccupant } from "../../accounts";
import { currentPeriod, dueDate, paymentStatus, type Payment } from "../../payments";
import type { Client } from "../api/clientsApi";
import { accountShare } from "./revenue";

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

/** ACTIVE clients holding a slot of `accountId`, as slot grid tiles. */
export function buildOccupants(
  accountId: string,
  clients: ReadonlyArray<Client>,
  payments: ReadonlyArray<Payment>,
  today: Date,
  /** Account id → alias, to name the other account of a split promo. */
  aliases: ReadonlyMap<string, string>,
): SlotTileOccupant[] {
  const grouped = paymentsByClient(payments);
  return clients
    .filter((client) => client.status === "ACTIVE" && slotsInAccount(client, accountId).length > 0)
    .map((client) => {
      const clientPayments = grouped.get(client.id) ?? [];
      const otherAccountId =
        client.secondAccountId && client.secondAccountId !== client.accountId
          ? client.accountId === accountId
            ? client.secondAccountId
            : client.accountId
          : null;
      return {
        id: client.id,
        name: client.name,
        amount: client.amount,
        share: accountShare(client, accountId),
        sharedWith: otherAccountId ? { accountId: otherAccountId, alias: aliases.get(otherAccountId) ?? "" } : null,
        planType: client.planType,
        slots: slotsInAccount(client, accountId),
        status: paymentStatus({ ...client, payments: clientPayments }, today),
        nextDueDate: nextDueDate(client, clientPayments, today),
      };
    });
}

/** Calendar days from `today` to `isoDate`; negative when it already passed. */
export function daysUntil(isoDate: string, today: Date): number {
  return differenceInCalendarDays(parse(isoDate, "yyyy-MM-dd", new Date()), today);
}
