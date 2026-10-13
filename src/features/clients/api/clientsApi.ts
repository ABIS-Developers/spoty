import { getDataClient, listAll, throwIfErrors } from "../../../shared/api/dataClient";
import type { PlanType } from "../lib/pricing";

export type ClientStatus = "ACTIVE" | "CANCELLED";

export type Client = {
  id: string;
  accountId: string;
  name: string;
  phone: string | null;
  spotifyEmail: string | null;
  notes: string | null;
  /** `YYYY-MM-DD` */
  startDate: string;
  paymentDay: number;
  planType: PlanType;
  amount: number;
  /** Person 1 (payer) slot in `accountId`. */
  slot: number;
  /** PROMO only; equals `accountId` when both slots are in one account. */
  secondAccountId: string | null;
  /** PROMO only; person 2 slot in `secondAccountId`. */
  secondSlot: number | null;
  secondName: string | null;
  secondSpotifyEmail: string | null;
  status: ClientStatus;
  cancelledAt: string | null;
};

export type ClientInput = Omit<Client, "id" | "status" | "cancelledAt">;

const CLIENT_FIELDS = [
  "id",
  "accountId",
  "name",
  "phone",
  "spotifyEmail",
  "notes",
  "startDate",
  "paymentDay",
  "planType",
  "amount",
  "slot",
  "secondAccountId",
  "secondSlot",
  "secondName",
  "secondSpotifyEmail",
  "status",
  "cancelledAt",
] as const;

type ClientRecord = { [K in keyof Client]: Client[K] | null };

function toClient(record: ClientRecord): Client {
  return {
    id: record.id ?? "",
    accountId: record.accountId ?? "",
    name: record.name ?? "",
    phone: record.phone ?? null,
    spotifyEmail: record.spotifyEmail ?? null,
    notes: record.notes ?? null,
    startDate: record.startDate ?? "",
    paymentDay: record.paymentDay ?? 1,
    planType: record.planType ?? "SINGLE",
    amount: record.amount ?? 0,
    slot: record.slot ?? 0,
    secondAccountId: record.secondAccountId ?? null,
    secondSlot: record.secondSlot ?? null,
    secondName: record.secondName ?? null,
    secondSpotifyEmail: record.secondSpotifyEmail ?? null,
    status: record.status ?? "ACTIVE",
    cancelledAt: record.cancelledAt ?? null,
  };
}

function requireData<T>(data: T | null | undefined): T {
  if (!data) throw new Error("Empty response from the API.");
  return data;
}

export const clientsApi = {
  async list(): Promise<Client[]> {
    const records = await listAll((nextToken) =>
      getDataClient().models.Client.list({ selectionSet: CLIENT_FIELDS, limit: 1000, nextToken }),
    );
    return records.map(toClient);
  },

  /** Fresh clients holding any slot of the given accounts, to re-validate slots right before saving. */
  async listByAccounts(accountIds: ReadonlyArray<string>): Promise<Client[]> {
    const ids = [...new Set(accountIds)];
    const records = await listAll((nextToken) =>
      getDataClient().models.Client.list({
        filter: {
          or: ids.flatMap((id) => [{ accountId: { eq: id } }, { secondAccountId: { eq: id } }]),
        },
        selectionSet: CLIENT_FIELDS,
        limit: 1000,
        nextToken,
      }),
    );
    return records.map(toClient);
  },

  async create(input: ClientInput): Promise<Client> {
    const { data, errors } = await getDataClient().models.Client.create({ ...input, status: "ACTIVE" });
    throwIfErrors(errors);
    return toClient(requireData(data));
  },

  async update(
    id: string,
    input: Partial<ClientInput> & { status?: ClientStatus; cancelledAt?: string | null },
  ): Promise<Client> {
    const { data, errors } = await getDataClient().models.Client.update({ id, ...input });
    throwIfErrors(errors);
    return toClient(requireData(data));
  },
};
