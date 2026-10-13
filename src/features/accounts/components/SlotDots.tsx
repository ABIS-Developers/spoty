import { SELLABLE_SLOTS, slotStatuses, type OccupantStatus, type SlotOccupant } from "../lib/slots";
import { sharedTexts } from "../../../shared/texts";
import { accountsTexts } from "../texts";

const STATUS_DOT: Record<OccupantStatus, string> = {
  PAID: "bg-status-paid",
  PENDING: "bg-status-pending",
  OVERDUE: "bg-status-overdue",
};

/** Mini row of 6 dots: admin slot plus the 5 sellable ones. */
export function SlotDots({ occupants }: { occupants: ReadonlyArray<SlotOccupant> }) {
  const statuses = slotStatuses(occupants);
  const { card } = accountsTexts;

  const describe = (slot: number) => {
    if (!statuses.has(slot)) return card.freeSlot;
    const status = statuses.get(slot);
    return status ? sharedTexts.status[status] : card.occupiedSlot;
  };
  const summary = [
    `${card.adminSlot}`,
    ...SELLABLE_SLOTS.map((slot) => `${card.slot} ${slot}: ${describe(slot)}`),
  ].join(", ");

  return (
    <div role="img" aria-label={`${card.slotDots}: ${summary}`} className="flex items-center gap-1.5">
      <span title={card.adminSlot} className="size-3 rounded-full bg-olive-900" />
      {SELLABLE_SLOTS.map((slot) => {
        const occupied = statuses.has(slot);
        const status = statuses.get(slot);
        const color = !occupied
          ? "border border-dashed border-beige-300 bg-beige-100"
          : status
            ? STATUS_DOT[status]
            : "bg-olive-700";
        return <span key={slot} title={`${card.slot} ${slot}: ${describe(slot)}`} className={`size-3 rounded-full ${color}`} />;
      })}
    </div>
  );
}
