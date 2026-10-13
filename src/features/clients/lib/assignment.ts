import { areSlotsFree, freeSlots, type SlotClient } from "../../accounts";
import type { PlanType } from "./pricing";

export type SlotAssignment = Pick<SlotClient, "accountId" | "slot" | "secondAccountId" | "secondSlot"> & {
  planType: PlanType;
};

/** True when the slot(s) a new client wants are all free and distinct. A PROMO must have both pairs. */
export function isAssignmentFree(assignment: SlotAssignment, clients: ReadonlyArray<SlotClient>): boolean {
  const { planType, accountId, slot, secondAccountId, secondSlot } = assignment;
  if (planType === "SINGLE") return areSlotsFree([slot], { id: accountId }, clients);
  if (secondAccountId === null || secondSlot === null) return false;
  if (secondAccountId === accountId) {
    return areSlotsFree([slot, secondSlot], { id: accountId }, clients);
  }
  return (
    areSlotsFree([slot], { id: accountId }, clients) && areSlotsFree([secondSlot], { id: secondAccountId }, clients)
  );
}

/** True when a PROMO fits: 2 free slots in `accountId`, or 1 there and 1 in another active account. */
export function canFitPromo(
  accountId: string,
  activeAccountIds: ReadonlyArray<string>,
  clients: ReadonlyArray<SlotClient>,
): boolean {
  const freeHere = freeSlots({ id: accountId }, clients).length;
  if (freeHere >= 2) return true;
  if (freeHere === 0) return false;
  return activeAccountIds.some((id) => id !== accountId && freeSlots({ id }, clients).length > 0);
}
