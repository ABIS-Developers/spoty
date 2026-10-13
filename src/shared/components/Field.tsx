import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type FieldProps = {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  /** Use when the control is not a native input, so the label is referenced by `aria-labelledby`. */
  labelAsText?: boolean;
  children: ReactNode;
};

export function Field({ id, label, error, hint, labelAsText = false, children }: FieldProps) {
  const labelClass = "text-sm font-medium text-olive-950";
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {labelAsText ? (
        <span id={`${id}-label`} className={labelClass}>
          {label}
        </span>
      ) : (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-olive-700">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-sm text-status-overdue">
          <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
