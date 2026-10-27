import { describe, expect, it } from 'vitest';
import { centeredTextOrigin } from '../../src/lib/pageGeometry';
import {
  autoFontSize,
  DEFAULT_WATERMARK_OPTIONS,
  watermarkFileName,
  watermarkPdf,
} from '../../src/tools/watermark-pdf/process';
import { drawnTexts, fixture, pdfInfo } from '../helpers';

/** Fake font: every character is 0.5 em wide. */
const font = { widthOfTextAtSize: (text: string, size: number) => text.length * size * 0.5 };

describe('centeredTextOrigin', () => {
  it('centers unrotated text', () => {
    expect(centeredTextOrigin(100, 100, 40, 10, 0)).toEqual({ x: 80, y: 95 });
  });

  it('centers text rotated by 90 degrees', () => {
    const o = centeredTextOrigin(100, 100, 40, 10, 90);
    expect(o.x).toBeCloseTo(105);
    expect(o.y).toBeCloseTo(80);
  });
});

describe('autoFontSize', () => {
  it('spans about 70% of the page diagonal', () => {
    const size = autoFontSize(font, 'DRAFT', 300, 400, 'diagonal');
    expect(font.widthOfTextAtSize('DRAFT', size)).toBeCloseTo(500 * 0.7);
  });

  it('stays within sensible limits', () => {
    expect(autoFontSize(font, 'X', 600, 800, 'diagonal')).toBe(160);
    expect(
      autoFontSize(font, 'A very long watermark text indeed'.repeat(4), 200, 200, 'horizontal'),
    ).toBe(12);
  });
});

describe('watermarkFileName', () => {
  it('adds a suffix', () => {
    expect(watermarkFileName('contract.pdf')).toBe('contract_watermarked.pdf');
  });
});

describe('watermarkPdf', () => {
  it('stamps every page and keeps sizes and rotation', async () => {
    const input = fixture('three-pages.pdf');
    const before = await pdfInfo(input);
    const out = await watermarkPdf(input, { ...DEFAULT_WATERMARK_OPTIONS, text: '  DRAFT  ' });
    expect(await pdfInfo(out)).toEqual(before);
    expect(await drawnTexts(out, input)).toEqual(['DRAFT', 'DRAFT', 'DRAFT']);
  });

  it('repeats the text when tiled', async () => {
    const input = fixture('one-page.pdf');
    const out = await watermarkPdf(input, { ...DEFAULT_WATERMARK_OPTIONS, layout: 'tiled' });
    expect((await drawnTexts(out, input)).length).toBeGreaterThan(4);
  });

  it.each([
    ['', /Enter the watermark text/],
    ['x'.repeat(81), /under 80 characters/],
    ['मसौदा', /Latin letters/],
  ])('rejects %j', async (text, message) => {
    await expect(
      watermarkPdf(fixture('one-page.pdf'), { ...DEFAULT_WATERMARK_OPTIONS, text }),
    ).rejects.toThrow(message);
  });
});
