import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AccountDetailPage, AccountsPage } from "../features/accounts";
import { LoginPage, useSessionStore } from "../features/auth";
import { ClientForm } from "../features/clients";
import { AppShell } from "./layout/AppShell";

function RequireSession() {
  const pin = useSessionStore((state) => state.pin);
  if (!pin) return <Navigate to="/login" replace />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function GuestOnly() {
  const pin = useSessionStore((state) => state.pin);
  if (pin) return <Navigate to="/accounts" replace />;
  return <Outlet />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<RequireSession />}>
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/accounts/:id" element={<AccountDetailPage />} />
        <Route path="/accounts/:id/clients/new" element={<ClientForm />} />
      </Route>
      <Route path="*" element={<Navigate to="/accounts" replace />} />
    </Routes>
  );
}
