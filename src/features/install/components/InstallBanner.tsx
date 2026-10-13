import { useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button, IconButton } from "../../../shared/components";
import { dismiss, isDismissed } from "../lib/dismissal";
import { isIos, isPhone, isStandalone } from "../lib/platform";
import { useInstallStore } from "../store/installStore";
import { installTexts } from "../texts";

/** Suggests adding Spoty to the home screen. Mounted in AppShell, so it only exists after login. */
export function InstallBanner() {
  const deferredPrompt = useInstallStore((state) => state.deferredPrompt);
  const installed = useInstallStore((state) => state.installed);
  const promptInstall = useInstallStore((state) => state.promptInstall);
  // Platform and dismissal are read once per mount; they do not change while the page is open.
  const [eligible] = useState(() => !isStandalone() && isPhone());
  const [ios] = useState(isIos);
  const [dismissed, setDismissed] = useState(() => isDismissed(new Date()));

  const variant = deferredPrompt ? "android" : ios ? "ios" : null;
  if (!eligible || dismissed || installed || !variant) return null;

  const close = () => {
    dismiss(new Date());
    setDismissed(true);
  };

  return (
    <section
      aria-label={installTexts.title}
      className="mb-6 flex animate-fade-in items-start gap-3 rounded-2xl border border-beige-300 bg-white p-4 shadow-sm"
    >
      <img src="/icons/icon-192.png" alt="" className="size-11 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <h2 className="font-semibold text-olive-900">{installTexts.title}</h2>
          {variant === "android" ? (
            <p className="text-sm text-olive-950/80">{installTexts.androidBody}</p>
          ) : (
            <>
              <p className="text-sm text-olive-950/80">{installTexts.iosBody}</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-medium text-olive-900">
                <Share aria-hidden="true" className="size-4 shrink-0" />
                {installTexts.iosShareStep}
                <span aria-hidden="true">→</span>
                <SquarePlus aria-hidden="true" className="size-4 shrink-0" />
                {installTexts.iosAddStep}
              </p>
            </>
          )}
        </div>
        {variant === "android" && (
          <Button icon={Download} onClick={() => void promptInstall()} className="self-start">
            {installTexts.install}
          </Button>
        )}
      </div>
      <IconButton icon={X} label={installTexts.close} onClick={close} className="-mt-2 -mr-2" />
    </section>
  );
}
