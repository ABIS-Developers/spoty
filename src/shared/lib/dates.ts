import { format, parse } from "date-fns";
import { es } from "date-fns/locale";

const ISO_DATE = "yyyy-MM-dd";
const PERIOD = "yyyy-MM";

/** Local date → `YYYY-MM-DD`. */
export function toISODate(date: Date): string {
  return format(date, ISO_DATE);
}

/** `YYYY-MM-DD` → local date at midnight. */
export function parseISODate(iso: string): Date {
  return parse(iso, ISO_DATE, new Date());
}

/** `2026-10-12` → `12 oct 2026`. */
export function formatDisplayDate(iso: string): string {
  return format(parseISODate(iso), "d MMM yyyy", { locale: es });
}

/** `2026-10` → `oct 2026`. */
export function formatPeriod(period: string): string {
  return format(parse(period, PERIOD, new Date()), "MMM yyyy", { locale: es });
}
