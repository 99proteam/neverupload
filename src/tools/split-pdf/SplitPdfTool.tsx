import { useId, useMemo, useState } from 'react';
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
import { baseName, formatBytes } from '../../lib/format';
import { toUserMessage } from '../../lib/errors';
import { zipFiles } from '../../lib/zip';
import { runPdfJob } from '../../workers';
import type { ToolProps } from '../types';
import { meta } from './meta';
import { everyPageGroups, parsePageRanges, splitFileName } from './process';

type Mode = 'ranges' | 'every';

interface SplitResult {
  blob: Blob;
  fileName: string;
  count: number;
}

export default function SplitPdfTool({ page = meta }: ToolProps) {
  const job = useJob<SplitResult>();
  const { pdf, loading, load, clear } = usePdfFile(job.fail);
  const [mode, setMode] = useState<Mode>('ranges');
  const [ranges, setRanges] = useState('');
  const rangesId = useId();
  const errorId = useId();

  const parsed = useMemo(() => {
    if (!pdf) return { groups: [] as number[][], error: null as string | null };
    if (mode === 'every') return { groups: everyPageGroups(pdf.pageCount), error: null };
    if (!ranges.trim()) return { groups: [], error: null };
    try {
      return { groups: parsePageRanges(ranges, pdf.pageCount), error: null };
    } catch (err) {
      return { groups: [], error: toUserMessage(err) };
    }
  }, [pdf, mode, ranges]);

  const split = () => {
    if (!pdf) return;
    const groups = parsed.groups;
    job.run('Splitting PDF…', async (onProgress) => {
      const file = { name: pdf.file.name, data: await readFileBytes(pdf.file) };
      const outputs = await runPdfJob<Uint8Array[]>('split', { file, groups }, { onProgress });
      const named = outputs.map((data, i) => ({
        name: splitFileName(pdf.file.name, groups[i] ?? []),
        data,
      }));
      if (named.length === 1 && named[0]) {
        return {
          blob: bytesToBlob(named[0].data, 'application/pdf'),
          fileName: named[0].name,
          count: 1,
        };
      }
      const zip = zipFiles(named);
      return {
        blob: bytesToBlob(zip, 'application/zip'),
        fileName: `${baseName(pdf.file.name)}_split.zip`,
        count: named.length,
      };
    });
  };

  const reset = () => {
    clear();
    setRanges('');
    job.reset();
  };

  return (
    <ToolPage meta={page}>
      {job.state.status === 'done' ? (
        <ResultPanel
          title={
            job.state.result.count === 1
              ? 'Your PDF is ready'
              : `${job.state.result.count} PDFs are ready`
          }
          onReset={reset}
          actions={
            <DownloadButton
              blob={job.state.result.blob}
              fileName={job.state.result.fileName}
              label={job.state.result.count === 1 ? 'Download PDF' : 'Download zip'}
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
          <Segmented
            label="How do you want to split it?"
            value={mode}
            onChange={setMode}
            disabled={job.busy}
            options={[
              { value: 'ranges', label: 'Page ranges' },
              { value: 'every', label: 'Every page' },
            ]}
          />
          {mode === 'ranges' ? (
            <div>
              <label htmlFor={rangesId} className="field-label">
                Pages to extract
              </label>
              <input
                id={rangesId}
                className="input"
                placeholder={`e.g. 1-3, 5, 8-${pdf.pageCount}`}
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                aria-invalid={Boolean(parsed.error)}
                aria-describedby={errorId}
                disabled={job.busy}
                inputMode="text"
                autoComplete="off"
              />
              <p
                id={errorId}
                className={`mt-1 text-xs ${parsed.error ? 'text-red-700 dark:text-red-400' : 'text-slate-500'}`}
              >
                {parsed.error ??
                  (parsed.groups.length > 0
                    ? `Creates ${parsed.groups.length} PDF${parsed.groups.length === 1 ? '' : 's'}${parsed.groups.length > 1 ? ' (as a zip)' : ''}.`
                    : 'Separate ranges with commas. Each range becomes its own PDF.')}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Creates {pdf.pageCount} single-page PDFs, downloaded together as a zip.
            </p>
          )}
          <JobStatus state={job.state} onDismiss={job.reset} />
          <button
            type="button"
            className="btn-primary"
            onClick={split}
            disabled={job.busy || parsed.groups.length === 0}
          >
            Split PDF
          </button>
        </div>
      )}
    </ToolPage>
  );
}
