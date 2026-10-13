import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { LoginPage, useSessionStore } from "../features/auth";
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
        {/* AccountsPage arrives in step 6. */}
        <Route path="/accounts" element={null} />
      </Route>
      <Route path="*" element={<Navigate to="/accounts" replace />} />
    </Routes>
  );
}
