import { initials } from "../lib/initials";

type AvatarSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "size-8 text-sm",
  md: "size-11 text-base",
  lg: "size-16 text-xl",
};

export function Avatar({ name, size = "md" }: { name: string; size?: AvatarSize }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-olive-100 font-semibold text-olive-900 ${SIZE_CLASSES[size]}`}
    >
      {initials(name)}
    </span>
  );
}
