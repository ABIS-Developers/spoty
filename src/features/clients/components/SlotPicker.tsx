import { useId } from "react";
import { AlertTriangle, CheckCircle2, Lock, UserPlus } from "lucide-react";
import { sellableSlots } from "../../accounts";
import { clientsTexts } from "../texts";

type SlotPickerProps = {
  /** Slot → name of the ACTIVE client holding it. */
  taken: ReadonlyMap<number, string>;
  selected: ReadonlyArray<number>;
  onToggle: (slot: number) => void;
  label: string;
  hint: string;
  error?: string | null;
};

/** Mini slot grid: tap free tiles to pick them. */
export function SlotPicker({ taken, selected, onToggle, label, hint, error }: SlotPickerProps) {
  const { form } = clientsTexts;
  const helpId = useId();
  const tile = "flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl p-2 text-center text-sm";

  return (
    <div role="group" aria-label={label} aria-describedby={helpId} className="flex flex-col gap-2">
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <li>
          <div className={`${tile} h-full bg-olive-900 text-white`}>
            <Lock aria-hidden="true" className="size-5" />
            <span className="font-medium">{form.adminSlot}</span>
          </div>
        </li>
        {sellableSlots().map((slot) => {
          const owner = taken.get(slot);
          if (owner !== undefined) {
            return (
              <li key={slot}>
                <div
                  aria-label={`${form.slot} ${slot}: ${form.occupiedSlot}, ${owner}`}
                  className={`${tile} h-full border border-beige-300 bg-beige-100 text-olive-700`}
                >
                  <span>
                    {form.slot} {slot}
                  </span>
                  <span className="w-full truncate font-medium" title={owner}>
                    {owner}
                  </span>
                </div>
              </li>
            );
          }
          const isSelected = selected.includes(slot);
          return (
            <li key={slot}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggle(slot)}
                className={`${tile} h-full w-full border-2 transition-colors duration-150 ${
                  isSelected
                    ? "border-olive-700 bg-olive-100 font-semibold text-olive-950"
                    : "border-dashed border-beige-300 bg-white text-olive-700 hover:border-olive-700"
                }`}
              >
                {isSelected ? (
                  <CheckCircle2 aria-hidden="true" className="size-5 text-olive-700" />
                ) : (
                  <UserPlus aria-hidden="true" className="size-5" />
                )}
                <span>
                  {form.slot} {slot}
                </span>
                <span className="sr-only">{form.freeSlot}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div id={helpId}>
        {error ? (
          <p role="alert" className="flex items-center gap-1.5 text-sm text-status-overdue">
            <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
            {error}
          </p>
        ) : (
          <p className="text-sm text-olive-700">{hint}</p>
        )}
      </div>
    </div>
  );
}
