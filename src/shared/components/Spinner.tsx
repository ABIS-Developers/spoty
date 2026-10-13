import { Loader2 } from "lucide-react";
import { sharedTexts } from "../texts";

type SpinnerProps = {
  className?: string;
  /** Announces the loading state to screen readers. Omit when a visible label exists. */
  label?: string;
};

export function Spinner({ className = "size-5", label }: SpinnerProps) {
  return (
    <span role={label ? "status" : undefined} className="inline-flex">
      <Loader2 aria-hidden="true" className={`${className} animate-spin`} />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

export function PageSpinner() {
  return (
    <div className="flex justify-center py-16 text-olive-700">
      <Spinner className="size-8" label={sharedTexts.loading} />
    </div>
  );
}
