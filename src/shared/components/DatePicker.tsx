import { useId, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale/es";
import "react-day-picker/style.css";
import { Field } from "./Field";
import { controlClasses, fieldDescribedBy } from "./fieldUtils";
import { PickerPanel } from "./PickerPanel";
import { formatDisplayDate, parseISODate, toISODate } from "../lib/dates";
import { sharedTexts } from "../texts";

type DatePickerProps = {
  label: string;
  /** `YYYY-MM-DD` or null. */
  value: string | null;
  onChange: (value: string) => void;
  error?: string | null;
  hint?: string;
  disabled?: boolean;
};

export function DatePicker({ label, value, onChange, error, hint, disabled }: DatePickerProps) {
  const id = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = value ? parseISODate(value) : undefined;

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
          <span className={`truncate ${value ? "" : "text-olive-700"}`}>
            {value ? formatDisplayDate(value) : sharedTexts.pickDate}
          </span>
        </button>
        <PickerPanel open={open} onClose={() => setOpen(false)} title={label} anchorRef={anchorRef}>
          <DayPicker
            mode="single"
            locale={es}
            selected={selected}
            defaultMonth={selected}
            autoFocus
            onSelect={(date) => {
              if (!date) return;
              onChange(toISODate(date));
              setOpen(false);
            }}
          />
        </PickerPanel>
      </div>
    </Field>
  );
}
