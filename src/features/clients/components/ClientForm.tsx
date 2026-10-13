import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getDate } from "date-fns";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Info,
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
import { freeSlots, slotsInAccount, useAccountsStore, type Account } from "../../accounts";
import { currentPeriod, usePaymentsStore } from "../../payments";
import type { Client } from "../api/clientsApi";
import { useClientsData } from "../hooks/useClientsData";
import {
  emptyClientForm,
  toClientInput,
  toggleSingleSlot,
  validateClientForm,
  type ClientFormErrors,
  type ClientFormValues,
} from "../lib/clientForm";
import { PRICES, type PlanType } from "../lib/pricing";
import { SlotsTakenError, useClientsStore } from "../store/clientsStore";
import { clientsTexts } from "../texts";
import { SlotPicker } from "./SlotPicker";
import { canFitPromo } from "../lib/assignment";

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
      <ClientFormBody
        account={account}
        accounts={accounts.filter((item) => item.status === "ACTIVE")}
        clients={clients}
        requestedSlot={requested || null}
      />
    </>
  );
}

type ClientFormBodyProps = {
  account: Account;
  /** ACTIVE accounts, offered for person 2's slot. */
  accounts: ReadonlyArray<Account>;
  clients: ReadonlyArray<Client>;
  requestedSlot: number | null;
};

/** Slot → name of the ACTIVE client holding it in `accountId`. */
function takenSlots(accountId: string, clients: ReadonlyArray<Client>): Map<number, string> {
  const map = new Map<number, string>();
  for (const client of clients) {
    if (client.status !== "ACTIVE") continue;
    for (const slot of slotsInAccount(client, accountId)) map.set(slot, client.name);
  }
  return map;
}

