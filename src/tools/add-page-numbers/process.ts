import { rgb, StandardFonts, type PDFFont } from 'pdf-lib';
import { UserFacingError } from '../../lib/errors';
import { baseName } from '../../lib/format';
import { pageFrame, textRotation } from '../../lib/pageGeometry';
import { loadPdfDocument, SAVE_OPTIONS } from '../../lib/pdf';
import type { ProgressFn } from '../../workers/protocol';

export type NumberPosition =
  'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';

export type NumberFormat = 'n' | 'page-n' | 'n-of-total' | 'page-n-of-total';

export interface PageNumberOptions {
  position: NumberPosition;
  format: NumberFormat;
  /** Number printed on the first numbered page. */
  startAt: number;
  /** Leave the first page (e.g. a cover) without a number. */
  skipFirst: boolean;
  /** Font size in points. */
  fontSize: number;
}

export const DEFAULT_PAGE_NUMBER_OPTIONS: PageNumberOptions = {
  position: 'bottom-center',
  format: 'n',
  startAt: 1,
  skipFirst: false,
  fontSize: 11,
};

/** Distance from the page edge, in points (about 1 cm). */
const MARGIN = 28;

export function formatPageNumber(format: NumberFormat, n: number, total: number): string {
  switch (format) {
    case 'page-n':
      return `Page ${n}`;
    case 'n-of-total':
      return `${n} of ${total}`;
    case 'page-n-of-total':
      return `Page ${n} of ${total}`;
    default:
      return String(n);
  }
}

/** Visual (as displayed) baseline origin for a label of the given width. */
export function labelOrigin(
  position: NumberPosition,
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  fontSize: number,
): { x: number; y: number } {
  const [vertical, horizontal] = position.split('-') as ['top' | 'bottom', string];
  const x =
    horizontal === 'left'
      ? MARGIN
      : horizontal === 'right'
        ? pageWidth - MARGIN - textWidth
        : (pageWidth - textWidth) / 2;
  // Cap height of Helvetica is about 0.72 em, so this keeps the top margin visually equal.
  const y = vertical === 'top' ? pageHeight - MARGIN - fontSize * 0.72 : MARGIN;
  return { x, y };
}

export function pageNumbersFileName(sourceName: string): string {
  return `${baseName(sourceName)}_numbered.pdf`;
}

function clampOptions(o: PageNumberOptions): PageNumberOptions {
  return {
    ...o,
    startAt: Number.isFinite(o.startAt) ? Math.max(0, Math.round(o.startAt)) : 1,
    fontSize: Math.min(36, Math.max(6, Number(o.fontSize) || 11)),
  };
}

/** Print a page number on every page (optionally skipping the first). */
export async function addPageNumbers(
  data: Uint8Array,
  options: PageNumberOptions,
  onProgress?: ProgressFn,
  name?: string,
): Promise<Uint8Array> {
  const opts = clampOptions(options);
  const doc = await loadPdfDocument(data, name);
  const pages = doc.getPages();
  if (pages.length === 0) throw new UserFacingError('This PDF has no pages.');
  const font: PDFFont = await doc.embedFont(StandardFonts.Helvetica);
  const numbered = opts.skipFirst ? pages.length - 1 : pages.length;
  const total = opts.startAt + numbered - 1;

  pages.forEach((page, i) => {
    const index = opts.skipFirst ? i - 1 : i;
    if (index >= 0) {
      const label = formatPageNumber(opts.format, opts.startAt + index, total);
      const frame = pageFrame(page);
      const width = font.widthOfTextAtSize(label, opts.fontSize);
      const visual = labelOrigin(opts.position, frame.width, frame.height, width, opts.fontSize);
      const { x, y } = frame.toPage(visual.x, visual.y);
      page.drawText(label, {
        x,
        y,
        size: opts.fontSize,
        font,
        color: rgb(0.2, 0.2, 0.2),
        rotate: textRotation(frame),
      });
    }
    onProgress?.((i + 1) / pages.length);
  });
  return doc.save(SAVE_OPTIONS);
}
