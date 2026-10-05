import { FileText } from 'lucide-react';
import { useState } from 'react';
import { DropZone } from '../../components/DropZone';
import { FileList } from '../../components/FileList';
import { JobStatus } from '../../components/JobStatus';
import { DownloadButton, ResultPanel } from '../../components/ResultPanel';
import { ToolPage } from '../../components/ToolPage';
import { useJob } from '../../hooks/useJob';
import { moveItem } from '../../lib/array';
import { bytesToBlob } from '../../lib/download';
import { makeId, readFileBytes } from '../../lib/files';
import { formatBytes } from '../../lib/format';
import { runPdfJob } from '../../workers';
import { meta } from './meta';

interface Item {
  id: string;
  file: File;
}

const PDF_ACCEPT = 'application/pdf,.pdf';

export default function MergePdfTool() {
  const [items, setItems] = useState<Item[]>([]);
  const job = useJob<Blob>();

  const addFiles = (files: File[]) => {
    job.reset();
    setItems((prev) => [...prev, ...files.map((file) => ({ id: makeId(), file }))]);
  };

  const merge = () =>
    job.run('Merging PDFs…', async (onProgress) => {
      const files = await Promise.all(
        items.map(async (i) => ({ name: i.file.name, data: await readFileBytes(i.file) })),
      );
      const bytes = await runPdfJob<Uint8Array>('merge', { files }, { onProgress });
      return bytesToBlob(bytes, 'application/pdf');
    });

  const reset = () => {
    setItems([]);
    job.reset();
  };

  const total = items.reduce((sum, i) => sum + i.file.size, 0);

  return (
    <ToolPage meta={meta}>
      {job.state.status === 'done' ? (
        <ResultPanel
          title="Your merged PDF is ready"
          onReset={reset}
          actions={
            <DownloadButton
              blob={job.state.result}
              fileName="merged.pdf"
              label="Download merged PDF"
            />
          }
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {items.length} files combined · {formatBytes(job.state.result.size)}
          </p>
        </ResultPanel>
      ) : items.length === 0 ? (
        <div className="space-y-4">
          <DropZone
            accept={PDF_ACCEPT}
            multiple
            label="PDF files"
            hint="Add two or more PDFs. You can reorder them next."
            onFiles={addFiles}
            onError={job.fail}
          />
          <JobStatus state={job.state} onDismiss={job.reset} />
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Drag files, or use the arrows, to set the order. The first file comes first.
          </p>
          <FileList
            items={items}
            getKey={(i) => i.id}
            getLabel={(i) => i.file.name}
            disabled={job.busy}
            onMove={(from, to) => setItems((list) => moveItem(list, from, to))}
            onRemove={(index) => setItems((list) => list.filter((_, i) => i !== index))}
            renderItem={(item) => (
              <div className="flex items-center gap-2">
                <FileText aria-hidden="true" className="h-5 w-5 shrink-0 text-red-600" />
                <span className="truncate text-sm font-medium">{item.file.name}</span>
                <span className="ml-auto shrink-0 text-xs text-slate-500">
                  {formatBytes(item.file.size)}
                </span>
              </div>
            )}
          />
          <DropZone
            accept={PDF_ACCEPT}
            multiple
            compact
            label="PDFs"
            onFiles={addFiles}
            onError={job.fail}
            disabled={job.busy}
          />
          <JobStatus state={job.state} onDismiss={job.reset} />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={merge}
              disabled={items.length < 2 || job.busy}
            >
              Merge {items.length} PDFs
            </button>
            <button type="button" className="btn-secondary" onClick={reset} disabled={job.busy}>
              Clear
            </button>
            <span className="text-sm text-slate-500">Total {formatBytes(total)}</span>
          </div>
          {items.length < 2 && (
            <p className="text-sm text-slate-500">Add at least one more PDF to merge.</p>
          )}
        </div>
      )}
    </ToolPage>
  );
}
