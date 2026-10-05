import { ArrowLeft, ArrowRight, RotateCcw, RotateCw, Trash2, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DropZone } from '../../components/DropZone';
import { JobStatus } from '../../components/JobStatus';
import { PdfFileHeader } from '../../components/PdfFileHeader';
import { ProgressBar } from '../../components/ProgressBar';
import { DownloadButton, ResultPanel } from '../../components/ResultPanel';
import { ToolPage } from '../../components/ToolPage';
import { useDragReorder } from '../../hooks/useDragReorder';
import { useJob } from '../../hooks/useJob';
import { moveItem } from '../../lib/array';
import { bytesToBlob } from '../../lib/download';
import { toUserMessage } from '../../lib/errors';
import { readFileBytes } from '../../lib/files';
import { baseName, formatBytes } from '../../lib/format';
import type { PDFDocumentProxy } from '../../lib/pdfRender';
import { runPdfJob } from '../../workers';
import { meta } from './meta';
import { identityLayout, normalizeRotation, type PageInstruction } from './process';

interface Loaded {
  file: File;
  doc: PDFDocumentProxy;
}

export default function OrganizePdfTool() {
  const job = useJob<Blob>();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [opening, setOpening] = useState(false);
  const [layout, setLayout] = useState<PageInstruction[]>([]);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});

  const open = async (file: File) => {
    job.reset();
    setOpening(true);
    try {
      const { openPdf } = await import('../../lib/pdfRender');
      const doc = await openPdf(await readFileBytes(file));
      setLayout(identityLayout(doc.numPages));
      setThumbs({});
      setLoaded({ file, doc });
    } catch (err) {
      job.fail(err);
    } finally {
      setOpening(false);
    }
  };

  // Render thumbnails one by one in the background; free them when done.
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    const urls: string[] = [];
    (async () => {
      const { renderThumbnail } = await import('../../lib/pdfRender');
      for (let i = 0; i < loaded.doc.numPages && !cancelled; i++) {
        try {
          const url = await renderThumbnail(loaded.doc, i, 160);
          urls.push(url);
          if (!cancelled) setThumbs((t) => ({ ...t, [i]: url }));
        } catch (err) {
          console.warn('Thumbnail failed', toUserMessage(err));
        }
      }
    })();
    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
      void loaded.doc.loadingTask.destroy();
    };
  }, [loaded]);

  const update = (index: number, change: (p: PageInstruction) => PageInstruction) =>
    setLayout((l) => l.map((p, i) => (i === index ? change(p) : p)));
  const rotateAll = (delta: number) =>
    setLayout((l) => l.map((p) => ({ ...p, rotate: normalizeRotation(p.rotate + delta) })));
  const move = (from: number, to: number) => setLayout((l) => moveItem(l, from, to));
  const { itemProps, dragIndex, overIndex } = useDragReorder(move);

  const save = () => {
    if (!loaded) return;
    job.run('Saving PDF…', async (onProgress) => {
      const file = { name: loaded.file.name, data: await readFileBytes(loaded.file) };
      const bytes = await runPdfJob<Uint8Array>('organize', { file, layout }, { onProgress });
      return bytesToBlob(bytes, 'application/pdf');
    });
  };

  const reset = () => {
    setLoaded(null);
    setLayout([]);
    job.reset();
  };

  const pageCount = loaded?.doc.numPages ?? 0;
  const changed =
    layout.length !== pageCount || layout.some((p, i) => p.source !== i || p.rotate !== 0);

  return (
    <ToolPage meta={meta}>
      {job.state.status === 'done' && loaded ? (
        <ResultPanel
          title="Your PDF is ready"
          onReset={reset}
          actions={
            <DownloadButton
              blob={job.state.result}
              fileName={`${baseName(loaded.file.name)}_organized.pdf`}
              label="Download PDF"
            />
          }
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {layout.length} pages · {formatBytes(job.state.result.size)}
          </p>
          <button type="button" className="btn-secondary" onClick={() => job.reset()}>
            Keep editing
          </button>
        </ResultPanel>
      ) : !loaded ? (
        <div className="space-y-4">
          <DropZone
            accept="application/pdf,.pdf"
            label="a PDF file"
            onFiles={(files) => {
              if (files[0]) void open(files[0]);
            }}
            onError={job.fail}
            disabled={opening}
          />
          {opening && <ProgressBar value={null} label="Opening PDF…" />}
          <JobStatus state={job.state} onDismiss={job.reset} />
        </div>
      ) : (
        <div className="space-y-5">
          <PdfFileHeader
            file={loaded.file}
            pageCount={pageCount}
            onChange={reset}
            disabled={job.busy}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => rotateAll(-90)}
              disabled={job.busy}
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" /> Rotate all left
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => rotateAll(90)}
              disabled={job.busy}
            >
              <RotateCw aria-hidden="true" className="h-4 w-4" /> Rotate all right
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setLayout(identityLayout(pageCount))}
              disabled={job.busy || !changed}
            >
              <Undo2 aria-hidden="true" className="h-4 w-4" /> Reset
            </button>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Drag pages to reorder them, or use the buttons under each page.
          </p>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {layout.map((page, index) => (
              <li
                key={page.source}
                {...(job.busy ? {} : itemProps(index))}
                className={`flex flex-col items-center gap-2 rounded-lg border bg-slate-50 p-2 dark:bg-slate-950 ${
                  overIndex === index && dragIndex !== index
                    ? 'border-brand-500'
                    : 'border-slate-200 dark:border-slate-800'
                } ${dragIndex === index ? 'opacity-50' : ''}`}
              >
                <div className="flex aspect-square w-full cursor-grab items-center justify-center overflow-hidden">
                  {thumbs[page.source] ? (
                    <img
                      src={thumbs[page.source]}
                      alt={`Page ${page.source + 1}`}
                      draggable={false}
                      className="max-h-full max-w-full shadow transition-transform"
                      style={{ transform: `rotate(${page.rotate}deg)` }}
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Loading…</span>
                  )}
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {index + 1}
                  {page.source !== index && ` (was ${page.source + 1})`}
                </span>
                <div className="flex flex-wrap justify-center">
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label={`Move page ${page.source + 1} earlier`}
                    onClick={() => move(index, index - 1)}
                    disabled={job.busy || index === 0}
                  >
                    <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label={`Rotate page ${page.source + 1} left`}
                    onClick={() =>
                      update(index, (p) => ({ ...p, rotate: normalizeRotation(p.rotate - 90) }))
                    }
                    disabled={job.busy}
                  >
                    <RotateCcw aria-hidden="true" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label={`Rotate page ${page.source + 1} right`}
                    onClick={() =>
                      update(index, (p) => ({ ...p, rotate: normalizeRotation(p.rotate + 90) }))
                    }
                    disabled={job.busy}
                  >
                    <RotateCw aria-hidden="true" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label={`Delete page ${page.source + 1}`}
                    onClick={() => setLayout((l) => l.filter((_, i) => i !== index))}
                    disabled={job.busy || layout.length === 1}
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label={`Move page ${page.source + 1} later`}
                    onClick={() => move(index, index + 1)}
                    disabled={job.busy || index === layout.length - 1}
                  >
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <JobStatus state={job.state} onDismiss={job.reset} />
          <button
            type="button"
            className="btn-primary"
            onClick={save}
            disabled={job.busy || layout.length === 0}
          >
            Save PDF
          </button>
        </div>
      )}
    </ToolPage>
  );
}
