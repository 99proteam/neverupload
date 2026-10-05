import { FileText } from 'lucide-react';
import { formatBytes } from '../lib/format';

export function PdfFileHeader({
  file,
  pageCount,
  onChange,
  disabled,
}: {
  file: File;
  pageCount: number;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
      <FileText aria-hidden="true" className="h-6 w-6 shrink-0 text-red-600" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{file.name}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {pageCount} page{pageCount === 1 ? '' : 's'} · {formatBytes(file.size)}
        </p>
      </div>
      <button type="button" className="btn-secondary" onClick={onChange} disabled={disabled}>
        Choose another file
      </button>
    </div>
  );
}
