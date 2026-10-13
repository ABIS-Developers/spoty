import { create } from "zustand";
import { accountsApi, type Account, type AccountInput } from "../api/accountsApi";

type LoadStatus = "idle" | "loading" | "ready" | "error";

type AccountsState = {
  accounts: Account[];
  status: LoadStatus;
  load: () => Promise<void>;
  /** Throws on failure so the form can show the error inline. */
  create: (input: AccountInput) => Promise<Account>;
  update: (id: string, input: Partial<AccountInput>) => Promise<Account>;
  /** Soft close: `status: CLOSED`; history is kept. */
  close: (id: string) => Promise<Account>;
};

function upsert(accounts: Account[], account: Account): Account[] {
  const exists = accounts.some((item) => item.id === account.id);
  return exists ? accounts.map((item) => (item.id === account.id ? account : item)) : [...accounts, account];
}

export const useAccountsStore = create<AccountsState>((set) => ({
  accounts: [],
  status: "idle",

  load: async () => {
    set({ status: "loading" });
    try {
      const accounts = await accountsApi.list();
      set({ accounts, status: "ready" });
    } catch {
      set({ status: "error" });
    }
  },

  create: async (input) => {
    const account = await accountsApi.create(input);
    set((state) => ({ accounts: upsert(state.accounts, account) }));
    return account;
  },

  update: async (id, input) => {
    const account = await accountsApi.update(id, input);
    set((state) => ({ accounts: upsert(state.accounts, account) }));
    return account;
  },

  close: async (id) => {
    const account = await accountsApi.update(id, { status: "CLOSED" });
    set((state) => ({ accounts: upsert(state.accounts, account) }));
    return account;
  },
}));
