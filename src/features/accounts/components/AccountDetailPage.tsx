import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CalendarDays, Mail, Pencil, SearchX, StickyNote, Wallet, type LucideIcon } from "lucide-react";
import { Button, CopyButton, EmptyState, PageSpinner } from "../../../shared/components";
import { formatDisplayDate } from "../../../shared/lib/dates";
import { formatMoney } from "../../../shared/lib/money";
import { sharedTexts } from "../../../shared/texts";
import { buildOccupants, useClientsData } from "../../clients";
import { nextBillingDate } from "../lib/billing";
import { useAccountsStore } from "../store/accountsStore";
import { accountsTexts } from "../texts";
import { AccountForm } from "./AccountForm";
import { PasswordField } from "./PasswordField";
import { SlotGrid } from "./SlotGrid";

function Fact({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-beige-100 px-3 py-2.5">
      <Icon aria-hidden="true" className="size-5 shrink-0 text-olive-700" />
      <div className="min-w-0">
        <p className="text-sm text-olive-700">{label}</p>
        <p className="truncate font-semibold">{children}</p>
      </div>
    </div>
  );
}

export function AccountDetailPage() {
  const { id = "" } = useParams();
  const account = useAccountsStore((state) => state.accounts.find((item) => item.id === id));
  const status = useAccountsStore((state) => state.status);
  const load = useAccountsStore((state) => state.load);
  const { clients, payments, status: clientsStatus, retry } = useClientsData();
  const [editOpen, setEditOpen] = useState(false);
  const [today] = useState(() => new Date());
  const { detail } = accountsTexts;

  useEffect(() => {
    if (status === "idle") void load();
  }, [status, load]);

  const backLink = (
    <Link
      to="/accounts"
      className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg pr-2 text-sm font-medium text-olive-700 hover:text-olive-950"
    >
      <ArrowLeft aria-hidden="true" className="size-5" />
      {detail.back}
    </Link>
  );

  if (!account) {
    if (status === "idle" || status === "loading") return <PageSpinner />;
    return (
      <>
        {backLink}
        <EmptyState icon={SearchX} title={detail.notFoundTitle} description={detail.notFoundDescription} />
      </>
    );
  }

  return (
    <>
      {backLink}

      <section className="rounded-2xl border border-beige-300 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 truncate text-2xl font-semibold tracking-tight">{account.alias}</h1>
          <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>
            {detail.edit}
          </Button>
        </div>

        <h2 className="mt-5 mb-2 text-sm font-semibold tracking-wide text-olive-700 uppercase">{detail.credentials}</h2>
        <div className="flex flex-col divide-y divide-beige-300 rounded-xl border border-beige-300 px-3">
          <div className="flex items-center gap-1 py-2">
            <Mail aria-hidden="true" className="size-5 shrink-0 text-olive-700" />
            <div className="min-w-0 flex-1 px-1">
              <p className="text-sm text-olive-700">{detail.email}</p>
              <p className="truncate text-base" title={account.spotifyEmail}>
                {account.spotifyEmail}
              </p>
            </div>
            <CopyButton value={account.spotifyEmail} label={detail.copyEmail} />
          </div>
          <div className="py-2">
            <PasswordField password={account.spotifyPassword} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Fact icon={CalendarDays} label={detail.billingDay}>
            {sharedTexts.day} {account.billingDay}
          </Fact>
          <Fact icon={CalendarDays} label={detail.nextBilling}>
            {formatDisplayDate(nextBillingDate(account.billingDay, today))}
          </Fact>
          <Fact icon={Wallet} label={detail.monthlyCost}>
            {formatMoney(account.monthlyCost)}
          </Fact>
        </div>

        {account.notes && (
          <div className="mt-4 flex gap-3 rounded-xl bg-beige-100 px-3 py-2.5">
            <StickyNote aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-olive-700" />
            <div className="min-w-0">
              <p className="text-sm text-olive-700">{detail.notes}</p>
              <p className="text-base break-words whitespace-pre-line">{account.notes}</p>
            </div>
          </div>
        )}
      </section>

      <h2 className="mt-8 mb-3 text-lg font-semibold">{detail.slotsTitle}</h2>
      {clientsStatus === "error" ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center">
          <p className="flex items-center gap-2 text-status-overdue">
            <AlertTriangle aria-hidden="true" className="size-5" />
            {detail.slotsLoadError}
          </p>
          <Button variant="secondary" onClick={retry}>
            {detail.retry}
          </Button>
        </div>
      ) : clientsStatus !== "ready" && clients.length === 0 ? (
        <PageSpinner />
      ) : (
        <SlotGrid accountId={account.id} occupants={buildOccupants(account.id, clients, payments, today)} />
      )}

      <AccountForm open={editOpen} onClose={() => setEditOpen(false)} account={account} />
    </>
  );
}
