import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { sharedTexts } from "../texts";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  /** Throw to show the error inline and keep the dialog open. */
  onConfirm: () => Promise<void> | void;
  errorMessage?: string;
};

export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel = sharedTexts.confirm,
  destructive = false,
  onConfirm,
  errorMessage,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (busy) return;
    setError(null);
    onClose();
  }

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      setBusy(false);
      onClose();
    } catch (cause) {
      setBusy(false);
      setError(errorMessage ?? (cause instanceof Error ? cause.message : String(cause)));
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={busy}>
            {sharedTexts.cancel}
          </Button>
          <Button variant={destructive ? "danger" : "primary"} onClick={handleConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-base">{message}</p>
      {error && (
        <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-status-overdue">
          <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </Dialog>
  );
}
