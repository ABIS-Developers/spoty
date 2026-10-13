import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { authTexts, useSessionStore } from "../../features/auth";

type AppShellProps = {
  children?: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const logout = useSessionStore((state) => state.logout);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between bg-olive-900 px-4 text-white">
        <span className="text-lg font-semibold tracking-tight">{authTexts.appName}</span>
        <button
          type="button"
          onClick={logout}
          className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium transition-colors duration-150 hover:bg-white/10"
        >
          <LogOut aria-hidden="true" className="size-5" />
          <span className="sr-only sm:not-sr-only">{authTexts.logout}</span>
        </button>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
