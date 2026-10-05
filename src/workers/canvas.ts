import type { OutputMime } from '../lib/imageFormat';
import {
  assertCanvasSize,
  type TransformOptions,
  type TransformResult,
} from '../lib/imageTransform';
import { computeResizeDimensions } from '../tools/resize-image/process';

/**
 * Decode, resize and re-encode an image with OffscreenCanvas (inside a worker) or
 * a regular canvas (fallback on the main thread for older browsers).
 */
export async function transformWithCanvas(
  blob: Blob,
  options: TransformOptions,
): Promise<TransformResult> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('This image could not be decoded. It may be damaged or an unsupported format.');
  }
  try {
    const { width, height } = computeResizeDimensions(bitmap.width, bitmap.height, options.resize);
    assertCanvasSize(width, height);
    const out = await drawAndEncode(
      bitmap,
      width,
      height,
      options.mime,
      options.quality,
      options.background,
    );
    return { blob: out, width, height };
  } finally {
    bitmap.close();
  }
}

async function drawAndEncode(
  source: CanvasImageSource,
  width: number,
  height: number,
  mime: OutputMime,
  quality: number,
  background: string,
): Promise<Blob> {
  const useOffscreen = typeof OffscreenCanvas !== 'undefined';
  const canvas = useOffscreen ? new OffscreenCanvas(width, height) : makeDomCanvas(width, height);
  const ctx = canvas.getContext('2d') as
    OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
  if (!ctx) throw new Error('Your browser could not create a drawing surface for this image.');
  if (mime === 'image/jpeg') {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);

  const blob = useOffscreen
    ? await (canvas as OffscreenCanvas).convertToBlob({ type: mime, quality })
    : await domToBlob(canvas as HTMLCanvasElement, mime, quality);
  if (blob.type !== mime) {
    throw new Error(
      `Your browser can't create ${mime.replace('image/', '').toUpperCase()} files. Try another format or browser.`,
    );
  }
  // Release the canvas memory early (helps a lot with large batches).
  canvas.width = 0;
  canvas.height = 0;
  return blob;
}

function makeDomCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function domToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Encoding the image failed.'))),
      mime,
      quality,
    ),
  );
}

/** Re-encode any decodable image as PNG (lossless) or JPEG, honouring EXIF rotation. */
export async function normalizeToPdfImage(
  data: Uint8Array,
  preferJpeg: boolean,
): Promise<{ data: Uint8Array; format: 'jpeg' | 'png' }> {
  const mime = preferJpeg ? 'image/jpeg' : 'image/png';
  const { blob } = await transformWithCanvas(new Blob([data as Uint8Array<ArrayBuffer>]), {
    mime,
    quality: 0.92,
    resize: { mode: 'none' },
    background: '#ffffff',
  });
  return { data: new Uint8Array(await blob.arrayBuffer()), format: preferJpeg ? 'jpeg' : 'png' };
}
