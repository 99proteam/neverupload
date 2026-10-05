import { useState } from 'react';
import { DropZone } from '../../components/DropZone';
import { JobStatus } from '../../components/JobStatus';
import { PdfFileHeader } from '../../components/PdfFileHeader';
import { ProgressBar } from '../../components/ProgressBar';
import { QualitySlider } from '../../components/QualitySlider';
import { DownloadButton, ResultPanel, SizeComparison } from '../../components/ResultPanel';
import { Segmented } from '../../components/Segmented';
import { ToolPage } from '../../components/ToolPage';
import { useJob } from '../../hooks/useJob';
import { usePdfFile } from '../../hooks/usePdfFile';
import { bytesToBlob } from '../../lib/download';
import { readFileBytes } from '../../lib/files';
import { baseName } from '../../lib/format';
import { meta } from './meta';
import { compressPdf, DPI_CHOICES, summarizeCompression, type CompressionSummary } from './process';

interface Result extends CompressionSummary {
  blob: Blob;
}

const DPI_LABELS: Record<number, string> = {
  72: '72 DPI (smallest)',
  100: '100 DPI',
  150: '150 DPI',
  200: '200 DPI (sharpest)',
};

export default function CompressPdfTool() {
  const job = useJob<Result>();
  const { pdf, loading, load, clear } = usePdfFile(job.fail);
  const [quality, setQuality] = useState(60);
  const [dpi, setDpi] = useState('100');

  const compress = () => {
    if (!pdf) return;
    job.run('Compressing pages…', async (onProgress) => {
      const { openPdf, closePdf, createPageRenderer } = await import('../../lib/pdfRender');
      const doc = await openPdf(await readFileBytes(pdf.file));
      try {
        const bytes = await compressPdf(
          doc.numPages,
          createPageRenderer(doc),
          { quality: quality / 100, dpi: Number(dpi) },
          onProgress,
        );
        const summary = summarizeCompression(pdf.file.size, bytes.byteLength);
        return {
          ...summary,
          blob: summary.keptOriginal ? pdf.file : bytesToBlob(bytes, 'application/pdf'),
        };
      } finally {
        await closePdf(doc);
      }
    });
  };

  const reset = () => {
    clear();
    job.reset();
  };

  return (
    <ToolPage meta={meta}>
      {job.state.status === 'done' && pdf ? (
        <ResultPanel
          title={
            job.state.result.keptOriginal
              ? 'This PDF is already well optimized'
              : 'Your compressed PDF is ready'
          }
          onReset={reset}
          actions={
            <DownloadButton
              blob={job.state.result.blob}
              fileName={
                job.state.result.keptOriginal
                  ? pdf.file.name
                  : `${baseName(pdf.file.name)}_compressed.pdf`
              }
              label={
                job.state.result.keptOriginal ? 'Download original' : 'Download compressed PDF'
              }
            />
          }
        >
          <SizeComparison before={job.state.result.before} after={job.state.result.after} />
          {job.state.result.keptOriginal && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Compressing would have made the file bigger, so you get your original back. Try a
              lower quality or resolution.
            </p>
          )}
          <button type="button" className="btn-secondary" onClick={() => job.reset()}>
            Try other settings
          </button>
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
          <QualitySlider
            value={quality}
            onChange={setQuality}
            label="JPEG quality"
            disabled={job.busy}
          />
          <Segmented
            label="Resolution"
            value={dpi}
            onChange={setDpi}
            disabled={job.busy}
            options={DPI_CHOICES.map((d) => ({
              value: String(d),
              label: DPI_LABELS[d] ?? `${d} DPI`,
            }))}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pages become images, so text will no longer be selectable. Best for scans and photos.
          </p>
          <JobStatus state={job.state} onDismiss={job.reset} />
          <button type="button" className="btn-primary" onClick={compress} disabled={job.busy}>
            Compress PDF
          </button>
        </div>
      )}
    </ToolPage>
  );
}
