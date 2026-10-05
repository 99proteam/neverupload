import { UserFacingError } from '../../lib/errors';
import { baseName } from '../../lib/format';
import type { NamedFile } from '../../lib/zip';
import type { PageRenderer } from '../../lib/pageRenderer';
import type { ProgressFn } from '../../workers/protocol';

export type PageImageFormat = 'png' | 'jpg';

export interface PdfToImagesOptions {
  format: PageImageFormat;
  dpi: number;
  /** 0..1, JPEG only. */
  quality: number;
  /** Zero-based page indices to export; all pages when omitted. */
  pages?: number[];
}

/** "report.pdf", page 3 of 120 → "report-page-003.png" (zero-padded so files sort). */
export function pageImageName(
  sourceName: string,
  pageIndex: number,
  pageCount: number,
  format: PageImageFormat,
): string {
  const width = String(pageCount).length;
  return `${baseName(sourceName)}-page-${String(pageIndex + 1).padStart(width, '0')}.${format}`;
}

/** Render pages of a PDF to image files. */
export async function pdfToImages(
  sourceName: string,
  pageCount: number,
  render: PageRenderer,
  options: PdfToImagesOptions,
  onProgress?: ProgressFn,
): Promise<NamedFile[]> {
  const pages = options.pages ?? Array.from({ length: pageCount }, (_, i) => i);
  if (pages.length === 0) throw new UserFacingError('Choose at least one page.');
  const files: NamedFile[] = [];
  for (const [n, pageIndex] of pages.entries()) {
    if (pageIndex < 0 || pageIndex >= pageCount) throw new UserFacingError('Page out of range.');
    const page = await render({
      pageIndex,
      dpi: options.dpi,
      mime: options.format === 'png' ? 'image/png' : 'image/jpeg',
      quality: options.quality,
    });
    files.push({
      name: pageImageName(sourceName, pageIndex, pageCount, options.format),
      data: page.data,
    });
    onProgress?.((n + 1) / pages.length);
  }
  return files;
}
