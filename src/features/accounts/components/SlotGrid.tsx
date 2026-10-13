import { Link } from "react-router-dom";
import { CalendarDays, Lock, UserPlus, Users } from "lucide-react";
import { Avatar, StatusBadge } from "../../../shared/components";
import { formatDisplayDate } from "../../../shared/lib/dates";
import { formatMoney } from "../../../shared/lib/money";
import { sellableSlots, type OccupantStatus } from "../lib/slots";
import { accountsTexts } from "../texts";

/** An ACTIVE client shown on the grid. */
export type SlotTileOccupant = {
  id: string;
  name: string;
  amount: number;
  planType: "SINGLE" | "PROMO";
  slots: number[];
  status: OccupantStatus | null;
  /** `YYYY-MM-DD` of the current period's due date. */
  nextDueDate: string | null;
};

type SlotGridProps = {
  accountId: string;
  occupants: ReadonlyArray<SlotTileOccupant>;
};

type Unit = { kind: "free"; slot: number } | { kind: "occupied"; occupant: SlotTileOccupant };

/** Free slots and occupants in slot order; a promo is one unit spanning its 2 slots. */
function buildUnits(occupants: ReadonlyArray<SlotTileOccupant>): Unit[] {
  const bySlot = new Map<number, SlotTileOccupant>();
  for (const occupant of occupants) for (const slot of occupant.slots) bySlot.set(slot, occupant);

  const units: Unit[] = [];
  const placed = new Set<string>();
  for (const slot of sellableSlots()) {
    const occupant = bySlot.get(slot);
    if (!occupant) units.push({ kind: "free", slot });
    else if (!placed.has(occupant.id)) {
      placed.add(occupant.id);
      units.push({ kind: "occupied", occupant });
    }
  }
  return units;
}

function slotsLabel(slots: number[]): string {
  const { slots: texts } = accountsTexts;
  return `${texts.slot} ${[...slots].sort((a, b) => a - b).join(` ${texts.slotsJoin} `)}`;
}

const TILE = "flex min-h-36 flex-col rounded-2xl p-4";

export function SlotGrid({ accountId, occupants }: SlotGridProps) {
  const { slots: texts } = accountsTexts;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <li className="col-span-2 sm:col-span-1">
        <div className={`${TILE} h-full items-center justify-center gap-2 bg-olive-900 text-center text-white`}>
          <Lock aria-hidden="true" className="size-6" />
          <span className="font-semibold">{texts.admin}</span>
          <span className="text-sm text-white/90">{texts.adminHint}</span>
        </div>
      </li>

      {buildUnits(occupants).map((unit) =>
        unit.kind === "free" ? (
          <li key={`free-${unit.slot}`}>
            <Link
              to={`/accounts/${accountId}/clients/new?slot=${unit.slot}`}
              className={`${TILE} h-full items-center justify-center gap-2 border-2 border-dashed border-beige-300 bg-beige-100 text-center text-olive-700 transition-colors duration-150 hover:border-olive-700 hover:bg-olive-100`}
            >
              <UserPlus aria-hidden="true" className="size-6" />
              <span className="text-sm">
                {texts.slot} {unit.slot} · {texts.free}
              </span>
              <span className="font-semibold">+ {texts.assign}</span>
            </Link>
          </li>
        ) : (
          <li key={unit.occupant.id} className={unit.occupant.slots.length > 1 ? "col-span-2" : undefined}>
            <OccupiedTile occupant={unit.occupant} />
          </li>
        ),
      )}
    </ul>
  );
}

function OccupiedTile({ occupant }: { occupant: SlotTileOccupant }) {
  const { slots: texts } = accountsTexts;
  const isPromo = occupant.planType === "PROMO";

  return (
    <Link
      to={`/clients/${occupant.id}`}
      className={`${TILE} h-full gap-3 border-2 bg-white transition-shadow duration-200 hover:shadow-md ${
        isPromo ? "border-olive-700" : "border-beige-300"
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-sm text-olive-700">
        <span>{slotsLabel(occupant.slots)}</span>
        {isPromo && <Users aria-hidden="true" className="size-4 shrink-0" />}
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <Avatar name={occupant.name} />
        <span className="truncate font-semibold" title={occupant.name}>
          {occupant.name}
        </span>
      </div>
      <p className="text-sm font-medium">
        {isPromo
          ? `${texts.promo} · ${formatMoney(occupant.amount)} · ${texts.onePayment}`
          : formatMoney(occupant.amount)}
      </p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        {occupant.nextDueDate && (
          <span className="flex items-center gap-1 text-sm text-olive-700">
            <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
            {texts.nextDue} {formatDisplayDate(occupant.nextDueDate)}
          </span>
        )}
        {occupant.status && <StatusBadge status={occupant.status} />}
      </div>
    </Link>
  );
}
