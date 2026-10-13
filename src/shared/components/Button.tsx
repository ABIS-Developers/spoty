import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "inverse";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-olive-700 text-white hover:bg-olive-600",
  secondary: "border border-beige-300 bg-white text-olive-900 hover:bg-beige-100",
  ghost: "text-olive-900 hover:bg-beige-100",
  danger: "bg-status-overdue text-white hover:bg-status-overdue/90",
  /** On olive backgrounds. */
  inverse: "text-white hover:bg-white/10",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  icon: Icon,
  loading = false,
  fullWidth = false,
  type = "button",
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading ? <Spinner /> : Icon && <Icon aria-hidden="true" className="size-5 shrink-0" />}
      {children}
    </button>
  );
}

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: LucideIcon;
  /** Accessible name; icon-only buttons have no visible text. */
  label: string;
  variant?: Exclude<ButtonVariant, "danger">;
};

export function IconButton({
  icon: Icon,
  label,
  variant = "ghost",
  type = "button",
  className = "",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
