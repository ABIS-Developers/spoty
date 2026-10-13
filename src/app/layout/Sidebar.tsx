import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { authTexts } from "../../features/auth";
import { appTexts } from "../texts";
import { NAV_ITEMS } from "./navItems";

/** Desktop navigation, ≥ 1024px. */
export function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-olive-900 text-white lg:flex">
      <div className="flex h-16 items-center px-6 text-xl font-semibold tracking-tight">{authTexts.appName}</div>
      <nav aria-label={appTexts.mainNav} className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150 ${
                    isActive ? "bg-olive-700 text-white" : "text-white/90 hover:bg-white/10"
                  }`
                }
              >
                <Icon aria-hidden="true" className="size-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/90 transition-colors duration-150 hover:bg-white/10"
        >
          <LogOut aria-hidden="true" className="size-5" />
          {authTexts.logout}
        </button>
      </div>
    </aside>
  );
}
