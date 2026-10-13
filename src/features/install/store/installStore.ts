import { create } from "zustand";

// Minimal typing; the event is not in lib.dom.d.ts.
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallState = {
  // Event captured from `beforeinstallprompt`. null on iOS and when not offered.
  deferredPrompt: BeforeInstallPromptEvent | null;
  // true after `appinstalled` fires or once the native dialog is accepted.
  installed: boolean;
  /** Opens the native install dialog. The event can only be used once, so it is cleared. */
  promptInstall: () => Promise<void>;
};

export const useInstallStore = create<InstallState>((set, get) => ({
  deferredPrompt: null,
  installed: false,

  promptInstall: async () => {
    const event = get().deferredPrompt;
    if (!event) return;
    set({ deferredPrompt: null });
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") set({ installed: true });
  },
}));

let listening = false;

/** Call once before rendering: the browser can fire `beforeinstallprompt` while the PIN screen is shown. */
export function initInstallListeners(): void {
  if (listening) return;
  listening = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    useInstallStore.setState({ deferredPrompt: event as BeforeInstallPromptEvent });
  });

  window.addEventListener("appinstalled", () => {
    useInstallStore.setState({ installed: true, deferredPrompt: null });
  });
}
