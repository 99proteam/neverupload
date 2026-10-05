import { PDFDocument } from 'pdf-lib';
import { UserFacingError } from '../../lib/errors';
import { detectImageFormat, readJpegOrientation } from '../../lib/imageFormat';
import { SAVE_OPTIONS } from '../../lib/pdf';
import type { ProgressFn } from '../../workers/protocol';

export type PageSize = 'a4' | 'letter' | 'fit';
export type Orientation = 'auto' | 'portrait' | 'landscape';

export interface ImagesToPdfOptions {
  pageSize: PageSize;
  orientation: Orientation;
  /** Margin around the image in PDF points (1/72 inch). Ignored for "fit". */
  margin: number;
}

export interface ImageInput {
  name: string;
  data: Uint8Array;
  /**
   * Optional exact page size in points. When set, the image fills the page
   * completely (used by "Compress PDF" to keep original page dimensions).
   */
  pageWidth?: number;
  pageHeight?: number;
}

/** Re-encodes an image PDF can't embed directly (WebP, rotated JPEG...) as PNG or JPEG. */
export type ImageNormalizer = (
  input: ImageInput,
) => Promise<{ data: Uint8Array; format: 'jpeg' | 'png' }>;

export const PAGE_SIZES: Record<Exclude<PageSize, 'fit'>, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

/** CSS pixels → PDF points (96 dpi → 72 dpi). */
const PX_TO_PT = 0.75;

export interface Placement {
  pageWidth: number;
  pageHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Work out the page size and where to draw an image of the given pixel size. */
export function computePlacement(
  imageWidth: number,
  imageHeight: number,
  options: ImagesToPdfOptions,
): Placement {
  if (options.pageSize === 'fit') {
    const width = imageWidth * PX_TO_PT;
    const height = imageHeight * PX_TO_PT;
    return { pageWidth: width, pageHeight: height, x: 0, y: 0, width, height };
  }
  let [pageWidth, pageHeight] = PAGE_SIZES[options.pageSize];
  const landscape =
    options.orientation === 'landscape' ||
    (options.orientation === 'auto' && imageWidth > imageHeight);
  if (landscape) [pageWidth, pageHeight] = [pageHeight, pageWidth];

  const margin = Math.max(0, Math.min(options.margin, Math.min(pageWidth, pageHeight) / 4));
  const boxW = pageWidth - margin * 2;
  const boxH = pageHeight - margin * 2;
  // Scale down to fit the box, but never blow small images up beyond 100%.
  const scale = Math.min(boxW / (imageWidth * PX_TO_PT), boxH / (imageHeight * PX_TO_PT), 1);
  const width = imageWidth * PX_TO_PT * scale;
  const height = imageHeight * PX_TO_PT * scale;
  return {
    pageWidth,
    pageHeight,
    x: (pageWidth - width) / 2,
    y: (pageHeight - height) / 2,
    width,
    height,
  };
}

/** Combine JPG/PNG/WebP images into one PDF, one image per page. */
export async function imagesToPdf(
  images: ImageInput[],
  options: ImagesToPdfOptions,
  normalize?: ImageNormalizer,
  onProgress?: ProgressFn,
): Promise<Uint8Array> {
  if (images.length === 0) throw new UserFacingError('Add at least one image.');
  const doc = await PDFDocument.create();
  doc.setProducer('neverupload');
  doc.setCreator('neverupload');

  for (const [i, image] of images.entries()) {
    let format = detectImageFormat(image.data);
    let data = image.data;
    const needsNormalizing =
      (format !== 'jpeg' && format !== 'png') ||
      (format === 'jpeg' && readJpegOrientation(data) !== 1);
    if (needsNormalizing) {
      if (!normalize || format === null) {
        throw new UserFacingError(
          `"${image.name}" is not a supported image (use JPG, PNG or WebP).`,
        );
      }
      ({ data, format } = await normalize(image));
    }

    let embedded;
    try {
      embedded = format === 'jpeg' ? await doc.embedJpg(data) : await doc.embedPng(data);
    } catch {
      throw new UserFacingError(`"${image.name}" could not be read. It may be damaged.`);
    }

    if (image.pageWidth && image.pageHeight) {
      const page = doc.addPage([image.pageWidth, image.pageHeight]);
      page.drawImage(embedded, { x: 0, y: 0, width: image.pageWidth, height: image.pageHeight });
    } else {
      const p = computePlacement(embedded.width, embedded.height, options);
      const page = doc.addPage([p.pageWidth, p.pageHeight]);
      page.drawImage(embedded, { x: p.x, y: p.y, width: p.width, height: p.height });
    }
    onProgress?.(((i + 1) / images.length) * 0.9);
  }

  const bytes = await doc.save(SAVE_OPTIONS);
  onProgress?.(1);
  return bytes;
}
