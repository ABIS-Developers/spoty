import { useState, type FormEvent } from "react";
import { addMonths, format, parse } from "date-fns";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, DatePicker, Dialog, IconButton, Input } from "../../../shared/components";
import { formatPeriod, toISODate } from "../../../shared/lib/dates";
import { sharedTexts } from "../../../shared/texts";
import { currentPeriod } from "../lib/paymentStatus";
import { DuplicatePaymentError, usePaymentsStore } from "../store/paymentsStore";
import { paymentsTexts } from "../texts";

type PaymentFormProps = {
  open: boolean;
  onClose: () => void;
  clientId: string;
  /** Pre-fills the amount. */
  defaultAmount: number;
  /** Periods already paid; a second payment for one is blocked. */
  paidPeriods: ReadonlyArray<string>;
};

export function PaymentForm(props: PaymentFormProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose} title={paymentsTexts.form.title}>
      {props.open && <PaymentFormBody {...props} />}
    </Dialog>
  );
}

function shiftPeriod(period: string, months: number): string {
  return format(addMonths(parse(period, "yyyy-MM", new Date()), months), "yyyy-MM");
}

type Errors = Partial<Record<"period" | "paidAt" | "amount", string>>;

function PaymentFormBody({ onClose, clientId, defaultAmount, paidPeriods }: PaymentFormProps) {
  const createPayment = usePaymentsStore((state) => state.create);
  const [period, setPeriod] = useState(() => currentPeriod(new Date()));
  const [paidAt, setPaidAt] = useState(() => toISODate(new Date()));
  const [amount, setAmount] = useState(String(defaultAmount));
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { form } = paymentsTexts;
  const duplicate = paidPeriods.includes(period);

  function changePeriod(months: number) {
    setPeriod((current) => shiftPeriod(current, months));
    setErrors((current) => ({ ...current, period: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Errors = {};
    if (duplicate) nextErrors.period = form.errors.duplicate;
    if (!paidAt) nextErrors.paidAt = form.errors.paidAtRequired;
    if (!/^\d+$/.test(amount.trim())) nextErrors.amount = form.errors.amountInvalid;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setSaveError(null);
    try {
      await createPayment({ clientId, period, paidAt, amount: Number(amount.trim()) });
      onClose();
    } catch (error) {
      setSaving(false);
      if (error instanceof DuplicatePaymentError) setErrors({ period: form.errors.duplicate });
      else setSaveError(form.saveError);
    }
  }

  const periodError = errors.period ?? (duplicate ? form.errors.duplicate : null);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 pt-1">
      <div className="flex flex-col gap-1.5">
        <span id="payment-period-label" className="text-sm font-medium">
          {form.period}
        </span>
        <div
          role="group"
          aria-labelledby="payment-period-label"
          className="flex items-center justify-between gap-2 rounded-xl border border-beige-300 p-1"
        >
          <IconButton icon={ChevronLeft} label={form.previousMonth} onClick={() => changePeriod(-1)} />
          <span aria-live="polite" className="text-lg font-semibold capitalize">
            {formatPeriod(period)}
          </span>
          <IconButton icon={ChevronRight} label={form.nextMonth} onClick={() => changePeriod(1)} />
        </div>
        {periodError && (
          <p role="alert" className="flex items-center gap-1.5 text-sm text-status-overdue">
            <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
            {periodError}
          </p>
        )}
      </div>

      <DatePicker
        label={form.paidAt}
        value={paidAt}
        onChange={(value) => {
          setPaidAt(value);
          setErrors((current) => ({ ...current, paidAt: undefined }));
        }}
        error={errors.paidAt}
      />
      <Input
        label={form.amount}
        inputMode="numeric"
        value={amount}
        onChange={(event) => {
          setAmount(event.target.value);
          setErrors((current) => ({ ...current, amount: undefined }));
        }}
        error={errors.amount}
      />

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
        <Button type="submit" loading={saving} disabled={duplicate}>
          {form.save}
        </Button>
      </div>
    </form>
  );
}
