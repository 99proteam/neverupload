import { Upload } from 'lucide-react';
import { useId, useRef, useState, type DragEvent } from 'react';
import { formatBytes } from '../lib/format';
import { matchesAccept, MAX_FILE_BYTES } from '../lib/files';

interface DropZoneProps {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  onError?: (message: string) => void;
  /** e.g. "PDF files" */
  label: string;
  hint?: string;
  compact?: boolean;
  disabled?: boolean;
}

/**
 * Drag-and-drop area plus a regular file picker. Files are only read locally;
 * the "upload" icon is just the familiar metaphor — nothing is sent anywhere.
 */
export function DropZone({
  accept,
  multiple = false,
  onFiles,
  onError,
  label,
  hint,
  compact = false,
  disabled = false,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hintId = useId();

  const handle = (list: FileList | null) => {
    if (!list || disabled) return;
    let files = Array.from(list);
    if (!multiple) files = files.slice(0, 1);
    const rejected = files.filter((f) => !matchesAccept(f, accept));
    const tooBig = files.filter((f) => f.size > MAX_FILE_BYTES);
    const ok = files.filter((f) => matchesAccept(f, accept) && f.size <= MAX_FILE_BYTES);
    if (rejected.length > 0) {
      onError?.(
        `${rejected.map((f) => `"${f.name}"`).join(', ')} ${rejected.length === 1 ? "isn't" : "aren't"} supported here. Please choose ${label}.`,
      );
    } else if (tooBig.length > 0) {
      onError?.(`Files larger than ${formatBytes(MAX_FILE_BYTES)} are not supported.`);
    }
    if (ok.length > 0) onFiles(ok);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handle(e.dataTransfer.files);
  };

  const isFileDrag = (e: DragEvent) => Array.from(e.dataTransfer.types).includes('Files');

  return (
    <div
      onDragOver={(e) => {
        if (!isFileDrag(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={onDrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) inputRef.current?.click();
      }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors ${
        compact ? 'gap-2 p-4' : 'gap-3 px-4 py-10 sm:py-14'
      } ${
        dragging
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
          : 'border-slate-300 bg-slate-50 hover:border-brand-400 dark:border-slate-700 dark:bg-slate-900/50'
      } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      {!compact && (
        <Upload
          aria-hidden="true"
          className="pointer-events-none h-10 w-10 text-brand-600 dark:text-brand-400"
        />
      )}
      {!compact && (
        <p className="pointer-events-none text-base font-medium">Drop {label} here, or</p>
      )}
      <button
        type="button"
        className={compact ? 'btn-secondary' : 'btn-primary'}
        onClick={() => inputRef.current?.click()}
        aria-describedby={hint ? hintId : undefined}
        disabled={disabled}
      >
        {compact ? `Add more ${label}` : `Choose ${label}`}
      </button>
      {hint && (
        <p id={hintId} className="pointer-events-none text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        tabIndex={-1}
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
