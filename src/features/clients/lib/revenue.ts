import { isSplitPromo } from "../../accounts";
import type { Client } from "../api/clientsApi";

/**
 * Part of `client.amount` attributed to `accountId`.
 * A promo split across 2 accounts gives each account the half that pays for its slot;
 * the payer's account takes the odd peso.
 */
export function accountShare(
  client: Pick<Client, "planType" | "amount" | "accountId" | "secondAccountId" | "slot" | "secondSlot" | "status">,
  accountId: string,
): number {
  if (!isSplitPromo(client)) return client.accountId === accountId ? client.amount : 0;
  if (accountId === client.accountId) return Math.ceil(client.amount / 2);
  if (accountId === client.secondAccountId) return Math.floor(client.amount / 2);
  return 0;
}
