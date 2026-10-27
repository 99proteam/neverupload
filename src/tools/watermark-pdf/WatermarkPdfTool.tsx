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
  DEFAULT_WATERMARK_OPTIONS,
  watermarkFileName,
  type WatermarkColor,
  type WatermarkLayout,
  type WatermarkOptions,
} from './process';

interface WatermarkResult {
  blob: Blob;
  fileName: string;
}

const SWATCH: Record<WatermarkColor, string> = {
  gray: '#737373',
  red: '#cc1a1a',
  blue: '#1a4dcc',
};

export default function WatermarkPdfTool({ page = meta }: ToolProps) {
  const job = useJob<WatermarkResult>();
  const { pdf, loading, load, clear } = usePdfFile(job.fail);
  const [options, setOptions] = useState<WatermarkOptions>(DEFAULT_WATERMARK_OPTIONS);
  const ids = { text: useId(), opacity: useId() };

  const set = <K extends keyof WatermarkOptions>(key: K, value: WatermarkOptions[K]) =>
    setOptions((o) => ({ ...o, [key]: value }));

  const run = () => {
    if (!pdf) return;
    job.run('Adding watermark…', async (onProgress) => {
      const file = { name: pdf.file.name, data: await readFileBytes(pdf.file) };
      const data = await runPdfJob<Uint8Array>('watermark', { file, options }, { onProgress });
      return {
        blob: bytesToBlob(data, 'application/pdf'),
        fileName: watermarkFileName(pdf.file.name),
      };
    });
  };

  const reset = () => {
    clear();
    job.reset();
  };

  const preview = options.text.trim() || 'Watermark';

  return (
    <ToolPage meta={page}>
      {job.state.status === 'done' ? (
        <ResultPanel
          title="Your watermarked PDF is ready"
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
          <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
            <div className="space-y-5">
              <div>
                <label htmlFor={ids.text} className="field-label">
                  Watermark text
                </label>
                <input
                  id={ids.text}
                  className="input"
                  value={options.text}
                  maxLength={80}
                  placeholder="e.g. CONFIDENTIAL"
                  onChange={(e) => set('text', e.target.value)}
                  disabled={job.busy}
                  autoComplete="off"
                />
              </div>
              <Segmented<WatermarkLayout>
                label="Layout"
                value={options.layout}
                onChange={(v) => set('layout', v)}
                disabled={job.busy}
                options={[
                  { value: 'diagonal', label: 'Diagonal' },
                  { value: 'horizontal', label: 'Horizontal' },
                  { value: 'tiled', label: 'Tiled' },
                ]}
              />
              <Segmented<WatermarkColor>
                label="Color"
                value={options.color}
                onChange={(v) => set('color', v)}
                disabled={job.busy}
                options={[
                  { value: 'gray', label: 'Gray' },
                  { value: 'red', label: 'Red' },
                  { value: 'blue', label: 'Blue' },
                ]}
              />
              <div>
                <label htmlFor={ids.opacity} className="field-label flex justify-between">
                  <span>Opacity</span>
                  <span className="tabular-nums">{Math.round(options.opacity * 100)}%</span>
                </label>
                <input
                  id={ids.opacity}
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={Math.round(options.opacity * 100)}
                  onChange={(e) => set('opacity', Number(e.target.value) / 100)}
                  disabled={job.busy}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Subtle</span>
                  <span>Solid</span>
                </div>
              </div>
            </div>
            {/* A rough preview of one page; the real watermark is sized to each page. */}
            <div
              aria-hidden="true"
              className="relative mx-auto h-56 w-40 overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm dark:border-slate-700"
            >
              <div className="space-y-2 p-4">
                {Array.from({ length: 9 }, (_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded bg-slate-200"
                    style={{ width: `${60 + ((i * 37) % 40)}%` }}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex flex-wrap content-center items-center justify-center gap-x-6 gap-y-8">
                {Array.from({ length: options.layout === 'tiled' ? 6 : 1 }, (_, i) => (
                  <span
                    key={i}
                    className="font-bold whitespace-nowrap"
                    style={{
                      color: SWATCH[options.color],
                      opacity: options.opacity,
                      fontSize:
                        options.layout === 'tiled'
                          ? 11
                          : Math.max(10, Math.min(24, 180 / preview.length)),
                      transform: options.layout === 'horizontal' ? undefined : 'rotate(-45deg)',
                    }}
                  >
                    {preview}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <JobStatus state={job.state} onDismiss={job.reset} />
          <button
            type="button"
            className="btn-primary"
            onClick={run}
            disabled={job.busy || !options.text.trim()}
          >
            Add watermark
          </button>
        </div>
      )}
    </ToolPage>
  );
}
