import { create } from "zustand";
import { paymentsApi, type Payment, type PaymentInput } from "../api/paymentsApi";

export class DuplicatePaymentError extends Error {
  constructor() {
    super("A payment for this period already exists.");
    this.name = "DuplicatePaymentError";
  }
}

type LoadStatus = "idle" | "loading" | "ready" | "error";

type PaymentsState = {
  payments: Payment[];
  status: LoadStatus;
  load: () => Promise<void>;
  /** Re-checks fresh data for a payment of the same period, then creates. Throws on failure. */
  create: (input: PaymentInput) => Promise<Payment>;
};

export const usePaymentsStore = create<PaymentsState>((set) => ({
  payments: [],
  status: "idle",

  load: async () => {
    set({ status: "loading" });
    try {
      const payments = await paymentsApi.list();
      set({ payments, status: "ready" });
    } catch {
      set({ status: "error" });
    }
  },

  create: async (input) => {
    const fresh = await paymentsApi.listByClient(input.clientId);
    if (fresh.some((payment) => payment.period === input.period)) {
      // Sync local state so the form shows the period as already paid.
      set((state) => ({
        payments: [...state.payments.filter((payment) => payment.clientId !== input.clientId), ...fresh],
      }));
      throw new DuplicatePaymentError();
    }
    const payment = await paymentsApi.create(input);
    set((state) => ({ payments: [...state.payments, payment] }));
    return payment;
  },
}));
