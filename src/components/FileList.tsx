import { ArrowDown, ArrowUp, GripVertical, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useDragReorder } from '../hooks/useDragReorder';

interface FileListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  onMove?: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

/** A list of files that can be reordered by dragging or with the arrow buttons. */
export function FileList<T>({
  items,
  getKey,
  getLabel,
  renderItem,
  onMove,
  onRemove,
  disabled,
}: FileListProps<T>) {
  const { itemProps, dragIndex, overIndex } = useDragReorder((from, to) => onMove?.(from, to));
  const sortable = Boolean(onMove) && !disabled;

  return (
    <ol className="space-y-2">
      {items.map((item, index) => (
        <li
          key={getKey(item)}
          {...(sortable ? itemProps(index) : {})}
          className={`flex items-center gap-2 rounded-lg border bg-white p-2 dark:bg-slate-950 ${
            overIndex === index && dragIndex !== index
              ? 'border-brand-500'
              : 'border-slate-200 dark:border-slate-800'
          } ${dragIndex === index ? 'opacity-50' : ''}`}
        >
          {sortable && (
            <GripVertical
              aria-hidden="true"
              className="h-5 w-5 shrink-0 cursor-grab text-slate-400"
            />
          )}
          <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
          {sortable && (
            <>
              <button
                type="button"
                className="btn-icon"
                onClick={() => onMove?.(index, index - 1)}
                disabled={index === 0}
                aria-label={`Move ${getLabel(item)} up`}
              >
                <ArrowUp aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="btn-icon"
                onClick={() => onMove?.(index, index + 1)}
                disabled={index === items.length - 1}
                aria-label={`Move ${getLabel(item)} down`}
              >
                <ArrowDown aria-hidden="true" className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            type="button"
            className="btn-icon"
            onClick={() => onRemove(index)}
            disabled={disabled}
            aria-label={`Remove ${getLabel(item)}`}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ol>
  );
}
