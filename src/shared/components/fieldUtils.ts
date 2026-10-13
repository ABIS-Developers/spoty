/** Ids for `aria-describedby` of the control inside a `Field`. */
export function fieldDescribedBy(id: string, error?: string | null, hint?: string): string | undefined {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

/** Shared look of text inputs and picker triggers. */
export const controlClasses =
  "w-full min-w-0 rounded-lg border border-beige-300 bg-white px-3 text-base text-olive-950 outline-none transition-colors duration-150 placeholder:text-olive-700 focus:border-olive-700 disabled:bg-beige-100 aria-invalid:border-status-overdue";
