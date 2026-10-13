import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type FormSectionProps = {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
};

/** Visual group of form fields with an icon heading. */
export function FormSection({ icon: Icon, title, children }: FormSectionProps) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-4">
      <legend className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-olive-700 uppercase">
        <Icon aria-hidden="true" className="size-4" />
        {title}
      </legend>
      {children}
    </fieldset>
  );
}
