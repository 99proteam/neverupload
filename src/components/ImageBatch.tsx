import { ImageIcon } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { useObjectUrls } from '../hooks/useObjectUrls';
import type { ImageBatchOutput } from '../lib/imageBatchZip';
import { formatBytes, percentSaved } from '../lib/format';
import { FileList } from './FileList';
import { DownloadButton, ResultPanel } from './ResultPanel';
import { ErrorAlert } from './ErrorAlert';

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

export interface ImageItem {
  id: string;
  file: File;
}

/** Selected images with thumbnails and a remove button. */
export function ImageFileList({
  items,
  onRemove,
  disabled,
}: {
  items: ImageItem[];
  onRemove: (index: number) => void;
  disabled?: boolean;
}) {
  const files = useMemo(() => items.map((i) => i.file), [items]);
  const previews = useObjectUrls(files);
  return (
    <FileList
      items={items}
      getKey={(i) => i.id}
      getLabel={(i) => i.file.name}
      onRemove={onRemove}
      disabled={disabled}
      renderItem={(item, index) => (
        <div className="flex items-center gap-3">
          {previews[index] ? (
            <img src={previews[index]} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
          ) : (
            <ImageIcon aria-hidden="true" className="h-6 w-6" />
          )}
          <span className="truncate text-sm font-medium">{item.file.name}</span>
          <span className="ml-auto shrink-0 text-xs text-slate-500">
            {formatBytes(item.file.size)}
          </span>
        </div>
      )}
    />
  );
}

/** Result view shared by the image tools: per-file sizes and downloads, plus "download all". */
export function ImageBatchResults({
  output,
  onReset,
  zipName,
  extra,
  showDimensions = false,
}: {
  output: ImageBatchOutput;
  onReset: () => void;
  zipName: string;
  extra?: ReactNode;
  showDimensions?: boolean;
}) {
  const ok = output.results.filter((r) => r.blob);
  const failed = output.results.filter((r) => r.error);
  const before = ok.reduce((s, r) => s + r.originalSize, 0);
  const after = ok.reduce((s, r) => s + r.size, 0);
  const first = ok[0];

  return (
    <ResultPanel
      title={
        ok.length === 0
          ? 'No images could be processed'
          : `${ok.length} image${ok.length === 1 ? ' is' : 's are'} ready`
      }
      onReset={onReset}
      actions={
        output.zip ? (
          <DownloadButton blob={output.zip} fileName={zipName} label="Download all (zip)" />
        ) : first?.blob ? (
          <DownloadButton blob={first.blob} fileName={first.name} label="Download image" />
        ) : null
      }
    >
      {failed.map((r) => (
        <ErrorAlert key={r.originalName} message={`${r.originalName}: ${r.error}`} />
      ))}
      {ok.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th scope="col" className="py-2 pr-3 font-medium">
                  File
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Size
                </th>
                {showDimensions && (
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Dimensions
                  </th>
                )}
                <th scope="col" className="py-2 font-medium">
                  <span className="sr-only">Download</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {ok.map((r) => {
                const saved = percentSaved(r.originalSize, r.size);
                return (
                  <tr key={r.originalName + r.name}>
                    <td className="max-w-48 truncate py-2 pr-3 font-medium">{r.name}</td>
                    <td className="py-2 pr-3 whitespace-nowrap tabular-nums">
                      {formatBytes(r.originalSize)} → {formatBytes(r.size)}{' '}
                      {r.keptOriginal ? (
                        <span className="text-xs text-slate-500">(already optimized)</span>
                      ) : (
                        <span
                          className={`text-xs ${saved > 0 ? 'text-brand-700 dark:text-brand-400' : 'text-slate-500'}`}
                        >
                          ({saved > 0 ? `−${saved}%` : `+${-saved}%`})
                        </span>
                      )}
                    </td>
                    {showDimensions && (
                      <td className="py-2 pr-3 whitespace-nowrap tabular-nums">
                        {r.width}×{r.height}
                      </td>
                    )}
                    <td className="py-2 text-right">
                      {r.blob && output.zip && (
                        <DownloadButton
                          blob={r.blob}
                          fileName={r.name}
                          label="Save"
                          primary={false}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {ok.length > 1 && (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Total: {formatBytes(before)} → {formatBytes(after)}
        </p>
      )}
      {extra}
    </ResultPanel>
  );
}
