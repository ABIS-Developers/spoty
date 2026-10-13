import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getDate } from "date-fns";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  LayoutGrid,
  Mail,
  Phone,
  StickyNote,
  User,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import {
  Button,
  DatePicker,
  DayOfMonthPicker,
  EmptyState,
  FormSection,
  Input,
  PageSpinner,
  SelectableCard,
  TextArea,
} from "../../../shared/components";
import { parseISODate, toISODate } from "../../../shared/lib/dates";
import { formatMoney } from "../../../shared/lib/money";
import { useAccountsStore } from "../../accounts";
import { currentPeriod, usePaymentsStore } from "../../payments";
import type { Client } from "../api/clientsApi";
import { useClientsData } from "../hooks/useClientsData";
import {
  emptyClientForm,
  toClientInput,
  toggleSlot,
  validateClientForm,
  type ClientFormErrors,
  type ClientFormValues,
} from "../lib/clientForm";
import { PRICES, type PlanType } from "../lib/pricing";
import { SlotsTakenError, useClientsStore } from "../store/clientsStore";
import { clientsTexts } from "../texts";
import { SlotPicker } from "./SlotPicker";

/** `#/accounts/:id/clients/new?slot=N` */
export function ClientForm() {
  const { id: accountId = "" } = useParams();
  const [params] = useSearchParams();
  const accounts = useAccountsStore((state) => state.accounts);
  const accountsStatus = useAccountsStore((state) => state.status);
  const loadAccounts = useAccountsStore((state) => state.load);
  const { clients, status, retry } = useClientsData();
  const { form } = clientsTexts;

  useEffect(() => {
    if (accountsStatus === "idle") void loadAccounts();
  }, [accountsStatus, loadAccounts]);

  const account = accounts.find((item) => item.id === accountId);

  const backLink = (
    <Link
      to={`/accounts/${accountId}`}
      className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg pr-2 text-sm font-medium text-olive-700 hover:text-olive-950"
    >
      <ArrowLeft aria-hidden="true" className="size-5" />
      {form.back}
    </Link>
  );

  if (status === "error" || accountsStatus === "error") {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center">
        <p className="flex items-center gap-2 text-status-overdue">
          <AlertTriangle aria-hidden="true" className="size-5" />
          {form.loadError}
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            retry();
            if (accountsStatus === "error") void loadAccounts();
          }}
        >
          {form.retry}
        </Button>
      </div>
    );
  }
  if (status !== "ready" || (!account && accountsStatus !== "ready")) return <PageSpinner />;
  if (!account || account.status !== "ACTIVE") {
    return (
      <>
        {backLink}
        <EmptyState icon={LayoutGrid} title={account ? form.accountClosed : form.accountNotFound} />
      </>
    );
  }

  const requested = Number(params.get("slot"));
  return (
    <>
      {backLink}
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {form.title} <span className="font-normal text-olive-700">{form.in}</span> {account.alias}
      </h1>
      <ClientFormBody accountId={account.id} clients={clients} requestedSlot={requested || null} />
    </>
  );
}

type ClientFormBodyProps = {
  accountId: string;
  clients: ReadonlyArray<Client>;
  requestedSlot: number | null;
};

