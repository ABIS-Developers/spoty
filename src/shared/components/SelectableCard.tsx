import type { ReactNode } from "react";
import { CheckCircle2, type LucideIcon } from "lucide-react";

type SelectableCardProps = {
  selected: boolean;
  onSelect: () => void;
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  disabled?: boolean;
};

/** Large tappable option card; use several side by side instead of a `<select>`. */
export function SelectableCard({ selected, onSelect, icon: Icon, title, description, disabled }: SelectableCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`relative flex min-h-11 w-full flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${
        selected ? "border-olive-700 bg-olive-100" : "border-beige-300 bg-white hover:bg-beige-100"
      }`}
    >
      <Icon aria-hidden="true" className="size-6 text-olive-700" />
      <span className="font-semibold">{title}</span>
      {description && <span className="text-sm text-olive-700">{description}</span>}
      {selected && <CheckCircle2 aria-hidden="true" className="absolute top-3 right-3 size-5 text-olive-700" />}
    </button>
  );
}
