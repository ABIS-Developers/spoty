// Tailwind's default `lg` breakpoint (64rem).
const LG_BREAKPOINT_QUERY = "(min-width: 64rem)";

/** True when running from the home screen icon instead of a browser tab. */
export function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

/** iPhone / iPad, including iPadOS that reports itself as `MacIntel`. */
export function isIos(): boolean {
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/** Touch device below the `lg` breakpoint. */
export function isPhone(): boolean {
  return (
    window.matchMedia("(pointer: coarse)").matches &&
    !window.matchMedia(LG_BREAKPOINT_QUERY).matches
  );
}
