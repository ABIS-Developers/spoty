import { getDate } from "date-fns";
import { parseISODate } from "../../../shared/lib/dates";
import type { Client, ClientInput } from "../api/clientsApi";
import { PRICES, type PlanType } from "./pricing";
import { clientsTexts } from "../texts";

export type ClientFormValues = {
  planType: PlanType;
  /** Person 1 (payer) slot in the form's account. */
  slot: number | null;
  /** PROMO only: account of person 2's slot; starts as the form's account. */
  secondAccountId: string;
  /** PROMO only: person 2 slot in `secondAccountId`. */
  secondSlot: number | null;
  name: string;
  phone: string;
  spotifyEmail: string;
  secondName: string;
  secondSpotifyEmail: string;
  /** `YYYY-MM-DD` */
  startDate: string;
  paymentDay: number | null;
  amount: string;
  firstPaymentReceived: boolean;
  notes: string;
};

export type ClientFormErrors = Partial<Record<keyof ClientFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emptyClientForm(startDate: string, accountId: string, slot: number | null): ClientFormValues {
  return {
    planType: "SINGLE",
    slot,
    secondAccountId: accountId,
    secondSlot: null,
    name: "",
    phone: "",
    spotifyEmail: "",
    secondName: "",
    secondSpotifyEmail: "",
    startDate,
    paymentDay: getDate(parseISODate(startDate)),
    amount: String(PRICES.SINGLE),
    firstPaymentReceived: true,
    notes: "",
  };
}

/** Tapping the selected slot clears it; any other slot replaces it. */
export function toggleSingleSlot(selected: number | null, slot: number): number | null {
  return selected === slot ? null : slot;
}

export function validateClientForm(values: ClientFormValues, accountId: string): ClientFormErrors {
  const errors: ClientFormErrors = {};
  const { errors: texts } = clientsTexts.form;
  const isPromo = values.planType === "PROMO";

  if (values.slot === null) errors.slot = texts.slotRequired;
  if (isPromo) {
    if (values.secondSlot === null) errors.secondSlot = texts.secondSlotRequired;
    else if (values.secondAccountId === accountId && values.secondSlot === values.slot) {
      errors.secondSlot = texts.sameSlot;
    }
  }
  if (!values.name.trim()) errors.name = texts.nameRequired;
  if (values.spotifyEmail.trim() && !EMAIL_PATTERN.test(values.spotifyEmail.trim())) {
    errors.spotifyEmail = texts.emailInvalid;
  }
  if (isPromo && values.secondSpotifyEmail.trim() && !EMAIL_PATTERN.test(values.secondSpotifyEmail.trim())) {
    errors.secondSpotifyEmail = texts.emailInvalid;
  }
  if (!values.startDate) errors.startDate = texts.startDateRequired;
  if (values.paymentDay === null || values.paymentDay < 1 || values.paymentDay > 31) {
    errors.paymentDay = texts.paymentDayInvalid;
  }
  if (!/^\d+$/.test(values.amount.trim())) errors.amount = texts.amountInvalid;
  return errors;
}

/** Valid form values → API input. Second-person fields are dropped for SINGLE. */
export function toClientInput(accountId: string, values: ClientFormValues): ClientInput {
  const isPromo = values.planType === "PROMO";
  const optional = (value: string) => value.trim() || null;
  return {
    accountId,
    name: values.name.trim(),
    phone: optional(values.phone),
    spotifyEmail: optional(values.spotifyEmail),
    notes: optional(values.notes),
    startDate: values.startDate,
    paymentDay: values.paymentDay ?? 1,
    planType: values.planType,
    amount: Number(values.amount.trim()),
    slot: values.slot ?? 0,
    secondAccountId: isPromo ? values.secondAccountId : null,
    secondSlot: isPromo ? values.secondSlot : null,
    secondName: isPromo ? optional(values.secondName) : null,
    secondSpotifyEmail: isPromo ? optional(values.secondSpotifyEmail) : null,
  };
}

/** Form values for editing an existing client. */
export function clientFormFrom(client: Client): ClientFormValues {
  return {
    planType: client.planType,
    slot: client.slot,
    secondAccountId: client.secondAccountId ?? client.accountId,
    secondSlot: client.secondSlot,
    name: client.name,
    phone: client.phone ?? "",
    spotifyEmail: client.spotifyEmail ?? "",
    secondName: client.secondName ?? "",
    secondSpotifyEmail: client.secondSpotifyEmail ?? "",
    startDate: client.startDate,
    paymentDay: client.paymentDay,
    amount: String(client.amount),
    firstPaymentReceived: false,
    notes: client.notes ?? "",
  };
}

/** Editable fields only; plan, accounts and slots are fixed after registration. */
export function toClientUpdate(values: ClientFormValues): Partial<ClientInput> {
  const input = toClientInput("", values);
  return {
    name: input.name,
    phone: input.phone,
    spotifyEmail: input.spotifyEmail,
    notes: input.notes,
    startDate: input.startDate,
    paymentDay: input.paymentDay,
    amount: input.amount,
    secondName: input.secondName,
    secondSpotifyEmail: input.secondSpotifyEmail,
  };
}
