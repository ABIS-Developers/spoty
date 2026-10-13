import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Archive, Plus, Users } from "lucide-react";
import { Button, EmptyState, PageSpinner } from "../../../shared/components";
import { buildOccupants, useClientsData } from "../../clients";
import { useAccountsStore } from "../store/accountsStore";
import { accountsTexts } from "../texts";
import { AccountCard } from "./AccountCard";
import { AccountForm } from "./AccountForm";

export function AccountsPage() {
  const accounts = useAccountsStore((state) => state.accounts);
  const status = useAccountsStore((state) => state.status);
  const load = useAccountsStore((state) => state.load);
  const navigate = useNavigate();
  const { clients, payments } = useClientsData();
  const [formOpen, setFormOpen] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [today] = useState(() => new Date());
  const { page } = accountsTexts;

  useEffect(() => {
    void load();
  }, [load]);

  const aliases = new Map(accounts.map((account) => [account.id, account.alias]));
  const byAlias = (a: { alias: string }, b: { alias: string }) => a.alias.localeCompare(b.alias, "es", { numeric: true });
  const visible = accounts.filter((account) => account.status === "ACTIVE").sort(byAlias);
  const closed = accounts.filter((account) => account.status === "CLOSED").sort(byAlias);
  const renderCards = (list: typeof accounts) => (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((account) => (
        <li key={account.id}>
          <AccountCard
            account={account}
            occupants={buildOccupants(account.id, clients, payments, today, aliases)}
            today={today}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{page.title}</h1>
        <Button icon={Plus} onClick={() => setFormOpen(true)} className="hidden sm:inline-flex">
          {page.newAccount}
        </Button>
      </div>

      {closed.length > 0 && (
        <button
          type="button"
          aria-pressed={showClosed}
          onClick={() => setShowClosed((current) => !current)}
          className={`mb-4 inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-150 ${
            showClosed ? "border-olive-700 bg-olive-100 text-olive-950" : "border-beige-300 bg-white text-olive-700 hover:bg-beige-100"
          }`}
        >
          <Archive aria-hidden="true" className="size-4" />
          {page.showClosed} ({closed.length})
        </button>
      )}

      {status === "error" ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center">
          <p className="flex items-center gap-2 text-status-overdue">
            <AlertTriangle aria-hidden="true" className="size-5" />
            {page.loadError}
          </p>
          <Button variant="secondary" onClick={() => void load()}>
            {page.retry}
          </Button>
        </div>
      ) : status !== "ready" && accounts.length === 0 ? (
        <PageSpinner />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title={page.emptyTitle}
          description={page.emptyDescription}
          action={
            <Button icon={Plus} onClick={() => setFormOpen(true)}>
              {page.newAccount}
            </Button>
          }
        />
      ) : (
        renderCards(visible)
      )}

      {showClosed && closed.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-olive-700">
            <Archive aria-hidden="true" className="size-5" />
            {page.closedTitle}
          </h2>
          {renderCards(closed)}
        </section>
      )}

      <button
        type="button"
        onClick={() => setFormOpen(true)}
        aria-label={page.newAccount}
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 flex size-14 items-center justify-center rounded-full bg-olive-700 text-white shadow-lg transition-colors duration-150 hover:bg-olive-600 sm:hidden"
      >
        <Plus aria-hidden="true" className="size-6" />
      </button>

      <AccountForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={(account) => navigate(`/accounts/${account.id}`)}
      />
    </>
  );
}
