export const INSTALL_BANNER_DISMISS_KEY = "install-banner:dismissedAt:v1";
export const INSTALL_BANNER_DISMISS_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** True while `now` is within the dismissal window. Storage errors count as not dismissed. */
export function isDismissed(now: Date): boolean {
  try {
    const stored = localStorage.getItem(INSTALL_BANNER_DISMISS_KEY);
    if (!stored) return false;
    const dismissedAt = new Date(stored).getTime();
    if (Number.isNaN(dismissedAt)) return false;
    return now.getTime() < dismissedAt + INSTALL_BANNER_DISMISS_DAYS * DAY_MS;
  } catch {
    return false;
  }
}

export function dismiss(now: Date): void {
  try {
    localStorage.setItem(INSTALL_BANNER_DISMISS_KEY, now.toISOString());
  } catch {
    // Storage unavailable: the banner hides until the next reload.
  }
}
