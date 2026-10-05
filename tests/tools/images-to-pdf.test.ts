import { describe, expect, it, vi } from 'vitest';
import {
  computePlacement,
  imagesToPdf,
  PAGE_SIZES,
  type ImagesToPdfOptions,
} from '../../src/tools/images-to-pdf/process';
import { fixture, pdfInfo } from '../helpers';

const a4: ImagesToPdfOptions = { pageSize: 'a4', orientation: 'auto', margin: 0 };

describe('computePlacement', () => {
  it('fit-to-image makes the page the size of the image (96 dpi)', () => {
    expect(computePlacement(800, 600, { ...a4, pageSize: 'fit' })).toEqual({
      pageWidth: 600,
      pageHeight: 450,
      x: 0,
      y: 0,
      width: 600,
      height: 450,
    });
  });

  it('scales large images down to fit the page and centres them', () => {
    const p = computePlacement(4000, 2000, { ...a4, orientation: 'portrait' });
    expect(p.pageWidth).toBeCloseTo(PAGE_SIZES.a4[0]);
    expect(p.width).toBeCloseTo(PAGE_SIZES.a4[0]);
    expect(p.height).toBeCloseTo(p.width / 2);
    expect(p.y).toBeCloseTo((p.pageHeight - p.height) / 2);
  });

  it('does not enlarge small images', () => {
    const p = computePlacement(100, 100, a4);
    expect(p.width).toBe(75);
    expect(p.x).toBeCloseTo((PAGE_SIZES.a4[0] - 75) / 2);
  });

  it('turns the page for landscape images in auto mode', () => {
    const p = computePlacement(3000, 1000, { ...a4, pageSize: 'letter' });
    expect([p.pageWidth, p.pageHeight]).toEqual([792, 612]);
  });

  it('applies margins', () => {
    const p = computePlacement(5000, 5000, { ...a4, margin: 36 });
    expect(p.width).toBeCloseTo(PAGE_SIZES.a4[0] - 72);
  });
});

describe('imagesToPdf', () => {
  it('creates one page per JPG/PNG image', async () => {
    const out = await imagesToPdf(
      [
        { name: 'a.jpg', data: fixture('sample.jpg') },
        { name: 'b.png', data: fixture('sample.png') },
      ],
      { ...a4, pageSize: 'fit' },
    );
    const info = await pdfInfo(out);
    expect(info.pageCount).toBe(2);
    expect(info.sizes).toEqual([
      [30, 23], // 40×30 px
      [18, 12], // 24×16 px
    ]);
  });

  it('uses standard page sizes', async () => {
    const out = await imagesToPdf([{ name: 'a.jpg', data: fixture('sample.jpg') }], {
      pageSize: 'letter',
      orientation: 'portrait',
      margin: 20,
    });
    expect((await pdfInfo(out)).sizes).toEqual([[612, 792]]);
  });

  it('honours an explicit page size per image', async () => {
    const out = await imagesToPdf(
      [{ name: 'a.jpg', data: fixture('sample.jpg'), pageWidth: 500, pageHeight: 700 }],
      a4,
    );
    expect((await pdfInfo(out)).sizes).toEqual([[500, 700]]);
  });

  it('sends WebP and EXIF-rotated JPEGs through the normalizer', async () => {
    const normalize = vi.fn(async () => ({ data: fixture('sample.png'), format: 'png' as const }));
    const out = await imagesToPdf(
      [
        { name: 'a.webp', data: fixture('sample.webp') },
        { name: 'b.jpg', data: fixture('rotated-6-le.jpg') },
        { name: 'c.jpg', data: fixture('sample.jpg') },
      ],
      a4,
      normalize,
    );
    expect(normalize).toHaveBeenCalledTimes(2);
    expect((await pdfInfo(out)).pageCount).toBe(3);
  });

  it('rejects WebP without a normalizer, and unknown files', async () => {
    await expect(
      imagesToPdf([{ name: 'a.webp', data: fixture('sample.webp') }], a4),
    ).rejects.toThrow(/not a supported image/);
    await expect(
      imagesToPdf([{ name: 'x.png', data: fixture('not-a-pdf.pdf') }], a4, async () => ({
        data: new Uint8Array(),
        format: 'png',
      })),
    ).rejects.toThrow(/not a supported image/);
  });

  it('needs at least one image', async () => {
    await expect(imagesToPdf([], a4)).rejects.toThrow(/at least one/);
  });
});
