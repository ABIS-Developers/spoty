import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  History,
  Info,
  LayoutGrid,
  Mail,
  MessageCircle,
  Pencil,
  SearchX,
  StickyNote,
  User,
  UserRound,
  UserX,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Avatar, Button, Chip, CopyButton, EmptyState, PageSpinner } from "../../../shared/components";
import { formatDisplayDate } from "../../../shared/lib/dates";
import { isSplitPromo, slotsInAccount, useAccountsStore } from "../../accounts";
import { currentPeriod, MonthStrip, PaymentForm, PaymentHistory, paymentStatus } from "../../payments";
import { useClientsData } from "../hooks/useClientsData";
import { daysUntil, nextDueDate } from "../lib/occupants";
import { accountShare } from "../lib/revenue";
import { whatsappUrl } from "../lib/whatsapp";
import { formatMoney } from "../../../shared/lib/money";
import { clientsTexts } from "../texts";
import { CancelClientDialog } from "./CancelClientDialog";
import { ClientEditDialog } from "./ClientEditDialog";
import { PaymentHero } from "./PaymentHero";

function Card({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-beige-300 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wide text-olive-700 uppercase">
        <Icon aria-hidden="true" className="size-4" />
        {title}
      </h2>
      {children}
    </section>
  );
}

type InfoRowProps = {
  icon: LucideIcon;
  /** Tailwind classes for the icon bubble. */
  bubble?: string;
  label: string;
  children: ReactNode;
  action?: ReactNode;
};

