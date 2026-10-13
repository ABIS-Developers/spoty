type ProgressBarProps = {
  value: number;
  max: number;
  /** Accessible name, e.g. "Espacios ocupados". */
  label: string;
};

export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-2 w-full overflow-hidden rounded-full bg-beige-100"
    >
      <div
        className="h-full rounded-full bg-olive-700 transition-transform duration-200 origin-left"
        style={{ transform: `scaleX(${percent / 100})` }}
      />
    </div>
  );
}
