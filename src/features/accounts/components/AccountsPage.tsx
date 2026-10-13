import { useEffect, useState } from "react";
import { AlertTriangle, Plus, Users } from "lucide-react";
import { Button, EmptyState, PageSpinner } from "../../../shared/components";
import { useAccountsStore } from "../store/accountsStore";
import { accountsTexts } from "../texts";
import { AccountCard } from "./AccountCard";
import { AccountForm } from "./AccountForm";

export function AccountsPage() {
  const accounts = useAccountsStore((state) => state.accounts);
  const status = useAccountsStore((state) => state.status);
  const load = useAccountsStore((state) => state.load);
  const [formOpen, setFormOpen] = useState(false);
  const [today] = useState(() => new Date());
  const { page } = accountsTexts;

  useEffect(() => {
    void load();
  }, [load]);

  const visible = accounts
    .filter((account) => account.status === "ACTIVE")
    .sort((a, b) => a.alias.localeCompare(b.alias, "es", { numeric: true }));

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{page.title}</h1>
        <Button icon={Plus} onClick={() => setFormOpen(true)} className="hidden sm:inline-flex">
          {page.newAccount}
        </Button>
      </div>

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
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((account) => (
            <li key={account.id}>
              {/* Occupants come from the clients store once client registration exists (step 8). */}
              <AccountCard account={account} occupants={[]} today={today} />
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setFormOpen(true)}
        aria-label={page.newAccount}
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 flex size-14 items-center justify-center rounded-full bg-olive-700 text-white shadow-lg transition-colors duration-150 hover:bg-olive-600 sm:hidden"
      >
        <Plus aria-hidden="true" className="size-6" />
      </button>

      <AccountForm open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  );
}
