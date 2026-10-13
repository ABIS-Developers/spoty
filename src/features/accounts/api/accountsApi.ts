import { getDataClient, listAll, throwIfErrors } from "../../../shared/api/dataClient";

export type AccountStatus = "ACTIVE" | "CLOSED";

export type Account = {
  id: string;
  alias: string;
  spotifyEmail: string;
  spotifyPassword: string;
  billingDay: number;
  monthlyCost: number;
  status: AccountStatus;
  notes: string | null;
};

export type AccountInput = Omit<Account, "id" | "status">;

const ACCOUNT_FIELDS = [
  "id",
  "alias",
  "spotifyEmail",
  "spotifyPassword",
  "billingDay",
  "monthlyCost",
  "status",
  "notes",
] as const;

type AccountRecord = {
  [K in keyof Account]: K extends "status" ? AccountStatus | null : Account[K] | null;
};

function toAccount(record: AccountRecord): Account {
  return {
    id: record.id ?? "",
    alias: record.alias ?? "",
    spotifyEmail: record.spotifyEmail ?? "",
    spotifyPassword: record.spotifyPassword ?? "",
    billingDay: record.billingDay ?? 1,
    monthlyCost: record.monthlyCost ?? 0,
    status: record.status ?? "ACTIVE",
    notes: record.notes ?? null,
  };
}

function requireData<T>(data: T | null | undefined): T {
  if (!data) throw new Error("Empty response from the API.");
  return data;
}

export const accountsApi = {
  async list(): Promise<Account[]> {
    const records = await listAll((nextToken) =>
      getDataClient().models.Account.list({ selectionSet: ACCOUNT_FIELDS, limit: 1000, nextToken }),
    );
    return records.map(toAccount);
  },

  async create(input: AccountInput): Promise<Account> {
    const { data, errors } = await getDataClient().models.Account.create({ ...input, status: "ACTIVE" });
    throwIfErrors(errors);
    return toAccount(requireData(data));
  },

  async update(id: string, input: Partial<AccountInput> & { status?: AccountStatus }): Promise<Account> {
    const { data, errors } = await getDataClient().models.Account.update({ id, ...input });
    throwIfErrors(errors);
    return toAccount(requireData(data));
  },
};
