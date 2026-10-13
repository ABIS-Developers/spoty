import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { authTexts, useSessionStore } from "../../features/auth";
import { IconButton } from "../../shared/components";
import { BottomTabBar } from "./BottomTabBar";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  children?: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const logout = useSessionStore((state) => state.logout);

  return (
    <div className="min-h-dvh lg:pl-64">
      <Sidebar onLogout={logout} />
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between bg-olive-900 pr-1.5 pl-4 text-white lg:hidden">
        <span className="text-lg font-semibold tracking-tight">{authTexts.appName}</span>
        <IconButton icon={LogOut} label={authTexts.logout} onClick={logout} variant="inverse" />
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-10">
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}
