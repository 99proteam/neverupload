import { describe, expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import { pageImageName, pdfToImages } from '../../src/tools/pdf-to-images/process';
import type { RenderRequest } from '../../src/lib/pageRenderer';
import { zipFiles } from '../../src/lib/zip';
import { fakeRenderer } from '../helpers';

describe('pageImageName', () => {
  it('zero-pads page numbers so files sort correctly', () => {
    expect(pageImageName('report.pdf', 2, 120, 'png')).toBe('report-page-003.png');
    expect(pageImageName('report.pdf', 0, 9, 'jpg')).toBe('report-page-1.jpg');
  });
});

describe('pdfToImages', () => {
  it('renders every page with the chosen settings', async () => {
    const calls: RenderRequest[] = [];
    const files = await pdfToImages('doc.pdf', 3, fakeRenderer([], calls), {
      format: 'png',
      dpi: 150,
      quality: 0.8,
    });
    expect(files.map((f) => f.name)).toEqual([
      'doc-page-1.png',
      'doc-page-2.png',
      'doc-page-3.png',
    ]);
    expect(calls.every((c) => c.mime === 'image/png' && c.dpi === 150)).toBe(true);
    expect(files[0]?.data[0]).toBe(0x89); // PNG signature
  });

  it('renders only selected pages as JPG', async () => {
    const files = await pdfToImages('doc.pdf', 10, fakeRenderer([]), {
      format: 'jpg',
      dpi: 72,
      quality: 0.8,
      pages: [9, 0],
    });
    expect(files.map((f) => f.name)).toEqual(['doc-page-10.jpg', 'doc-page-01.jpg']);
    expect(files[0]?.data[0]).toBe(0xff); // JPEG signature
  });

  it('produces files that zip and unzip intact', async () => {
    const files = await pdfToImages('doc.pdf', 2, fakeRenderer([]), {
      format: 'jpg',
      dpi: 72,
      quality: 0.8,
    });
    const unzipped = unzipSync(zipFiles(files));
    expect(Object.keys(unzipped)).toEqual(['doc-page-1.jpg', 'doc-page-2.jpg']);
    expect(unzipped['doc-page-1.jpg']).toEqual(files[0]?.data);
  });

  it('rejects invalid page selections', async () => {
    const opts = { format: 'png' as const, dpi: 72, quality: 1 };
    await expect(
      pdfToImages('d.pdf', 2, fakeRenderer([]), { ...opts, pages: [] }),
    ).rejects.toThrow();
    await expect(
      pdfToImages('d.pdf', 2, fakeRenderer([]), { ...opts, pages: [5] }),
    ).rejects.toThrow(/out of range/);
  });
});
