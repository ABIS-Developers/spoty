import { useId, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Field } from "./Field";
import { controlClasses, fieldDescribedBy } from "./fieldUtils";
import { PickerPanel } from "./PickerPanel";
import { sharedTexts } from "../texts";

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

type DayOfMonthPickerProps = {
  label: string;
  /** 1–31 or null. */
  value: number | null;
  onChange: (value: number) => void;
  error?: string | null;
  hint?: string;
  disabled?: boolean;
};

/** Day-of-month field with a 7-column grid of 1–31. */
export function DayOfMonthPicker({ label, value, onChange, error, hint, disabled }: DayOfMonthPickerProps) {
  const id = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <Field id={id} label={label} error={error} hint={hint} labelAsText>
      <div ref={anchorRef} className="relative">
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-labelledby={`${id}-label ${id}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldDescribedBy(id, error, hint)}
          onClick={() => setOpen((current) => !current)}
          className={`${controlClasses} flex h-11 items-center gap-2 text-left`}
        >
          <CalendarDays aria-hidden="true" className="size-5 shrink-0 text-olive-700" />
          <span className={value ? "" : "text-olive-700"}>
            {value ? `${sharedTexts.day} ${value}` : sharedTexts.pickDay}
          </span>
        </button>
        <PickerPanel open={open} onClose={() => setOpen(false)} title={label} anchorRef={anchorRef}>
          <div role="group" aria-label={label} className="grid w-full max-w-[20rem] grid-cols-7 gap-0.5">
            {DAYS.map((day) => {
              const selected = day === value;
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(day);
                    setOpen(false);
                  }}
                  className={`flex aspect-square min-h-11 min-w-11 items-center justify-center rounded-lg text-base transition-colors duration-150 ${
                    selected ? "bg-olive-700 font-semibold text-white" : "hover:bg-beige-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </PickerPanel>
      </div>
    </Field>
  );
}
