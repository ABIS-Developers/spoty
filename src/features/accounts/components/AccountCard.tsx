import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight, Mail } from "lucide-react";
import { ProgressBar } from "../../../shared/components";
import { formatDisplayDate } from "../../../shared/lib/dates";
import { formatMoney } from "../../../shared/lib/money";
import { SLOTS_PER_ACCOUNT } from "../../clients";
import type { Account } from "../api/accountsApi";
import { nextBillingDate } from "../lib/billing";
import { slotStatuses, type SlotOccupant } from "../lib/slots";
import { accountsTexts } from "../texts";
import { SlotDots } from "./SlotDots";

type AccountCardProps = {
  account: Account;
  occupants: ReadonlyArray<SlotOccupant>;
  today: Date;
};

export function AccountCard({ account, occupants, today }: AccountCardProps) {
  const occupied = slotStatuses(occupants).size;
  const { card } = accountsTexts;

  return (
    <Link
      to={`/accounts/${account.id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-beige-300 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold">{account.alias}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-olive-700" title={account.spotifyEmail}>
            <Mail aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{account.spotifyEmail}</span>
          </p>
        </div>
        <ChevronRight
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 text-olive-700 transition-transform duration-150 group-hover:translate-x-0.5"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium">
            {occupied}/{SLOTS_PER_ACCOUNT} {card.slots}
          </span>
          <SlotDots occupants={occupants} />
        </div>
        <ProgressBar value={occupied} max={SLOTS_PER_ACCOUNT} label={card.occupancy} />
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-beige-300 pt-3 text-sm">
        <span className="flex min-w-0 items-center gap-1.5 text-olive-700">
          <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">
            {card.nextBilling}: {formatDisplayDate(nextBillingDate(account.billingDay, today))}
          </span>
        </span>
        <span className="shrink-0 font-semibold">
          {formatMoney(account.monthlyCost)}
          <span className="font-normal text-olive-700">{card.perMonth}</span>
        </span>
      </div>
    </Link>
  );
}
