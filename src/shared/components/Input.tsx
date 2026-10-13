import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { Field } from "./Field";
import { controlClasses, fieldDescribedBy } from "./fieldUtils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
  hint?: string;
  icon?: LucideIcon;
};

export function Input({ label, error, hint, icon: Icon, id, className = "", ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <Field id={inputId} label={label} error={error} hint={hint}>
      <div className="relative">
        {Icon && (
          <Icon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-olive-700"
          />
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldDescribedBy(inputId, error, hint)}
          className={`${controlClasses} h-11 ${Icon ? "pl-10" : ""} ${className}`}
          {...rest}
        />
      </div>
    </Field>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string | null;
  hint?: string;
};

export function TextArea({ label, error, hint, id, className = "", rows = 3, ...rest }: TextAreaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <Field id={inputId} label={label} error={error} hint={hint}>
      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={fieldDescribedBy(inputId, error, hint)}
        className={`${controlClasses} resize-y py-2.5 ${className}`}
        {...rest}
      />
    </Field>
  );
}
