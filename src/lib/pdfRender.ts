import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { UserFacingError } from './errors';
import type { PageRenderer, RenderedPage } from './pageRenderer';

// pdf.js parses documents in its own Web Worker, served from our own origin.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export type { PDFDocumentProxy };

/** Open a PDF with pdf.js. The buffer is copied, so the caller's bytes stay usable. */
export async function openPdf(data: Uint8Array): Promise<PDFDocumentProxy> {
  try {
    return await pdfjs.getDocument({
      data: data.slice(),
      // Never fetch fonts or anything else from the network.
      disableFontFace: false,
      useSystemFonts: true,
      stopAtErrors: false,
    }).promise;
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    if (name === 'PasswordException') {
      throw new UserFacingError(
        'This PDF is password-protected. Remove the password and try again.',
      );
    }
    throw new UserFacingError('This file does not look like a valid PDF.');
  }
}

/** Free a document opened with openPdf (and its pdf.js worker). */
export function closePdf(doc: PDFDocumentProxy): Promise<void> {
  return doc.loadingTask.destroy();
}

async function canvasToBytes(canvas: HTMLCanvasElement, mime: string, quality: number) {
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Rendering failed'))), mime, quality),
  );
  return new Uint8Array(await blob.arrayBuffer());
}

/** A PageRenderer backed by pdf.js and a canvas. */
export function createPageRenderer(doc: PDFDocumentProxy): PageRenderer {
  const canvas = document.createElement('canvas');
  return async ({ pageIndex, dpi, mime, quality }): Promise<RenderedPage> => {
    const page = await doc.getPage(pageIndex + 1);
    try {
      const base = page.getViewport({ scale: 1 });
      // Keep the canvas within limits that every browser can allocate.
      const maxScale = Math.sqrt(40_000_000 / (base.width * base.height));
      const scale = Math.min(dpi / 72, maxScale, 16_000 / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale });
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is not available.');
      // JPEG has no transparency: paint white first so pages don't turn black.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, viewport }).promise;
      const data = await canvasToBytes(canvas, mime, quality);
      return {
        data,
        width: canvas.width,
        height: canvas.height,
        pageWidth: base.width,
        pageHeight: base.height,
      };
    } finally {
      page.cleanup();
    }
  };
}

/** Render a small preview of a page and return an object URL for an <img>. */
export async function renderThumbnail(
  doc: PDFDocumentProxy,
  pageIndex: number,
  maxSize = 220,
): Promise<string> {
  const page = await doc.getPage(pageIndex + 1);
  try {
    const base = page.getViewport({ scale: 1 });
    const scale =
      (maxSize * (window.devicePixelRatio > 1 ? 2 : 1)) / Math.max(base.width, base.height);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport }).promise;
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.8));
    canvas.width = 0;
    if (!blob) throw new Error('Thumbnail failed');
    return URL.createObjectURL(blob);
  } finally {
    page.cleanup();
  }
}
