import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { CopyButton, IconButton } from "../../../shared/components";
import { accountsTexts } from "../texts";

const MASK = "••••••••";

/** Masked by default, with show and copy buttons. */
export function PasswordField({ password }: { password: string }) {
  const [visible, setVisible] = useState(false);
  const { detail } = accountsTexts;

  return (
    <div className="flex items-center gap-1">
      <KeyRound aria-hidden="true" className="size-5 shrink-0 text-olive-700" />
      <div className="min-w-0 flex-1 px-1">
        <p className="text-sm text-olive-700">{detail.password}</p>
        <p className={`truncate font-mono text-base ${visible ? "" : "tracking-widest"}`} title={visible ? password : undefined}>
          {visible ? password : MASK}
        </p>
      </div>
      <IconButton
        icon={visible ? EyeOff : Eye}
        label={visible ? detail.hidePassword : detail.showPassword}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      />
      <CopyButton value={password} label={detail.copyPassword} />
    </div>
  );
}
