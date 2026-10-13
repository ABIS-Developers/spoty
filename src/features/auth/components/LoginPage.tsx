import { useState, type FormEvent } from "react";
import { AlertTriangle, Loader2, Lock } from "lucide-react";
import { useSessionStore } from "../store/sessionStore";
import { authTexts } from "../texts";

export function LoginPage() {
  const login = useSessionStore((state) => state.login);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = pin.trim();
    if (!value) {
      setError(authTexts.emptyPin);
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await login(value);
    setSubmitting(false);
    if (result === "wrong-pin") {
      setError(authTexts.wrongPin);
      setPin("");
    } else if (result === "network-error") {
      setError(authTexts.networkError);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-olive-900 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-olive-100 text-olive-700">
            <Lock aria-hidden="true" className="size-7" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">{authTexts.appName}</h1>
          <p className="mt-1 text-sm text-olive-700">{authTexts.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pin" className="text-sm font-medium">
              {authTexts.pinLabel}
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              autoFocus
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "pin-error" : undefined}
              className="h-12 w-full rounded-lg border border-beige-300 bg-white px-3 text-center text-base tracking-[0.4em] outline-none transition-colors duration-150 focus:border-olive-700 aria-invalid:border-status-overdue"
            />
            {error && (
              <p id="pin-error" role="alert" className="flex items-center gap-1.5 text-sm text-status-overdue">
                <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-olive-700 font-medium text-white transition-colors duration-150 hover:bg-olive-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting && <Loader2 aria-hidden="true" className="size-5 animate-spin" />}
            {submitting ? authTexts.submitting : authTexts.submit}
          </button>
        </form>
      </div>
    </div>
  );
}
