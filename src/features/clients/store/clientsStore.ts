import { create } from "zustand";
import { areSlotsFree } from "../../accounts";
import { clientsApi, type Client, type ClientInput } from "../api/clientsApi";

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
    const fresh = await clientsApi.listByAccount(input.accountId);
    if (!areSlotsFree(input.slots, { id: input.accountId }, fresh)) throw new SlotsTakenError();
    const client = await clientsApi.create(input);
    set((state) => ({ clients: upsert(state.clients, client) }));
    return client;
  },
}));
