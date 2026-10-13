import { useEffect, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { IconButton } from "./Button";
import { sharedTexts } from "../texts";

type CopyButtonProps = {
  value: string;
  /** What is copied, e.g. "correo"; used in the accessible name. */
  label: string;
};

type CopyState = "idle" | "copied" | "failed";

export function CopyButton({ value, label }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 1500);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  const name =
    state === "copied"
      ? sharedTexts.copied
      : state === "failed"
        ? sharedTexts.copyError
        : `${sharedTexts.copy} ${label}`;

  return (
    <>
      <IconButton
        icon={state === "copied" ? Check : state === "failed" ? X : Copy}
        label={name}
        onClick={handleCopy}
      />
      <span aria-live="polite" className="sr-only">
        {state === "idle" ? "" : name}
      </span>
    </>
  );
}
