import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import type { PageRenderer } from '../src/lib/pageRenderer';

export function fixture(name: string): Uint8Array {
  return new Uint8Array(readFileSync(new URL(`./fixtures/${name}`, import.meta.url)));
}

export async function pdfInfo(bytes: Uint8Array) {
  const doc = await PDFDocument.load(bytes);
  return {
    pageCount: doc.getPageCount(),
    sizes: doc.getPages().map((p) => {
      const { width, height } = p.getSize();
      return [Math.round(width), Math.round(height)];
    }),
    rotations: doc.getPages().map((p) => p.getRotation().angle),
  };
}

/** A stand-in for pdf.js rendering: every page "renders" to the sample JPEG. */
export function fakeRenderer(pageSizes: [number, number][], calls: unknown[] = []): PageRenderer {
  const jpeg = fixture('sample.jpg');
  const png = fixture('sample.png');
  return async (req) => {
    calls.push(req);
    const [pageWidth, pageHeight] = pageSizes[req.pageIndex] ?? [100, 100];
    return {
      data: req.mime === 'image/png' ? png : jpeg,
      width: Math.round((pageWidth * req.dpi) / 72),
      height: Math.round((pageHeight * req.dpi) / 72),
      pageWidth,
      pageHeight,
    };
  };
}

import type { ImageFileInput, ImageTransformer, TransformOptions } from '../src/lib/imageTransform';
import { computeResizeDimensions } from '../src/tools/resize-image/process';

/** Fake image input of a given size and type, pretending to be `width`×`height` px. */
export function imageInput(name: string, type: string, size: number): ImageFileInput {
  return { name, type, size, blob: new Blob([new Uint8Array(size)], { type }) };
}

/**
 * Fake transformer: pretends every image is 400×300 px and that the encoded size is
 * `outputSize(options)` bytes. Records every call.
 */
export function fakeTransformer(
  outputSize: (options: TransformOptions) => number,
  calls: TransformOptions[] = [],
): ImageTransformer {
  return async (_blob, options) => {
    calls.push(options);
    const { width, height } = computeResizeDimensions(400, 300, options.resize);
    return {
      blob: new Blob([new Uint8Array(outputSize(options))], { type: options.mime }),
      width,
      height,
    };
  };
}
