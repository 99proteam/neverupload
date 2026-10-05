import { describe, expect, it } from 'vitest';
import {
  dataUrlToBytes,
  DEFAULT_QR_OPTIONS,
  generateQrPngDataUrl,
  generateQrSvg,
} from '../../src/tools/qr-code-generator/process';

describe('generateQrSvg', () => {
  it('creates an SVG with the chosen colours', async () => {
    const svg = await generateQrSvg('https://example.com', {
      ...DEFAULT_QR_OPTIONS,
      dark: '#123456',
    });
    expect(svg).toMatch(/^<svg/);
    expect(svg).toContain('#123456');
  });

  it('makes denser codes at higher error correction', async () => {
    const low = await generateQrSvg('hello world', { ...DEFAULT_QR_OPTIONS, errorCorrection: 'L' });
    const high = await generateQrSvg('hello world', {
      ...DEFAULT_QR_OPTIONS,
      errorCorrection: 'H',
    });
    const size = (svg: string) => Number(/viewBox="0 0 (\d+)/.exec(svg)?.[1]);
    expect(size(high)).toBeGreaterThan(size(low));
  });

  it('rejects empty and oversized input', async () => {
    await expect(generateQrSvg('   ', DEFAULT_QR_OPTIONS)).rejects.toThrow(/Enter some text/);
    await expect(generateQrSvg('x'.repeat(5000), DEFAULT_QR_OPTIONS)).rejects.toThrow(/too much/);
  });
});

describe('generateQrPngDataUrl', () => {
  it('creates a PNG of the requested size', async () => {
    const url = await generateQrPngDataUrl('neverupload', { ...DEFAULT_QR_OPTIONS, size: 256 });
    const bytes = dataUrlToBytes(url);
    expect(Array.from(bytes.subarray(1, 4))).toEqual([0x50, 0x4e, 0x47]); // "PNG"
    const view = new DataView(bytes.buffer);
    expect(view.getUint32(16)).toBe(256); // IHDR width
  });
});

describe('dataUrlToBytes', () => {
  it('decodes base64 data URLs', () => {
    expect(Array.from(dataUrlToBytes('data:text/plain;base64,aGk='))).toEqual([104, 105]);
  });
  it('rejects other strings', () => {
    expect(() => dataUrlToBytes('hello')).toThrow();
  });
});
