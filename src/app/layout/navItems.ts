import { LayoutGrid, type LucideIcon } from "lucide-react";
import { appTexts } from "../texts";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { to: "/accounts", label: appTexts.nav.accounts, icon: LayoutGrid },
];
