import { create } from "zustand";
import { paymentsApi, type Payment, type PaymentInput } from "../api/paymentsApi";

type LoadStatus = "idle" | "loading" | "ready" | "error";

type PaymentsState = {
  payments: Payment[];
  status: LoadStatus;
  load: () => Promise<void>;
  /** Throws on failure so the caller can show the error inline. */
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
    const payment = await paymentsApi.create(input);
    set((state) => ({ payments: [...state.payments, payment] }));
    return payment;
  },
}));
