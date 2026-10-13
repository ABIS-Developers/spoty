import { addMonths, format } from "date-fns";
import { currentPeriod, dueDate } from "../../payments";

/** Next Spotify charge date (`YYYY-MM-DD`) on or after `today`. */
export function nextBillingDate(billingDay: number, today: Date): string {
  const thisMonth = dueDate(currentPeriod(today), billingDay);
  if (thisMonth >= format(today, "yyyy-MM-dd")) return thisMonth;
  return dueDate(currentPeriod(addMonths(today, 1)), billingDay);
}
