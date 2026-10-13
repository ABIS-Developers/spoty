import { NavLink } from "react-router-dom";
import { appTexts } from "../texts";
import { NAV_ITEMS } from "./navItems";

/** Phone and tablet navigation, < 1024px. */
export function BottomTabBar() {
  return (
    <nav
      aria-label={appTexts.mainNav}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-beige-300 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-sm font-medium transition-colors duration-150 ${
                  isActive ? "text-olive-700" : "text-olive-950/80 hover:text-olive-700"
                }`
              }
            >
              <Icon aria-hidden="true" className="size-6" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
