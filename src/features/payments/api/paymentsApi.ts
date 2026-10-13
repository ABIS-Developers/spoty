import { getDataClient, listAll, throwIfErrors } from "../../../shared/api/dataClient";

export type Payment = {
  id: string;
  clientId: string;
  /** `YYYY-MM` */
  period: string;
  /** `YYYY-MM-DD` */
  paidAt: string;
  amount: number;
};

export type PaymentInput = Omit<Payment, "id">;

const PAYMENT_FIELDS = ["id", "clientId", "period", "paidAt", "amount"] as const;

type PaymentRecord = { [K in keyof Payment]: Payment[K] | null };

function toPayment(record: PaymentRecord): Payment {
  return {
    id: record.id ?? "",
    clientId: record.clientId ?? "",
    period: record.period ?? "",
    paidAt: record.paidAt ?? "",
    amount: record.amount ?? 0,
  };
}

export const paymentsApi = {
  async list(): Promise<Payment[]> {
    const records = await listAll((nextToken) =>
      getDataClient().models.Payment.list({ selectionSet: PAYMENT_FIELDS, limit: 1000, nextToken }),
    );
    return records.map(toPayment);
  },

  /** Fresh payments of one client, to re-check duplicates right before saving. */
  async listByClient(clientId: string): Promise<Payment[]> {
    const records = await listAll((nextToken) =>
      getDataClient().models.Payment.list({
        filter: { clientId: { eq: clientId } },
        selectionSet: PAYMENT_FIELDS,
        limit: 1000,
        nextToken,
      }),
    );
    return records.map(toPayment);
  },

  async create(input: PaymentInput): Promise<Payment> {
    const { data, errors } = await getDataClient().models.Payment.create(input);
    throwIfErrors(errors);
    if (!data) throw new Error("Empty response from the API.");
    return toPayment(data);
  },
};
