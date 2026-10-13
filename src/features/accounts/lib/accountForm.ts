import { DEFAULT_ACCOUNT_COST } from "../../clients";
import type { AccountInput } from "../api/accountsApi";
import { accountsTexts } from "../texts";

export type AccountFormValues = {
  alias: string;
  spotifyEmail: string;
  spotifyPassword: string;
  billingDay: number | null;
  monthlyCost: string;
  notes: string;
};

export type AccountFormErrors = Partial<Record<keyof AccountFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emptyAccountForm(): AccountFormValues {
  return {
    alias: "",
    spotifyEmail: "",
    spotifyPassword: "",
    billingDay: null,
    monthlyCost: String(DEFAULT_ACCOUNT_COST),
    notes: "",
  };
}

export function validateAccountForm(values: AccountFormValues): AccountFormErrors {
  const errors: AccountFormErrors = {};
  const { errors: texts } = accountsTexts.form;
  if (!values.alias.trim()) errors.alias = texts.aliasRequired;
  if (!EMAIL_PATTERN.test(values.spotifyEmail.trim())) errors.spotifyEmail = texts.emailInvalid;
  if (!values.spotifyPassword) errors.spotifyPassword = texts.passwordRequired;
  if (values.billingDay === null || values.billingDay < 1 || values.billingDay > 31) {
    errors.billingDay = texts.billingDayInvalid;
  }
  const cost = values.monthlyCost.trim();
  if (cost && !/^\d+$/.test(cost)) errors.monthlyCost = texts.costInvalid;
  return errors;
}

/** Valid form values → API input. An empty cost falls back to the default. */
export function toAccountInput(values: AccountFormValues): AccountInput {
  const cost = values.monthlyCost.trim();
  return {
    alias: values.alias.trim(),
    spotifyEmail: values.spotifyEmail.trim(),
    spotifyPassword: values.spotifyPassword,
    billingDay: values.billingDay ?? 1,
    monthlyCost: cost ? Number(cost) : DEFAULT_ACCOUNT_COST,
    notes: values.notes.trim() || null,
  };
}
