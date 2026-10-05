import { useState } from 'react';
import { DropZone } from '../../components/DropZone';
import { JobStatus } from '../../components/JobStatus';
import { PdfFileHeader } from '../../components/PdfFileHeader';
import { ProgressBar } from '../../components/ProgressBar';
import { QualitySlider } from '../../components/QualitySlider';
import { DownloadButton, ResultPanel } from '../../components/ResultPanel';
import { Segmented } from '../../components/Segmented';
import { ToolPage } from '../../components/ToolPage';
import { useJob } from '../../hooks/useJob';
import { usePdfFile } from '../../hooks/usePdfFile';
import { bytesToBlob } from '../../lib/download';
import { readFileBytes } from '../../lib/files';
import { baseName, formatBytes } from '../../lib/format';
import { zipFiles } from '../../lib/zip';
import type { ToolProps } from '../types';
import { meta } from './meta';
import { pdfToImages, type PageImageFormat } from './process';

interface Result {
  blob: Blob;
  fileName: string;
  count: number;
}

export default function PdfToImagesTool({ page = meta, preset }: ToolProps) {
  const job = useJob<Result>();
  const { pdf, loading, load, clear } = usePdfFile(job.fail);
  const [format, setFormat] = useState<PageImageFormat>(preset?.format === 'jpg' ? 'jpg' : 'png');
  const [dpi, setDpi] = useState('150');
  const [quality, setQuality] = useState(85);

  const convert = () => {
    if (!pdf) return;
    job.run('Rendering pages…', async (onProgress) => {
      const { openPdf, closePdf, createPageRenderer } = await import('../../lib/pdfRender');
      const doc = await openPdf(await readFileBytes(pdf.file));
      try {
        const files = await pdfToImages(
          pdf.file.name,
          doc.numPages,
          createPageRenderer(doc),
          { format, dpi: Number(dpi), quality: quality / 100 },
          onProgress,
        );
        const mime = format === 'png' ? 'image/png' : 'image/jpeg';
        if (files.length === 1 && files[0]) {
          return { blob: bytesToBlob(files[0].data, mime), fileName: files[0].name, count: 1 };
        }
        return {
          blob: bytesToBlob(zipFiles(files), 'application/zip'),
          fileName: `${baseName(pdf.file.name)}-images.zip`,
          count: files.length,
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
    <ToolPage meta={page}>
      {job.state.status === 'done' ? (
        <ResultPanel
          title={`${job.state.result.count} image${job.state.result.count === 1 ? ' is' : 's are'} ready`}
          onReset={reset}
          actions={
            <DownloadButton
              blob={job.state.result.blob}
              fileName={job.state.result.fileName}
              label={job.state.result.count === 1 ? 'Download image' : 'Download zip'}
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
            <Segmented
              label="Image format"
              value={format}
              onChange={setFormat}
              disabled={job.busy}
              options={[
                { value: 'png', label: 'PNG' },
                { value: 'jpg', label: 'JPG' },
              ]}
            />
            <Segmented
              label="Resolution"
              value={dpi}
              onChange={setDpi}
              disabled={job.busy}
              options={[
                { value: '72', label: '72 DPI' },
                { value: '150', label: '150 DPI' },
                { value: '300', label: '300 DPI' },
              ]}
            />
          </div>
          {format === 'jpg' && (
            <QualitySlider value={quality} onChange={setQuality} disabled={job.busy} />
          )}
          <JobStatus state={job.state} onDismiss={job.reset} />
          <button type="button" className="btn-primary" onClick={convert} disabled={job.busy}>
            Convert {pdf.pageCount} page{pdf.pageCount === 1 ? '' : 's'}
          </button>
        </div>
      )}
    </ToolPage>
  );
}
