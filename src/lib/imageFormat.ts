export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp';

/** Identify an image by its magic bytes (more reliable than the file extension). */
export function detectImageFormat(bytes: Uint8Array): ImageFormat | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  )
    return 'png';
  if (b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return 'webp';
  if (b.length >= 6 && ascii(b, 0, 3) === 'GIF') return 'gif';
  if (b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d) return 'bmp';
  return null;
}

function ascii(b: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...b.subarray(start, start + length));
}

/**
 * Read the EXIF orientation (1-8) of a JPEG. Returns 1 when there is none.
 * Phones store photos sideways and rely on this tag to display them upright.
 */
export function readJpegOrientation(bytes: Uint8Array): number {
  if (detectImageFormat(bytes) !== 'jpeg') return 1;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return 1;
    const marker = view.getUint8(offset + 1);
    const size = view.getUint16(offset + 2);
    if (marker === 0xda || marker === 0xd9) return 1; // start of scan / end of image
    if (
      marker === 0xe1 &&
      offset + 10 <= view.byteLength &&
      view.getUint32(offset + 4) === 0x45786966
    ) {
      return readTiffOrientation(view, offset + 10);
    }
    offset += 2 + size;
  }
  return 1;
}

function readTiffOrientation(view: DataView, tiff: number): number {
  if (tiff + 8 > view.byteLength) return 1;
  const little = view.getUint16(tiff) === 0x4949;
  const ifd = tiff + view.getUint32(tiff + 4, little);
  if (ifd + 2 > view.byteLength) return 1;
  const entries = view.getUint16(ifd, little);
  for (let i = 0; i < entries; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > view.byteLength) return 1;
    if (view.getUint16(entry, little) === 0x0112) {
      const value = view.getUint16(entry + 8, little);
      return value >= 1 && value <= 8 ? value : 1;
    }
  }
  return 1;
}

export const OUTPUT_FORMATS = {
  'image/jpeg': { ext: 'jpg', label: 'JPG' },
  'image/png': { ext: 'png', label: 'PNG' },
  'image/webp': { ext: 'webp', label: 'WebP' },
} as const;

export type OutputMime = keyof typeof OUTPUT_FORMATS;

export function isOutputMime(value: string): value is OutputMime {
  return value in OUTPUT_FORMATS;
}

/** Map an input image MIME type to a format we can write, falling back to PNG. */
export function outputMimeFor(inputType: string): OutputMime {
  if (inputType === 'image/jpg') return 'image/jpeg';
  return isOutputMime(inputType) ? inputType : 'image/png';
}
