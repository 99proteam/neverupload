import { Download, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { downloadBlob } from '../lib/download';
import { formatBytes as formatSize } from '../lib/format';
import { DeviceBadge } from './DeviceBadge';

export function DownloadButton({
  blob,
  fileName,
  label = 'Download',
  primary = true,
}: {
  blob: Blob;
  fileName: string;
  label?: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={primary ? 'btn-primary' : 'btn-secondary'}
      onClick={() => downloadBlob(blob, fileName)}
    >
      <Download aria-hidden="true" className="h-4 w-4" />
      {label}
    </button>
  );
}

/** The "done" state of a tool: badge, summary, download buttons and reset. */
export function ResultPanel({
  title,
  children,
  actions,
  onReset,
}: {
  title: string;
  children?: ReactNode;
  actions: ReactNode;
  onReset: () => void;
}) {
  return (
    <section aria-labelledby="result-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="result-title" className="text-lg font-semibold">
          {title}
        </h2>
        <DeviceBadge />
      </div>
      {children}
      <div className="flex flex-wrap gap-3">
        {actions}
        <button type="button" className="btn-secondary" onClick={onReset}>
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Process another
        </button>
      </div>
    </section>
  );
}

/** Shows a before/after size comparison. */
export function SizeComparison({ before, after }: { before: number; after: number }) {
  const saved = before > 0 ? Math.round(((before - after) / before) * 100) : 0;
  return (
    <dl className="grid grid-cols-3 gap-3 rounded-lg bg-slate-100 p-3 text-center dark:bg-slate-800">
      <div>
        <dt className="text-xs text-slate-500 dark:text-slate-400">Before</dt>
        <dd className="font-semibold tabular-nums">{formatSize(before)}</dd>
      </div>
      <div>
        <dt className="text-xs text-slate-500 dark:text-slate-400">After</dt>
        <dd className="font-semibold tabular-nums">{formatSize(after)}</dd>
      </div>
      <div>
        <dt className="text-xs text-slate-500 dark:text-slate-400">Saved</dt>
        <dd
          className={`font-semibold tabular-nums ${saved > 0 ? 'text-brand-700 dark:text-brand-400' : ''}`}
        >
          {saved > 0 ? `${saved}%` : '0%'}
        </dd>
      </div>
    </dl>
  );
}