function ClientFormBody({ account, accounts, clients, requestedSlot }: ClientFormBodyProps) {
  const accountId = account.id;
  const navigate = useNavigate();
  const createClient = useClientsStore((state) => state.create);
  const reloadClients = useClientsStore((state) => state.load);
  const createPayment = usePaymentsStore((state) => state.create);
  const { form, plans } = clientsTexts;

  const taken = useMemo(() => takenSlots(accountId, clients), [clients, accountId]);

  const [values, setValues] = useState<ClientFormValues>(() => {
    const slot = requestedSlot && !taken.has(requestedSlot) ? requestedSlot : null;
    return emptyClientForm(toISODate(new Date()), accountId, slot);
  });
  const [paymentDayTouched, setPaymentDayTouched] = useState(false);
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  /** Set when the client saved but the first payment did not. */
  const [savedWithoutPayment, setSavedWithoutPayment] = useState(false);
  const isPromo = values.planType === "PROMO";
  const isSplit = isPromo && values.secondAccountId !== accountId;
  const amountValue = /^\d+$/.test(values.amount.trim()) ? Number(values.amount.trim()) : 0;
  const secondAccount = accounts.find((item) => item.id === values.secondAccountId);

  // Person 2's grid also blocks the slot person 1 picked in the same account.
  const secondTaken = useMemo(() => {
    const map = takenSlots(values.secondAccountId, clients);
    if (values.secondAccountId === accountId && values.slot !== null) {
      map.set(values.slot, values.name.trim() || form.firstPerson);
    }
    return map;
  }, [clients, values.secondAccountId, values.slot, values.name, accountId, form.firstPerson]);

  // Accounts with a free slot for person 2 (person 1's pick counts as taken).
  const secondAccountOptions = accounts
    .map((item) => {
      const free = freeSlots(item, clients).filter((slot) => !(item.id === accountId && slot === values.slot));
      return { account: item, freeCount: free.length };
    })
    .filter(({ freeCount }) => freeCount > 0);
  const secondAccountAvailable = secondAccountOptions.some(({ account: item }) => item.id === values.secondAccountId);
  const promoFits = canFitPromo(
    accountId,
    accounts.map((item) => item.id),
    clients,
  );
  // Blocks saving a promo whose second slot is missing, taken, or in an account without room.
  const promoBlocked =
    isPromo &&
    (secondAccountOptions.length === 0 ||
      !secondAccountAvailable ||
      values.secondSlot === null ||
      secondTaken.has(values.secondSlot));

  function selectFirstSlot(slot: number) {
    setValues((current) => {
      const next = toggleSingleSlot(current.slot, slot);
      const clash = current.secondAccountId === accountId && current.secondSlot === next;
      return { ...current, slot: next, secondSlot: clash ? null : current.secondSlot };
    });
    setErrors((current) => ({ ...current, slot: undefined, secondSlot: undefined }));
  }

  function selectSecondAccount(id: string) {
    setValues((current) => ({ ...current, secondAccountId: id, secondSlot: null }));
    setErrors((current) => ({ ...current, secondSlot: undefined }));
  }

  function setField<K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function selectPlan(planType: PlanType) {
    setValues((current) => ({
      ...current,
      planType,
      amount: String(PRICES[planType]),
    }));
    setErrors((current) => ({ ...current, secondSlot: undefined, amount: undefined }));
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
    const nextErrors = validateClientForm(values, accountId);
    if (isPromo && !nextErrors.secondSlot && promoBlocked) nextErrors.secondSlot = form.errors.secondSlotRequired;
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
        setValues((current) => ({ ...current, slot: null, secondSlot: null }));
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
            description={promoFits || isPromo ? plans.promoDescription : plans.promoUnavailable}
            disabled={!promoFits && !isPromo}
          />
        </div>
      </FormSection>

      <FormSection icon={LayoutGrid} title={isPromo ? form.firstSlotTitle : form.sections.slots}>
        <SlotPicker
          taken={taken}
          selected={values.slot === null ? [] : [values.slot]}
          onToggle={selectFirstSlot}
          label={isPromo ? form.firstSlotTitle : form.sections.slots}
          hint={isPromo ? form.firstSlotHint : form.slotsHintSingle}
          error={errors.slot}
        />
      </FormSection>

      {isPromo && (
        <FormSection icon={Users} title={form.secondSlotTitle}>
          {secondAccountOptions.length === 0 ? (
            <div role="alert" className="flex gap-3 rounded-xl border border-status-overdue bg-status-overdue-soft p-3">
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-status-overdue" />
              <div>
                <p className="font-semibold text-status-overdue">{form.noSecondSlotTitle}</p>
                <p className="text-sm text-olive-950">{form.noOtherAccounts}</p>
              </div>
            </div>
          ) : (
            <>
              <div role="group" aria-label={form.secondAccountLabel} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {secondAccountOptions.map(({ account: item, freeCount }) => (
                  <SelectableCard
                    key={item.id}
                    selected={item.id === values.secondAccountId}
                    onSelect={() => selectSecondAccount(item.id)}
                    icon={LayoutGrid}
                    title={item.alias}
                    description={item.id === accountId ? `${form.thisAccount} · ${form.freeCount(freeCount)}` : form.freeCount(freeCount)}
                  />
                ))}
              </div>
              {secondAccountAvailable && (
              <SlotPicker
                taken={secondTaken}
                selected={values.secondSlot === null ? [] : [values.secondSlot]}
                onToggle={(slot) => setField("secondSlot", toggleSingleSlot(values.secondSlot, slot))}
                label={`${form.secondSlotTitle} · ${secondAccount?.alias ?? ""}`}
                hint={form.secondSlotHint}
                error={errors.secondSlot}
              />
              )}
              {!secondAccountAvailable && errors.secondSlot && (
                <p role="alert" className="flex items-center gap-1.5 text-sm text-status-overdue">
                  <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
                  {form.pickSecondAccount}
                </p>
              )}
            </>
          )}
          {isSplit && secondAccount && secondAccountAvailable && (
            <div className="flex gap-3 rounded-xl border border-olive-700 bg-olive-100 p-3">
              <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-olive-700" />
              <div>
                <p className="font-semibold">{form.splitTitle}</p>
                <p className="text-sm text-olive-950">
                  {form.splitExplanation(
                    formatMoney(amountValue),
                    formatMoney(Math.ceil(amountValue / 2)),
                    account.alias,
                    formatMoney(Math.floor(amountValue / 2)),
                    secondAccount.alias,
                  )}
                </p>
              </div>
            </div>
          )}
        </FormSection>
      )}

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
        <Button type="submit" loading={saving} disabled={isPromo && secondAccountOptions.length === 0}>
          {form.save}
        </Button>
      </div>
    </form>
  );
}
