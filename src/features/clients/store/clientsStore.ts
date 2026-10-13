import { create } from "zustand";
import { clientsApi, type Client, type ClientInput } from "../api/clientsApi";
import { isAssignmentFree } from "../lib/assignment";

type LoadStatus = "idle" | "loading" | "ready" | "error";

export class SlotsTakenError extends Error {
  constructor() {
    super("The selected slots are no longer free.");
    this.name = "SlotsTakenError";
  }
}

type ClientsState = {
  clients: Client[];
  status: LoadStatus;
  load: () => Promise<void>;
  /** Re-checks the slots against fresh data, then creates. Throws on failure. */
  create: (input: ClientInput) => Promise<Client>;
  /** Throws on failure so the form can show the error inline. */
  update: (id: string, input: Partial<ClientInput>) => Promise<Client>;
  /** Sets CANCELLED + cancelledAt; the slot(s) become free because only ACTIVE clients hold slots. */
  cancel: (id: string, cancelledAt: string) => Promise<Client>;
};

function upsert(clients: Client[], client: Client): Client[] {
  const exists = clients.some((item) => item.id === client.id);
  return exists ? clients.map((item) => (item.id === client.id ? client : item)) : [...clients, client];
}

export const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  status: "idle",

  load: async () => {
    set({ status: "loading" });
    try {
      const clients = await clientsApi.list();
      set({ clients, status: "ready" });
    } catch {
      set({ status: "error" });
    }
  },

  create: async (input) => {
    const accountIds = [input.accountId, ...(input.secondAccountId ? [input.secondAccountId] : [])];
    const fresh = await clientsApi.listByAccounts(accountIds);
    if (!isAssignmentFree(input, fresh)) throw new SlotsTakenError();
    const client = await clientsApi.create(input);
    set((state) => ({ clients: upsert(state.clients, client) }));
    return client;
  },

  update: async (id, input) => {
    const client = await clientsApi.update(id, input);
    set((state) => ({ clients: upsert(state.clients, client) }));
    return client;
  },

  cancel: async (id, cancelledAt) => {
    const client = await clientsApi.update(id, { status: "CANCELLED", cancelledAt });
    set((state) => ({ clients: upsert(state.clients, client) }));
    return client;
  },
}));
