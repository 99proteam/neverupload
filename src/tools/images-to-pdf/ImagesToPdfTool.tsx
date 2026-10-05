import { useMemo, useState } from 'react';
import { DropZone } from '../../components/DropZone';
import { FileList } from '../../components/FileList';
import { JobStatus } from '../../components/JobStatus';
import { DownloadButton, ResultPanel } from '../../components/ResultPanel';
import { Segmented } from '../../components/Segmented';
import { ToolPage } from '../../components/ToolPage';
import { useJob } from '../../hooks/useJob';
import { useObjectUrls } from '../../hooks/useObjectUrls';
import { moveItem } from '../../lib/array';
import { bytesToBlob } from '../../lib/download';
import { makeId, readFileBytes } from '../../lib/files';
import { formatBytes } from '../../lib/format';
import { runPdfJob } from '../../workers';
import { meta } from './meta';
import type { Orientation, PageSize } from './process';

interface Item {
  id: string;
  file: File;
}

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

export default function ImagesToPdfTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [margin, setMargin] = useState<'none' | 'small'>('small');
  const job = useJob<Blob>();
  const files = useMemo(() => items.map((i) => i.file), [items]);
  const previews = useObjectUrls(files);

  const addFiles = (added: File[]) => {
    job.reset();
    setItems((prev) => [...prev, ...added.map((file) => ({ id: makeId(), file }))]);
  };

  const convert = () =>
    job.run('Creating PDF…', async (onProgress) => {
      const images = await Promise.all(
        items.map(async (i) => ({ name: i.file.name, data: await readFileBytes(i.file) })),
      );
      const bytes = await runPdfJob<Uint8Array>(
        'imagesToPdf',
        { images, options: { pageSize, orientation, margin: margin === 'small' ? 28 : 0 } },
        { onProgress },
      );
      return bytesToBlob(bytes, 'application/pdf');
    });

  const reset = () => {
    setItems([]);
    job.reset();
  };

  return (
    <ToolPage meta={meta}>
      {job.state.status === 'done' ? (
        <ResultPanel
          title="Your PDF is ready"
          onReset={reset}
          actions={
            <DownloadButton blob={job.state.result} fileName="images.pdf" label="Download PDF" />
          }
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {items.length} image{items.length === 1 ? '' : 's'} ·{' '}
            {formatBytes(job.state.result.size)}
          </p>
        </ResultPanel>
      ) : items.length === 0 ? (
        <div className="space-y-4">
          <DropZone
            accept={IMAGE_ACCEPT}
            multiple
            label="images"
            hint="JPG, PNG or WebP. Each image becomes one page."
            onFiles={addFiles}
            onError={job.fail}
          />
          <JobStatus state={job.state} onDismiss={job.reset} />
        </div>
      ) : (
        <div className="space-y-5">
          <FileList
            items={items}
            getKey={(i) => i.id}
            getLabel={(i) => i.file.name}
            disabled={job.busy}
            onMove={(from, to) => setItems((l) => moveItem(l, from, to))}
            onRemove={(index) => setItems((l) => l.filter((_, i) => i !== index))}
            renderItem={(item, index) => (
              <div className="flex items-center gap-3">
                <img
                  src={previews[index]}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded object-cover"
                  draggable={false}
                />
                <span className="truncate text-sm font-medium">{item.file.name}</span>
                <span className="ml-auto shrink-0 text-xs text-slate-500">
                  {formatBytes(item.file.size)}
                </span>
              </div>
            )}
          />
          <DropZone
            accept={IMAGE_ACCEPT}
            multiple
            compact
            label="images"
            onFiles={addFiles}
            onError={job.fail}
            disabled={job.busy}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Segmented
              label="Page size"
              value={pageSize}
              onChange={setPageSize}
              disabled={job.busy}
              options={[
                { value: 'a4', label: 'A4' },
                { value: 'letter', label: 'Letter' },
                { value: 'fit', label: 'Fit to image' },
              ]}
            />
            {pageSize !== 'fit' && (
              <>
                <Segmented
                  label="Orientation"
                  value={orientation}
                  onChange={setOrientation}
                  disabled={job.busy}
                  options={[
                    { value: 'auto', label: 'Auto' },
                    { value: 'portrait', label: 'Portrait' },
                    { value: 'landscape', label: 'Landscape' },
                  ]}
                />
                <Segmented
                  label="Margin"
                  value={margin}
                  onChange={setMargin}
                  disabled={job.busy}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'small', label: 'Small' },
                  ]}
                />
              </>
            )}
          </div>
          <JobStatus state={job.state} onDismiss={job.reset} />
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={convert} disabled={job.busy}>
              Create PDF
            </button>
            <button type="button" className="btn-secondary" onClick={reset} disabled={job.busy}>
              Clear
            </button>
          </div>
        </div>
      )}
    </ToolPage>
  );
}
