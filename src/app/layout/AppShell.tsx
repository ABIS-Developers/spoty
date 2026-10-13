import type { ReactNode } from "react";

type AppShellProps = {
  children?: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex h-14 items-center bg-olive-900 px-4 text-white">
        <span className="text-lg font-semibold tracking-tight">Spoty</span>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
