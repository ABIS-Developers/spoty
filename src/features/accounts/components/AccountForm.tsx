import { useState, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, CalendarDays, KeyRound, Mail, StickyNote, Tag, type LucideIcon } from "lucide-react";
import { Button, DayOfMonthPicker, Dialog, Input, TextArea } from "../../../shared/components";
import { sharedTexts } from "../../../shared/texts";
import type { Account } from "../api/accountsApi";
import {
  emptyAccountForm,
  toAccountInput,
  validateAccountForm,
  type AccountFormErrors,
  type AccountFormValues,
} from "../lib/accountForm";
import { useAccountsStore } from "../store/accountsStore";
import { accountsTexts } from "../texts";

type AccountFormProps = {
  open: boolean;
  onClose: () => void;
  /** Edit this account; create a new one when omitted. */
  account?: Account;
  onSaved?: (account: Account) => void;
};

function valuesFrom(account?: Account): AccountFormValues {
  if (!account) return emptyAccountForm();
  return {
    alias: account.alias,
    spotifyEmail: account.spotifyEmail,
    spotifyPassword: account.spotifyPassword,
    billingDay: account.billingDay,
    monthlyCost: String(account.monthlyCost),
    notes: account.notes ?? "",
  };
}

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-olive-700 uppercase">
        <Icon aria-hidden="true" className="size-4" />
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

export function AccountForm({ open, onClose, account, onSaved }: AccountFormProps) {
  return (
    <Dialog open={open} onClose={onClose} title={account ? accountsTexts.form.editTitle : accountsTexts.form.createTitle}>
      {/* Remount per open so the form starts from fresh values. */}
      {open && <AccountFormBody account={account} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function AccountFormBody({ account, onClose, onSaved }: Omit<AccountFormProps, "open">) {
  const createAccount = useAccountsStore((state) => state.create);
  const updateAccount = useAccountsStore((state) => state.update);
  const [values, setValues] = useState(() => valuesFrom(account));
  const [errors, setErrors] = useState<AccountFormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { form } = accountsTexts;

  function setField<K extends keyof AccountFormValues>(key: K, value: AccountFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateAccountForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSaveError(null);
    try {
      const input = toAccountInput(values);
      const saved = account ? await updateAccount(account.id, input) : await createAccount(input);
      onSaved?.(saved);
      onClose();
    } catch {
      setSaveError(form.saveError);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 pt-1">
      <Section icon={Tag} title={form.sections.general}>
        <Input
          label={form.alias}
          placeholder={form.aliasPlaceholder}
          value={values.alias}
          onChange={(event) => setField("alias", event.target.value)}
          error={errors.alias}
          autoComplete="off"
        />
      </Section>

      <Section icon={KeyRound} title={form.sections.access}>
        <Input
          label={form.spotifyEmail}
          type="email"
          icon={Mail}
          inputMode="email"
          autoComplete="off"
          value={values.spotifyEmail}
          onChange={(event) => setField("spotifyEmail", event.target.value)}
          error={errors.spotifyEmail}
        />
        <Input
          label={form.spotifyPassword}
          type="text"
          icon={KeyRound}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="off"
          value={values.spotifyPassword}
          onChange={(event) => setField("spotifyPassword", event.target.value)}
          error={errors.spotifyPassword}
        />
      </Section>

      <Section icon={CalendarDays} title={form.sections.billing}>
        <DayOfMonthPicker
          label={form.billingDay}
          hint={form.billingDayHint}
          value={values.billingDay}
          onChange={(day) => setField("billingDay", day)}
          error={errors.billingDay}
        />
        <Input
          label={form.monthlyCost}
          hint={form.monthlyCostHint}
          inputMode="numeric"
          value={values.monthlyCost}
          onChange={(event) => setField("monthlyCost", event.target.value)}
          error={errors.monthlyCost}
        />
      </Section>

      <Section icon={StickyNote} title={form.sections.notes}>
        <TextArea
          label={form.notes}
          value={values.notes}
          onChange={(event) => setField("notes", event.target.value)}
        />
      </Section>

      {saveError && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-status-overdue">
          <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
          {saveError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          {sharedTexts.cancel}
        </Button>
        <Button type="submit" loading={saving}>
          {account ? form.save : form.create}
        </Button>
      </div>
    </form>
  );
}
