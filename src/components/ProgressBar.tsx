/** Accessible progress bar. `value` null means "in progress, unknown amount". */
export function ProgressBar({ value, label }: { value: number | null; label: string }) {
  const pct = value === null ? null : Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
        <span>{label}</span>
        {pct !== null && <span className="tabular-nums">{pct}%</span>}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct ?? undefined}
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      >
        <div
          className={`h-full rounded-full bg-brand-500 transition-[width] duration-200 ${
            pct === null ? 'w-1/3 animate-pulse' : ''
          }`}
          style={pct === null ? undefined : { width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}
