import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type TimelineItem = {
  id: string;
  icon: LucideIcon;
  title: ReactNode;
  meta?: ReactNode;
  aside?: ReactNode;
};

/** Vertical timeline; items render in the given order. */
export function Timeline({ items }: { items: ReadonlyArray<TimelineItem> }) {
  return (
    <ol className="relative flex flex-col">
      {items.map(({ id, icon: Icon, title, meta, aside }, index) => (
        <li key={id} className="relative flex gap-3 pb-5 last:pb-0">
          {index < items.length - 1 && (
            <span aria-hidden="true" className="absolute top-10 bottom-0 left-[1.125rem] w-0.5 bg-beige-300" />
          )}
          <span className="z-[1] flex size-9 shrink-0 items-center justify-center rounded-full bg-olive-100 text-olive-700">
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pt-1.5">
            <div className="min-w-0">
              <div className="font-medium">{title}</div>
              {meta && <div className="mt-0.5 text-sm text-olive-700">{meta}</div>}
            </div>
            {aside && <div className="shrink-0">{aside}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
