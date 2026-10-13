import { SLOTS_PER_ACCOUNT } from "../../clients";

export const ADMIN_SLOT = 0;

/**
 * Sellable slot numbers, 1–5. A function, not a constant: accounts and clients
 * import each other, so nothing here may read an import at module load.
 */
export function sellableSlots(): number[] {
  return Array.from({ length: SLOTS_PER_ACCOUNT }, (_, index) => index + 1);
}

/** A client as the slot rules need it: person 1 pair, plus person 2 pair for promos. */
export type SlotClient = {
  accountId: string;
  slot: number;
  secondAccountId: string | null;
  secondSlot: number | null;
  status: "ACTIVE" | "CANCELLED";
};

/** Slots `client` holds in `accountId` (0, 1 or 2). */
export function slotsInAccount(client: SlotClient, accountId: string): number[] {
  const slots: number[] = [];
  if (client.accountId === accountId) slots.push(client.slot);
  if (client.secondAccountId === accountId && client.secondSlot !== null) slots.push(client.secondSlot);
  return slots.sort((a, b) => a - b);
}

/** True when a promo's 2 slots are in different accounts. */
export function isSplitPromo(client: SlotClient): boolean {
  return client.secondAccountId !== null && client.secondAccountId !== client.accountId;
}

/** Slots taken by ACTIVE clients in `account`, through either pair. */
export function occupiedSlots(account: { id: string }, clients: ReadonlyArray<SlotClient>): number[] {
  return clients
    .filter((client) => client.status === "ACTIVE")
    .flatMap((client) => slotsInAccount(client, account.id))
    .sort((a, b) => a - b);
}

/** Sellable slots no ACTIVE client holds in `account`. */
export function freeSlots(account: { id: string }, clients: ReadonlyArray<SlotClient>): number[] {
  const taken = new Set(occupiedSlots(account, clients));
  return sellableSlots().filter((slot) => !taken.has(slot));
}

/** True when every `selected` slot is sellable, distinct and currently free in `account`. */
export function areSlotsFree(
  selected: ReadonlyArray<number>,
  account: { id: string },
  clients: ReadonlyArray<SlotClient>,
): boolean {
  const free = new Set(freeSlots(account, clients));
  return new Set(selected).size === selected.length && selected.every((slot) => free.has(slot));
}

export type OccupantStatus = "PAID" | "PENDING" | "OVERDUE";

/** An ACTIVE client as the slot views need it. */
export type SlotOccupant = {
  slots: ReadonlyArray<number>;
  status: OccupantStatus | null;
};

/** Status shown on each sellable slot; absent means free. */
export function slotStatuses(occupants: ReadonlyArray<SlotOccupant>): Map<number, OccupantStatus | null> {
  const statuses = new Map<number, OccupantStatus | null>();
  for (const occupant of occupants) {
    for (const slot of occupant.slots) statuses.set(slot, occupant.status);
  }
  return statuses;
}
