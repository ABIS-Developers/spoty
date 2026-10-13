import { SLOTS_PER_ACCOUNT } from "../../clients";

export const ADMIN_SLOT = 0;

/** Sellable slot numbers, 1–5. */
export const SELLABLE_SLOTS: readonly number[] = Array.from(
  { length: SLOTS_PER_ACCOUNT },
  (_, index) => index + 1,
);

export type SlotClient = {
  accountId: string;
  status: "ACTIVE" | "CANCELLED";
  slots: ReadonlyArray<number | null>;
};

/** Slots taken by ACTIVE clients of `account`. */
export function occupiedSlots(account: { id: string }, clients: ReadonlyArray<SlotClient>): number[] {
  return clients
    .filter((client) => client.accountId === account.id && client.status === "ACTIVE")
    .flatMap((client) => client.slots)
    .filter((slot): slot is number => slot !== null)
    .sort((a, b) => a - b);
}

/** Sellable slots no ACTIVE client of `account` holds. */
export function freeSlots(account: { id: string }, clients: ReadonlyArray<SlotClient>): number[] {
  const taken = new Set(occupiedSlots(account, clients));
  return SELLABLE_SLOTS.filter((slot) => !taken.has(slot));
}

/** True when every `selected` slot is sellable, distinct and currently free. */
export function areSlotsFree(
  selected: ReadonlyArray<number>,
  account: { id: string },
  clients: ReadonlyArray<SlotClient>,
): boolean {
  const free = new Set(freeSlots(account, clients));
  return new Set(selected).size === selected.length && selected.every((slot) => free.has(slot));
}