function InfoRow({ icon: Icon, bubble = "bg-olive-100 text-olive-700", label, children, action }: InfoRowProps) {
  return (
    <div className="flex min-h-14 items-center gap-3 py-2">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${bubble}`}>
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-olive-700">{label}</p>
        <div className="truncate text-base font-medium">{children}</div>
      </div>
      {action}
    </div>
  );
}

/** `#/clients/:id` */
export function ClientDetailPage() {
  const { id = "" } = useParams();
  const { clients, payments, status, retry } = useClientsData();
  const accounts = useAccountsStore((state) => state.accounts);
  const accountsStatus = useAccountsStore((state) => state.status);
  const loadAccounts = useAccountsStore((state) => state.load);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [today] = useState(() => new Date());
  const { detail, plans } = clientsTexts;

  useEffect(() => {
    if (accountsStatus === "idle") void loadAccounts();
  }, [accountsStatus, loadAccounts]);

  const client = clients.find((item) => item.id === id);
  const account = client ? accounts.find((item) => item.id === client.accountId) : undefined;

  const backLink = (
    <Link
      to={account ? `/accounts/${account.id}` : "/accounts"}
      className="mb-4 inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-lg pr-2 text-sm font-medium text-olive-700 hover:text-olive-950"
    >
      <ArrowLeft aria-hidden="true" className="size-5 shrink-0" />
      <span className="truncate">{account ? `${detail.backTo} ${account.alias}` : detail.back}</span>
    </Link>
  );

  if (!client) {
    if (status === "error") {
      return (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center">
          <p className="flex items-center gap-2 text-status-overdue">
            <AlertTriangle aria-hidden="true" className="size-5" />
            {detail.loadError}
          </p>
          <Button variant="secondary" onClick={retry}>
            {detail.retry}
          </Button>
        </div>
      );
    }
    if (status !== "ready") return <PageSpinner />;
    return (
      <>
        {backLink}
        <EmptyState icon={SearchX} title={detail.notFoundTitle} description={detail.notFoundDescription} />
      </>
    );
  }

  const clientPayments = payments.filter((payment) => payment.clientId === client.id);
  const currentStatus = paymentStatus({ ...client, payments: clientPayments }, today);
  const isActive = client.status === "ACTIVE";
  const isPromo = client.planType === "PROMO";
  const nextDue = isActive ? nextDueDate(client, clientPayments, today) : null;
  const waUrl = whatsappUrl(client.phone);
  const isSplit = isSplitPromo(client);
  const secondAccount = client.secondAccountId
    ? accounts.find((item) => item.id === client.secondAccountId)
    : undefined;
  const slotsLabel = `${detail.slot} ${slotsInAccount(client, client.accountId).join(` ${detail.slotsJoin} `)}`;
  const hasContact = Boolean(waUrl || client.spotifyEmail || (isPromo && (client.secondName || client.secondSpotifyEmail)));

  return (
    <>
      {backLink}

      {/* Phone: identity, payment, contact, history. Desktop: identity + contact left, payment + history right. */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <section className="order-1 flex flex-col gap-4 rounded-2xl border border-beige-300 bg-white p-4 shadow-sm sm:p-6 lg:order-none">
            <div className="flex items-center gap-4">
              <Avatar name={client.name} size="lg" />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-bold tracking-tight" title={client.name}>
                  {client.name}
                </h1>
                <p className="text-sm text-olive-700">
                  {detail.startDate} {formatDisplayDate(client.startDate)}
                </p>
              </div>
              <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)} className="shrink-0">
                <span className="sr-only sm:not-sr-only">{clientsTexts.edit.open}</span>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip icon={isPromo ? Users : User}>{plans[client.planType]}</Chip>
              {account && (
                <Chip icon={LayoutGrid} href={`#/accounts/${account.id}`}>
                  {account.alias} · {slotsLabel}
                </Chip>
              )}
              {isSplit && secondAccount && client.secondSlot !== null && (
                <Chip icon={LayoutGrid} href={`#/accounts/${secondAccount.id}`}>
                  {secondAccount.alias} · {detail.slot} {client.secondSlot}
                </Chip>
              )}
            </div>
            {isSplit && (
              <div className="flex gap-3 rounded-xl border border-olive-700 bg-olive-100 p-3">
                <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-olive-700" />
                <div>
                  <p className="font-semibold">{detail.splitTitle}</p>
                  <p className="text-sm text-olive-950">
                    {clientsTexts.form.splitExplanation(
                      formatMoney(client.amount),
                      formatMoney(accountShare(client, client.accountId)),
                      account?.alias ?? "",
                      formatMoney(accountShare(client, client.secondAccountId ?? "")),
                      secondAccount?.alias ?? "",
                    )}
                  </p>
                </div>
              </div>
            )}
          </section>

          <div className="order-3 flex flex-col gap-4 lg:order-none lg:gap-6">
            <Card icon={UserRound} title={detail.contact}>
              {hasContact ? (
                <div className="flex flex-col divide-y divide-beige-300">
                  {waUrl && client.phone && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${detail.whatsapp} ${client.phone}`}
                      className="-mx-2 rounded-xl px-2 transition-colors duration-150 hover:bg-status-paid-soft"
                    >
                      <InfoRow
                        icon={MessageCircle}
                        bubble="bg-status-paid text-white"
                        label={detail.whatsappLabel}
                        action={<ChevronRight aria-hidden="true" className="size-5 shrink-0 text-olive-700" />}
                      >
                        {client.phone}
                      </InfoRow>
                    </a>
                  )}
                  {client.spotifyEmail && (
                    <InfoRow
                      icon={Mail}
                      label={detail.emailLabel}
                      action={<CopyButton value={client.spotifyEmail} label={detail.copyEmail} />}
                    >
                      <span title={client.spotifyEmail}>{client.spotifyEmail}</span>
                    </InfoRow>
                  )}
                  {isPromo && client.secondName && (
                    <InfoRow icon={Users} bubble="bg-olive-700 text-white" label={detail.secondPerson}>
                      {client.secondName}
                    </InfoRow>
                  )}
                  {isPromo && client.secondSpotifyEmail && (
                    <InfoRow
                      icon={Mail}
                      label={`${detail.emailLabel} · ${detail.secondPerson}`}
                      action={<CopyButton value={client.secondSpotifyEmail} label={detail.copyEmail} />}
                    >
                      <span title={client.secondSpotifyEmail}>{client.secondSpotifyEmail}</span>
                    </InfoRow>
                  )}
                </div>
              ) : (
                <p className="text-sm text-olive-700">{detail.noContact}</p>
              )}
            </Card>

            {client.notes && (
              <Card icon={StickyNote} title={detail.notes}>
                <p className="text-base break-words whitespace-pre-line">{client.notes}</p>
              </Card>
            )}

            {isActive && (
              <section className="flex flex-col gap-3 rounded-2xl border border-status-overdue/40 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <p className="text-sm text-olive-700">{detail.cancelHint}</p>
                <Button variant="danger" icon={UserX} onClick={() => setCancelOpen(true)} className="shrink-0">
                  {clientsTexts.cancel.open}
                </Button>
              </section>
            )}
          </div>
        </div>

        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <div className="order-2 lg:order-none">
            <PaymentHero
              status={currentStatus}
              nextDue={nextDue}
              daysToDue={nextDue ? daysUntil(nextDue, today) : null}
              period={currentPeriod(today)}
              amount={client.amount}
              paymentDay={client.paymentDay}
              cancelledAt={client.cancelledAt}
              onRegisterPayment={() => setPaymentOpen(true)}
            />
          </div>

          <div className="order-4 lg:order-none">
            <Card icon={History} title={detail.payments}>
              <div className="flex flex-col gap-6">
                <MonthStrip client={{ ...client, payments: clientPayments }} today={today} />
                <div className="border-t border-beige-300 pt-5">
                  <PaymentHistory payments={clientPayments} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <ClientEditDialog open={editOpen} onClose={() => setEditOpen(false)} client={client} />
      <CancelClientDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        client={client}
        aliases={new Map(accounts.map((item) => [item.id, item.alias]))}
      />
      <PaymentForm
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        clientId={client.id}
        defaultAmount={client.amount}
        paidPeriods={clientPayments.map((payment) => payment.period)}
      />
    </>
  );
}
