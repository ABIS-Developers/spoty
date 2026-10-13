import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { Dialog } from "./Dialog";

type PickerPanelProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Wrapper around the trigger; clicks inside it do not close the popover. */
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
};

/** Bottom sheet below 640px, popover under the trigger above. */
export function PickerPanel({ open, onClose, title, anchorRef, children }: PickerPanelProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open || !isDesktop) return;
    function onPointerDown(event: PointerEvent) {
      if (!anchorRef.current?.contains(event.target as Node)) onCloseRef.current();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        anchorRef.current?.querySelector<HTMLElement>("button")?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    anchorRef.current?.addEventListener("keydown", onKeyDown);
    const anchor = anchorRef.current;
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      anchor?.removeEventListener("keydown", onKeyDown);
    };
  }, [open, isDesktop, anchorRef]);

  if (!isDesktop) {
    return (
      <Dialog open={open} onClose={onClose} title={title}>
        <div className="flex justify-center">{children}</div>
      </Dialog>
    );
  }
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-label={title}
      className="absolute top-full left-0 z-30 mt-2 animate-pop-in rounded-xl border border-beige-300 bg-white p-3 shadow-lg"
    >
      {children}
    </div>
  );
}
