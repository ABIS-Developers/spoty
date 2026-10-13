import { create } from "zustand";
import {
  clearDataClient,
  configureDataClient,
  isUnauthorizedError,
} from "../../../shared/api/dataClient";

export const PIN_STORAGE_KEY = "spoty:pin";

export type LoginResult = "ok" | "wrong-pin" | "network-error";

type SessionState = {
  pin: string | null;
  login: (pin: string) => Promise<LoginResult>;
  logout: () => void;
};

function readStoredPin(): string | null {
  try {
    return sessionStorage.getItem(PIN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredPin(pin: string | null): void {
  try {
    if (pin === null) sessionStorage.removeItem(PIN_STORAGE_KEY);
    else sessionStorage.setItem(PIN_STORAGE_KEY, pin);
  } catch {
    // Storage unavailable (private mode): the session lasts until reload.
  }
}

const initialPin = readStoredPin();
if (initialPin) configureDataClient(initialPin);

export const useSessionStore = create<SessionState>((set) => ({
  pin: initialPin,

  login: async (pin) => {
    const client = configureDataClient(pin);
    try {
      // Any authorized call proves the PIN; the authorizer rejects wrong ones.
      const { errors } = await client.models.Account.list({ limit: 1 });
      if (errors?.length) {
        clearDataClient();
        return isUnauthorizedError(errors) ? "wrong-pin" : "network-error";
      }
    } catch (error) {
      clearDataClient();
      return isUnauthorizedError(error) ? "wrong-pin" : "network-error";
    }
    writeStoredPin(pin);
    set({ pin });
    return "ok";
  },

  logout: () => {
    writeStoredPin(null);
    clearDataClient();
    set({ pin: null });
  },
}));
