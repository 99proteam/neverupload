import { describe, expect, it } from 'vitest';
import {
  clampQuality,
  compressPdf,
  summarizeCompression,
} from '../../src/tools/compress-pdf/process';
import type { RenderRequest } from '../../src/lib/pageRenderer';
import { fakeRenderer, pdfInfo } from '../helpers';

describe('compressPdf', () => {
  it('renders every page as JPEG and keeps the original page sizes', async () => {
    const calls: RenderRequest[] = [];
    const sizes: [number, number][] = [
      [595, 842],
      [300, 400],
    ];
    const out = await compressPdf(2, fakeRenderer(sizes, calls), { quality: 0.6, dpi: 100 });
    expect(calls).toEqual([
      { pageIndex: 0, dpi: 100, mime: 'image/jpeg', quality: 0.6 },
      { pageIndex: 1, dpi: 100, mime: 'image/jpeg', quality: 0.6 },
    ]);
    expect((await pdfInfo(out)).sizes).toEqual(sizes);
  });

  it('reports monotonic progress ending at 1', async () => {
    const progress: number[] = [];
    await compressPdf(3, fakeRenderer([]), { quality: 0.5, dpi: 72 }, (p) => progress.push(p));
    expect(progress.at(-1)).toBe(1);
    expect([...progress].sort((a, b) => a - b)).toEqual(progress);
  });

  it('rejects empty documents', async () => {
    await expect(compressPdf(0, fakeRenderer([]), { quality: 0.5, dpi: 72 })).rejects.toThrow();
  });
});

describe('clampQuality', () => {
  it('keeps quality in a useful range', () => {
    expect(clampQuality(0)).toBe(0.1);
    expect(clampQuality(1)).toBe(0.95);
    expect(clampQuality(0.555)).toBe(0.56);
  });
});

describe('summarizeCompression', () => {
  it('reports savings', () => {
    expect(summarizeCompression(1000, 400)).toEqual({
      before: 1000,
      after: 400,
      keptOriginal: false,
    });
  });
  it('keeps the original when the result is not smaller', () => {
    expect(summarizeCompression(1000, 1200)).toEqual({
      before: 1000,
      after: 1000,
      keptOriginal: true,
    });
  });
});
