import { useId, useState } from 'react';
import { DropZone } from '../../components/DropZone';
import { JobStatus } from '../../components/JobStatus';
import { PdfFileHeader } from '../../components/PdfFileHeader';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadButton, ResultPanel } from '../../components/ResultPanel';
import { Segmented } from '../../components/Segmented';
import { ToolPage } from '../../components/ToolPage';
import { useJob } from '../../hooks/useJob';
import { usePdfFile } from '../../hooks/usePdfFile';
import { bytesToBlob } from '../../lib/download';
import { readFileBytes } from '../../lib/files';
import { formatBytes } from '../../lib/format';
import { runPdfJob } from '../../workers';
import type { ToolProps } from '../types';
import { meta } from './meta';
import {
  DEFAULT_PAGE_NUMBER_OPTIONS,
  formatPageNumber,
  pageNumbersFileName,
  type NumberFormat,
  type NumberPosition,
  type PageNumberOptions,
} from './process';

interface NumberResult {
  blob: Blob;
  fileName: string;
}

const POSITIONS: { value: NumberPosition; label: string }[] = [
  { value: 'bottom-center', label: 'Bottom center' },
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'top-center', label: 'Top center' },
  { value: 'top-right', label: 'Top right' },
  { value: 'top-left', label: 'Top left' },
];

const FORMATS: NumberFormat[] = ['n', 'page-n', 'n-of-total', 'page-n-of-total'];

export default function AddPageNumbersTool({ page = meta }: ToolProps) {
  const job = useJob<NumberResult>();
  const { pdf, loading, load, clear } = usePdfFile(job.fail);
  const [options, setOptions] = useState<PageNumberOptions>(DEFAULT_PAGE_NUMBER_OPTIONS);
  const ids = { position: useId(), format: useId(), start: useId(), skip: useId() };

  const set = <K extends keyof PageNumberOptions>(key: K, value: PageNumberOptions[K]) =>
    setOptions((o) => ({ ...o, [key]: value }));

  const total = pdf ? options.startAt + pdf.pageCount - (options.skipFirst ? 2 : 1) : 0;

  const run = () => {
    if (!pdf) return;
    job.run('Adding page numbers…', async (onProgress) => {
      const file = { name: pdf.file.name, data: await readFileBytes(pdf.file) };
      const data = await runPdfJob<Uint8Array>('pageNumbers', { file, options }, { onProgress });
      return {
        blob: bytesToBlob(data, 'application/pdf'),
        fileName: pageNumbersFileName(pdf.file.name),
      };
    });
  };

  const reset = () => {
    clear();
    job.reset();
  };

  return (
    <ToolPage meta={page}>
      {job.state.status === 'done' ? (
        <ResultPanel
          title="Your numbered PDF is ready"
          onReset={reset}
          actions={
            <DownloadButton
              blob={job.state.result.blob}
              fileName={job.state.result.fileName}
              label="Download PDF"
            />
          }
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {job.state.result.fileName} · {formatBytes(job.state.result.blob.size)}
          </p>
        </ResultPanel>
      ) : !pdf ? (
        <div className="space-y-4">
          <DropZone
            accept="application/pdf,.pdf"
            label="a PDF file"
            onFiles={(files) => {
              job.reset();
              if (files[0]) void load(files[0]);
            }}
            onError={job.fail}
            disabled={loading}
          />
          {loading && <ProgressBar value={null} label="Opening PDF…" />}
          <JobStatus state={job.state} onDismiss={job.reset} />
        </div>
      ) : (
        <div className="space-y-5">
          <PdfFileHeader
            file={pdf.file}
            pageCount={pdf.pageCount}
            onChange={reset}
            disabled={job.busy}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={ids.position} className="field-label">
                Position
              </label>
              <select
                id={ids.position}
                className="input"
                value={options.position}
                onChange={(e) => set('position', e.target.value as NumberPosition)}
                disabled={job.busy}
              >
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={ids.format} className="field-label">
                Style
              </label>
              <select
                id={ids.format}
                className="input"
                value={options.format}
                onChange={(e) => set('format', e.target.value as NumberFormat)}
                disabled={job.busy}
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {formatPageNumber(f, options.startAt, Math.max(total, options.startAt))}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={ids.start} className="field-label">
                Start at
              </label>
              <input
                id={ids.start}
                className="input"
                type="number"
                min={0}
                inputMode="numeric"
                value={options.startAt}
                onChange={(e) => set('startAt', Math.max(0, Math.round(Number(e.target.value))))}
                disabled={job.busy}
              />
            </div>
            <Segmented<string>
              label="Size"
              value={String(options.fontSize)}
              onChange={(v) => set('fontSize', Number(v))}
              disabled={job.busy}
              options={[
                { value: '9', label: 'Small' },
                { value: '11', label: 'Medium' },
                { value: '14', label: 'Large' },
              ]}
            />
          </div>
          <label htmlFor={ids.skip} className="flex items-center gap-2 text-sm">
            <input
              id={ids.skip}
              type="checkbox"
              className="h-4 w-4 accent-brand-600"
              checked={options.skipFirst}
              onChange={(e) => set('skipFirst', e.target.checked)}
              disabled={job.busy || pdf.pageCount < 2}
            />
            Skip the first page (cover)
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {options.skipFirst
              ? `Page 1 stays blank; pages 2–${pdf.pageCount} are numbered ${options.startAt}–${total}.`
              : `Pages are numbered ${options.startAt}–${total}.`}
          </p>
          <JobStatus state={job.state} onDismiss={job.reset} />
          <button type="button" className="btn-primary" onClick={run} disabled={job.busy}>
            Add page numbers
          </button>
        </div>
      )}
    </ToolPage>
  );
}
