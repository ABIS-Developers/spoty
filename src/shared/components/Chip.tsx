import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type ChipProps = {
  icon?: LucideIcon;
  children: ReactNode;
  /** Renders a link; interactive chips get a 44px touch target. */
  href?: string;
  external?: boolean;
  title?: string;
};

export function Chip({ icon: Icon, children, href, external = false, title }: ChipProps) {
  const content = (
    <>
      {Icon && <Icon aria-hidden="true" className="size-4 shrink-0 text-olive-700" />}
      <span className="truncate">{children}</span>
    </>
  );
  const base = "inline-flex max-w-full items-center gap-1.5 rounded-full border border-beige-300 bg-beige-100 px-3 text-sm";

  if (href) {
    return (
      <a
        href={href}
        title={title}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={`${base} min-h-11 font-medium transition-colors duration-150 hover:bg-olive-100`}
      >
        {content}
      </a>
    );
  }
  return (
    <span title={title} className={`${base} h-8`}>
      {content}
    </span>
  );
}
