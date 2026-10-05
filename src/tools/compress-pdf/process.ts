import { UserFacingError } from '../../lib/errors';
import type { PageRenderer } from '../../lib/pageRenderer';
import type { ProgressFn } from '../../workers/protocol';
import { imagesToPdf, type ImageInput } from '../images-to-pdf/process';

export interface CompressPdfOptions {
  /** JPEG quality, 0.1 – 0.95. */
  quality: number;
  /** Render resolution in DPI. Lower = smaller file, blurrier text. */
  dpi: number;
}

export const DPI_CHOICES = [72, 100, 150, 200] as const;

export function clampQuality(quality: number): number {
  return Math.min(0.95, Math.max(0.1, Math.round(quality * 100) / 100));
}

/**
 * Re-render every page as a JPEG and rebuild the PDF from those images.
 * Each page keeps its original size in points.
 */
export async function compressPdf(
  pageCount: number,
  render: PageRenderer,
  options: CompressPdfOptions,
  onProgress?: ProgressFn,
): Promise<Uint8Array> {
  if (pageCount < 1) throw new UserFacingError('This PDF has no pages.');
  const quality = clampQuality(options.quality);
  const pages: ImageInput[] = [];
  for (let i = 0; i < pageCount; i++) {
    const page = await render({ pageIndex: i, dpi: options.dpi, mime: 'image/jpeg', quality });
    pages.push({
      name: `page-${i + 1}.jpg`,
      data: page.data,
      pageWidth: page.pageWidth,
      pageHeight: page.pageHeight,
    });
    onProgress?.(((i + 1) / pageCount) * 0.85);
  }
  return imagesToPdf(pages, { pageSize: 'fit', orientation: 'auto', margin: 0 }, undefined, (p) =>
    onProgress?.(0.85 + p * 0.15),
  );
}

export interface CompressionSummary {
  before: number;
  after: number;
  /** True when the "compressed" file would be bigger and the original is kept. */
  keptOriginal: boolean;
}

/** Never hand back a file that is larger than what the user started with. */
export function summarizeCompression(before: number, after: number): CompressionSummary {
  return after >= before
    ? { before, after: before, keptOriginal: true }
    : { before, after, keptOriginal: false };
}
