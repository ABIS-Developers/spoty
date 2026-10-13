// Constants first: accounts imports this index and reads them.
export {
  DEFAULT_ACCOUNT_COST,
  PRICES,
  SLOTS_BY_PLAN,
  SLOTS_PER_ACCOUNT,
  type PlanType,
} from "./lib/pricing";
export type { Client, ClientInput, ClientStatus } from "./api/clientsApi";
export { ClientDetailPage } from "./components/ClientDetailPage";
export { ClientForm } from "./components/ClientForm";
export { useClientsData } from "./hooks/useClientsData";
export { buildOccupants, nextDueDate, paymentsByClient } from "./lib/occupants";
export { useClientsStore } from "./store/clientsStore";
