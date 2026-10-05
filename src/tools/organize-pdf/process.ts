import { degrees, PDFDocument } from 'pdf-lib';
import { UserFacingError } from '../../lib/errors';
import { loadPdfDocument, SAVE_OPTIONS } from '../../lib/pdf';
import type { ProgressFn } from '../../workers/protocol';

export interface PageInstruction {
  /** Zero-based index of the page in the source document. */
  source: number;
  /** Extra clockwise rotation to apply, in degrees (multiple of 90). */
  rotate: number;
}

/** Bring any angle into 0, 90, 180 or 270. */
export function normalizeRotation(angle: number): number {
  const snapped = Math.round(angle / 90) * 90;
  return ((snapped % 360) + 360) % 360;
}

/** Initial instruction list: every page, in order, unrotated. */
export function identityLayout(pageCount: number): PageInstruction[] {
  return Array.from({ length: pageCount }, (_, i) => ({ source: i, rotate: 0 }));
}

/**
 * Build a new PDF with pages in the given order and rotation. Pages left out of
 * the list are dropped; a page listed twice is duplicated.
 */
export async function organizePdf(
  data: Uint8Array,
  layout: PageInstruction[],
  onProgress?: ProgressFn,
  name?: string,
): Promise<Uint8Array> {
  if (layout.length === 0) throw new UserFacingError('The document must keep at least one page.');
  const src = await loadPdfDocument(data, name);
  const count = src.getPageCount();
  if (layout.some((p) => p.source < 0 || p.source >= count)) {
    throw new UserFacingError('Page out of range.');
  }
  const out = await PDFDocument.create();
  const copied = await out.copyPages(
    src,
    layout.map((p) => p.source),
  );
  copied.forEach((page, i) => {
    const extra = layout[i]?.rotate ?? 0;
    page.setRotation(degrees(normalizeRotation(page.getRotation().angle + extra)));
    out.addPage(page);
    onProgress?.(((i + 1) / copied.length) * 0.9);
  });
  const bytes = await out.save(SAVE_OPTIONS);
  onProgress?.(1);
  return bytes;
}
