import { CheckCircle2 } from 'lucide-react';

/** Shown after every job: a reminder that the work happened locally. */
export function DeviceBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-900/50 dark:text-brand-200">
      <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
      Processed on your device
    </span>
  );
}
