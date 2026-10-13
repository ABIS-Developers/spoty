import { useEffect } from "react";
import { usePaymentsStore } from "../../payments";
import { useClientsStore } from "../store/clientsStore";

/** Clients and payments, loading each store once. */
export function useClientsData() {
  const clients = useClientsStore((state) => state.clients);
  const clientsStatus = useClientsStore((state) => state.status);
  const loadClients = useClientsStore((state) => state.load);
  const payments = usePaymentsStore((state) => state.payments);
  const paymentsStatus = usePaymentsStore((state) => state.status);
  const loadPayments = usePaymentsStore((state) => state.load);

  useEffect(() => {
    if (clientsStatus === "idle") void loadClients();
  }, [clientsStatus, loadClients]);

  useEffect(() => {
    if (paymentsStatus === "idle") void loadPayments();
  }, [paymentsStatus, loadPayments]);

  const statuses = [clientsStatus, paymentsStatus];
  const status = statuses.includes("error")
    ? "error"
    : statuses.every((item) => item === "ready")
      ? "ready"
      : "loading";

  return {
    clients,
    payments,
    status,
    retry: () => {
      if (clientsStatus === "error") void loadClients();
      if (paymentsStatus === "error") void loadPayments();
    },
  } as const;
}
