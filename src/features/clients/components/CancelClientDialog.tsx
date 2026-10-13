import { ConfirmDialog } from "../../../shared/components";
import { toISODate } from "../../../shared/lib/dates";
import type { Client } from "../api/clientsApi";
import { useClientsStore } from "../store/clientsStore";
import { clientsTexts } from "../texts";

type CancelClientDialogProps = {
  open: boolean;
  onClose: () => void;
  client: Client;
  /** Account id → alias, to name the slots that become free. */
  aliases: ReadonlyMap<string, string>;
};

/** Confirms "Dar de baja": CANCELLED + cancelledAt today; the slot(s) become free. */
export function CancelClientDialog({ open, onClose, client, aliases }: CancelClientDialogProps) {
  const cancelClient = useClientsStore((state) => state.cancel);
  const { cancel } = clientsTexts;

  const freed = [cancel.slotIn(client.slot, aliases.get(client.accountId) ?? "")];
  if (client.secondAccountId && client.secondSlot !== null) {
    freed.push(cancel.slotIn(client.secondSlot, aliases.get(client.secondAccountId) ?? ""));
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title={cancel.title}
      message={cancel.message(client.name, freed.join(cancel.and))}
      confirmLabel={cancel.confirm}
      destructive
      errorMessage={cancel.error}
      onConfirm={async () => {
        await cancelClient(client.id, toISODate(new Date()));
      }}
    />
  );
}
