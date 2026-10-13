import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { Button, Input } from "../../../shared/components";
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
          <Input
            id="pin"
            name="pin"
            label={authTexts.pinLabel}
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            autoFocus
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            error={error}
            className="h-12 text-center tracking-[0.4em]"
          />
          <Button type="submit" loading={submitting} fullWidth className="h-12">
            {submitting ? authTexts.submitting : authTexts.submit}
          </Button>
        </form>
      </div>
    </div>
  );
}
