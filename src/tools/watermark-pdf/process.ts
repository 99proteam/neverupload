import { rgb, StandardFonts, type PDFFont, type RGB } from 'pdf-lib';
import { UserFacingError } from '../../lib/errors';
import { baseName } from '../../lib/format';
import { centeredTextOrigin, pageFrame, textRotation } from '../../lib/pageGeometry';
import { loadPdfDocument, SAVE_OPTIONS } from '../../lib/pdf';
import type { ProgressFn } from '../../workers/protocol';

export type WatermarkLayout = 'diagonal' | 'horizontal' | 'tiled';
export type WatermarkColor = 'gray' | 'red' | 'blue';

export interface WatermarkOptions {
  text: string;
  layout: WatermarkLayout;
  color: WatermarkColor;
  /** 0.05 – 1. */
  opacity: number;
  /** Font size in points; 0 picks a size that fits the page. */
  fontSize: number;
}

export const DEFAULT_WATERMARK_OPTIONS: WatermarkOptions = {
  text: 'CONFIDENTIAL',
  layout: 'diagonal',
  color: 'gray',
  opacity: 0.2,
  fontSize: 0,
};

const COLORS: Record<WatermarkColor, RGB> = {
  gray: rgb(0.45, 0.45, 0.45),
  red: rgb(0.8, 0.1, 0.1),
  blue: rgb(0.1, 0.3, 0.8),
};

export function watermarkFileName(sourceName: string): string {
  return `${baseName(sourceName)}_watermarked.pdf`;
}

/**
 * Font size that makes the text span about 70% of the page diagonal (or width, for
 * horizontal text), within sensible limits.
 */
export function autoFontSize(
  font: Pick<PDFFont, 'widthOfTextAtSize'>,
  text: string,
  pageWidth: number,
  pageHeight: number,
  layout: WatermarkLayout,
): number {
  const span =
    layout === 'horizontal'
      ? pageWidth
      : layout === 'tiled'
        ? pageWidth / 2.5
        : Math.hypot(pageWidth, pageHeight);
  const widthAt1 = font.widthOfTextAtSize(text, 1) || 1;
  return Math.min(160, Math.max(12, (span * 0.7) / widthAt1));
}

/** Stamp a text watermark on every page. */
export async function watermarkPdf(
  data: Uint8Array,
  options: WatermarkOptions,
  onProgress?: ProgressFn,
  name?: string,
): Promise<Uint8Array> {
  const text = options.text.replace(/\s+/g, ' ').trim();
  if (!text) throw new UserFacingError('Enter the watermark text.');
  if (text.length > 80) throw new UserFacingError('Keep the watermark under 80 characters.');
  const opacity = Math.min(1, Math.max(0.05, Number(options.opacity) || 0.2));

  const doc = await loadPdfDocument(data, name);
  const pages = doc.getPages();
  if (pages.length === 0) throw new UserFacingError('This PDF has no pages.');
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  try {
    font.encodeText(text);
  } catch {
    // The built-in PDF fonts only cover Latin characters (WinAnsi).
    throw new UserFacingError(
      'The watermark can only use Latin letters, numbers and common symbols. Remove emoji or other scripts and try again.',
    );
  }

  const angle = options.layout === 'diagonal' || options.layout === 'tiled' ? 45 : 0;
  pages.forEach((page, i) => {
    const frame = pageFrame(page);
    const size =
      options.fontSize > 0
        ? Math.min(200, Math.max(6, options.fontSize))
        : autoFontSize(font, text, frame.width, frame.height, options.layout);
    const width = font.widthOfTextAtSize(text, size);
    const height = font.heightAtSize(size, { descender: false });

    const centers: [number, number][] = [];
    if (options.layout === 'tiled') {
      // A grid that overflows the page so the rotated rows cover the corners too.
      // Minimum steps keep tiny fonts from producing thousands of stamps per page.
      const stepX = Math.max(width * 1.3, 72);
      const stepY = Math.max(height * 4, 72);
      for (let cy = -frame.height * 0.25; cy < frame.height * 1.25; cy += stepY) {
        for (let cx = -frame.width * 0.25; cx < frame.width * 1.25; cx += stepX) {
          centers.push([cx, cy]);
        }
      }
    } else {
      centers.push([frame.width / 2, frame.height / 2]);
    }

    for (const [cx, cy] of centers) {
      const origin = centeredTextOrigin(cx, cy, width, height, angle);
      const { x, y } = frame.toPage(origin.x, origin.y);
      page.drawText(text, {
        x,
        y,
        size,
        font,
        color: COLORS[options.color] ?? COLORS.gray,
        opacity,
        rotate: textRotation(frame, angle),
      });
    }
    onProgress?.((i + 1) / pages.length);
  });
  return doc.save(SAVE_OPTIONS);
}
