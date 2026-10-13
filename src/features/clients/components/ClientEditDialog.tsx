import { useState, type FormEvent } from "react";
import { AlertTriangle, Mail, Phone, StickyNote, UserRound, Users, Wallet } from "lucide-react";
import {
  Button,
  DatePicker,
  DayOfMonthPicker,
  Dialog,
  FormSection,
  Input,
  TextArea,
} from "../../../shared/components";
import { sharedTexts } from "../../../shared/texts";
import type { Client } from "../api/clientsApi";
import {
  clientFormFrom,
  toClientUpdate,
  validateClientForm,
  type ClientFormErrors,
  type ClientFormValues,
} from "../lib/clientForm";
import { useClientsStore } from "../store/clientsStore";
import { clientsTexts } from "../texts";

type ClientEditDialogProps = {
  open: boolean;
  onClose: () => void;
  client: Client;
};

export function ClientEditDialog({ open, onClose, client }: ClientEditDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={clientsTexts.edit.title}>
      {open && <ClientEditBody client={client} onClose={onClose} />}
    </Dialog>
  );
}

function ClientEditBody({ client, onClose }: Omit<ClientEditDialogProps, "open">) {
  const updateClient = useClientsStore((state) => state.update);
  const [values, setValues] = useState(() => clientFormFrom(client));
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { form, edit } = clientsTexts;
  const isPromo = client.planType === "PROMO";

  function setField<K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateClientForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSaveError(null);
    try {
      await updateClient(client.id, toClientUpdate(values));
      onClose();
    } catch {
      setSaveError(edit.saveError);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 pt-1">
      <FormSection icon={UserRound} title={form.sections.client}>
        <Input
          label={form.name}
          value={values.name}
          onChange={(event) => setField("name", event.target.value)}
          error={errors.name}
          autoComplete="off"
        />
        <Input
          label={form.phone}
          type="tel"
          icon={Phone}
          inputMode="tel"
          autoComplete="off"
          value={values.phone}
          onChange={(event) => setField("phone", event.target.value)}
        />
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
      </FormSection>

      {isPromo && (
        <FormSection icon={Users} title={form.sections.second}>
          <Input
            label={form.secondName}
            autoComplete="off"
            value={values.secondName}
            onChange={(event) => setField("secondName", event.target.value)}
          />
          <Input
            label={form.secondSpotifyEmail}
            type="email"
            icon={Mail}
            inputMode="email"
            autoComplete="off"
            value={values.secondSpotifyEmail}
            onChange={(event) => setField("secondSpotifyEmail", event.target.value)}
            error={errors.secondSpotifyEmail}
          />
        </FormSection>
      )}

      <FormSection icon={Wallet} title={form.sections.payment}>
        <DatePicker
          label={form.startDate}
          value={values.startDate}
          onChange={(value) => setField("startDate", value)}
          error={errors.startDate}
        />
        <DayOfMonthPicker
          label={form.paymentDay}
          value={values.paymentDay}
          onChange={(day) => setField("paymentDay", day)}
          error={errors.paymentDay}
        />
        <Input
          label={form.amount}
          inputMode="numeric"
          value={values.amount}
          onChange={(event) => setField("amount", event.target.value)}
          error={errors.amount}
        />
      </FormSection>

      <FormSection icon={StickyNote} title={form.sections.notes}>
        <TextArea label={form.notes} value={values.notes} onChange={(event) => setField("notes", event.target.value)} />
      </FormSection>

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
          {edit.save}
        </Button>
      </div>
    </form>
  );
}
