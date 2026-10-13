export type PlanType = "SINGLE" | "PROMO";

export const PRICES = { SINGLE: 80, PROMO: 150 } as const;
export const SLOTS_PER_ACCOUNT = 5; // sellable slots, admin slot excluded
export const DEFAULT_ACCOUNT_COST = 240;

/** Number of slots each plan type occupies in an account. */
export const SLOTS_BY_PLAN: Record<PlanType, number> = { SINGLE: 1, PROMO: 2 };