function ClientFormBody({ accountId, clients, requestedSlot }: ClientFormBodyProps) {
  const navigate = useNavigate();
  const createClient = useClientsStore((state) => state.create);
  const reloadClients = useClientsStore((state) => state.load);
  const createPayment = usePaymentsStore((state) => state.create);
  const { form, plans } = clientsTexts;

  const taken = useMemo(() => {
    const map = new Map<number, string>();
    for (const client of clients) {
      if (client.accountId !== accountId || client.status !== "ACTIVE") continue;
      for (const slot of client.slots) map.set(slot, client.name);
    }
    return map;
  }, [clients, accountId]);

  const [values, setValues] = useState<ClientFormValues>(() => {
    const slot = requestedSlot && !taken.has(requestedSlot) ? requestedSlot : null;
    return emptyClientForm(toISODate(new Date()), slot);
  });
  const [paymentDayTouched, setPaymentDayTouched] = useState(false);
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  /** Set when the client saved but the first payment did not. */
  const [savedWithoutPayment, setSavedWithoutPayment] = useState(false);
  const isPromo = values.planType === "PROMO";

  function setField<K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function selectPlan(planType: PlanType) {
    setValues((current) => ({
      ...current,
      planType,
      amount: String(PRICES[planType]),
      slots: planType === "SINGLE" ? current.slots.slice(-1) : current.slots,
    }));
    setErrors((current) => ({ ...current, slots: undefined, amount: undefined }));
  }

  function changeStartDate(startDate: string) {
    setValues((current) => ({
      ...current,
      startDate,
      paymentDay: paymentDayTouched ? current.paymentDay : getDate(parseISODate(startDate)),
    }));
    setErrors((current) => ({ ...current, startDate: undefined, paymentDay: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateClientForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSaveError(null);
    let client: Client;
    try {
      client = await createClient(toClientInput(accountId, values));
    } catch (error) {
      setSaving(false);
      if (error instanceof SlotsTakenError) {
        setSaveError(form.slotsTaken);
        setField("slots", []);
        void reloadClients();
      } else {
        setSaveError(form.saveError);
      }
      return;
    }

    if (values.firstPaymentReceived) {
      const today = new Date();
      try {
        await createPayment({
          clientId: client.id,
          period: currentPeriod(today),
          paidAt: toISODate(today),
          amount: client.amount,
        });
      } catch {
        setSaving(false);
        setSavedWithoutPayment(true);
        return;
      }
    }
    navigate(`/accounts/${accountId}`);
  }

  if (savedWithoutPayment) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6 text-center">
        <p className="flex items-center gap-2 text-status-overdue">
          <AlertTriangle aria-hidden="true" className="size-5 shrink-0" />
          {form.paymentError}
        </p>
        <Button onClick={() => navigate(`/accounts/${accountId}`)}>{form.back}</Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-8 rounded-2xl border border-beige-300 bg-white p-4 shadow-sm sm:p-6"
    >
      <FormSection icon={Wallet} title={form.sections.plan}>
        <div className="grid grid-cols-2 gap-3">
          <SelectableCard
            selected={!isPromo}
            onSelect={() => selectPlan("SINGLE")}
            icon={User}
            title={`${plans.singleCard} ${formatMoney(PRICES.SINGLE)}`}
            description={plans.singleDescription}
          />
          <SelectableCard
            selected={isPromo}
            onSelect={() => selectPlan("PROMO")}
            icon={Users}
            title={`${plans.promoCard} ${formatMoney(PRICES.PROMO)}`}
            description={plans.promoDescription}
          />
        </div>
      </FormSection>

      <FormSection icon={LayoutGrid} title={form.sections.slots}>
        <SlotPicker
          taken={taken}
          selected={values.slots}
          onToggle={(slot) => setField("slots", toggleSlot(values.slots, slot, values.planType))}
          label={form.sections.slots}
          hint={isPromo ? form.slotsHintPromo : form.slotsHintSingle}
          error={errors.slots}
        />
      </FormSection>

      <FormSection icon={UserRound} title={form.sections.client}>
        <Input
          label={form.name}
          value={values.name}
          onChange={(event) => setField("name", event.target.value)}
          error={errors.name}
          autoComplete="off"
        />
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
      </FormSection>

      {isPromo && (
        <FormSection icon={Users} title={form.sections.second}>
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        </FormSection>
      )}

      <FormSection icon={Wallet} title={form.sections.payment}>
        <div className="grid gap-4 sm:grid-cols-2">
          <DatePicker
            label={form.startDate}
            value={values.startDate}
            onChange={changeStartDate}
            error={errors.startDate}
          />
          <DayOfMonthPicker
            label={form.paymentDay}
            hint={form.paymentDayHint}
            value={values.paymentDay}
            onChange={(day) => {
              setPaymentDayTouched(true);
              setField("paymentDay", day);
            }}
            error={errors.paymentDay}
          />
        </div>
        <Input
          label={form.amount}
          hint={form.amountHint}
          inputMode="numeric"
          value={values.amount}
          onChange={(event) => setField("amount", event.target.value)}
          error={errors.amount}
        />
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl bg-beige-100 p-3">
          <input
            type="checkbox"
            checked={values.firstPaymentReceived}
            onChange={(event) => setField("firstPaymentReceived", event.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-olive-700"
          />
          <span>
            <span className="block font-medium">{form.firstPayment}</span>
            <span className="block text-sm text-olive-700">{form.firstPaymentHint}</span>
          </span>
        </label>
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
        <Button variant="secondary" onClick={() => navigate(`/accounts/${accountId}`)} disabled={saving}>
          {form.cancel}
        </Button>
        <Button type="submit" loading={saving}>
          {form.save}
        </Button>
      </div>
    </form>
  );
}
