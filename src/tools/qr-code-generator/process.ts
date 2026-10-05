import QRCode from 'qrcode';
import { UserFacingError } from '../../lib/errors';

export type ErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface QrOptions {
  /** Width of the PNG in pixels. */
  size: number;
  /** Quiet zone, in modules. */
  margin: number;
  errorCorrection: ErrorCorrection;
  dark: string;
  light: string;
}

export const DEFAULT_QR_OPTIONS: QrOptions = {
  size: 512,
  margin: 2,
  errorCorrection: 'M',
  dark: '#000000',
  light: '#ffffff',
};

/** Rough upper bound for byte-mode content at the lowest error correction level. */
export const MAX_QR_LENGTH = 2953;

function validate(text: string): void {
  if (!text.trim()) throw new UserFacingError('Enter some text or a URL.');
  if (new TextEncoder().encode(text).length > MAX_QR_LENGTH) {
    throw new UserFacingError('That is too much text for one QR code. Try something shorter.');
  }
}

function qrOptions(o: QrOptions) {
  return {
    errorCorrectionLevel: o.errorCorrection,
    margin: Math.max(0, Math.round(o.margin)),
    width: Math.max(64, Math.min(4096, Math.round(o.size))),
    color: { dark: normalizeColor(o.dark), light: normalizeColor(o.light) },
  };
}

/** qrcode expects #RRGGBBAA. */
function normalizeColor(c: string): string {
  return /^#[0-9a-f]{6}$/i.test(c) ? `${c}ff` : c;
}

export async function generateQrSvg(text: string, options: QrOptions): Promise<string> {
  validate(text);
  try {
    return await QRCode.toString(text, { ...qrOptions(options), type: 'svg' });
  } catch (err) {
    throw new UserFacingError(err instanceof Error ? err.message : 'Could not create QR code.');
  }
}

export async function generateQrPngDataUrl(text: string, options: QrOptions): Promise<string> {
  validate(text);
  try {
    return await QRCode.toDataURL(text, { ...qrOptions(options), type: 'image/png' });
  } catch (err) {
    throw new UserFacingError(err instanceof Error ? err.message : 'Could not create QR code.');
  }
}

/** Decode a data: URL into bytes (for downloading the PNG). */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || comma < 0) throw new Error('Not a data URL');
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
