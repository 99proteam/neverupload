import { describe, expect, it } from 'vitest';
import { degrees, PDFDocument } from 'pdf-lib';
import { pageFrame } from '../../src/lib/pageGeometry';
import {
  addPageNumbers,
  DEFAULT_PAGE_NUMBER_OPTIONS,
  formatPageNumber,
  labelOrigin,
  pageNumbersFileName,
} from '../../src/tools/add-page-numbers/process';
import { drawnTexts, fixture, pdfInfo } from '../helpers';

describe('formatPageNumber', () => {
  it.each([
    ['n', '3'],
    ['page-n', 'Page 3'],
    ['n-of-total', '3 of 12'],
    ['page-n-of-total', 'Page 3 of 12'],
  ] as const)('formats %s', (format, expected) => {
    expect(formatPageNumber(format, 3, 12)).toBe(expected);
  });
});

describe('labelOrigin', () => {
  it('places labels inside the margins', () => {
    expect(labelOrigin('bottom-left', 600, 800, 20, 10)).toEqual({ x: 28, y: 28 });
    expect(labelOrigin('bottom-right', 600, 800, 20, 10)).toEqual({ x: 552, y: 28 });
    expect(labelOrigin('bottom-center', 600, 800, 20, 10)).toEqual({ x: 290, y: 28 });
    expect(labelOrigin('top-center', 600, 800, 20, 10).y).toBeCloseTo(800 - 28 - 7.2);
  });
});

describe('pageFrame', () => {
  it('maps the visual bottom-left corner onto rotated pages', async () => {
    const doc = await PDFDocument.create();
    const expected: Record<number, { x: number; y: number }> = {
      0: { x: 0, y: 0 },
      90: { x: 600, y: 0 },
      180: { x: 600, y: 800 },
      270: { x: 0, y: 800 },
    };
    for (const angle of [0, 90, 180, 270]) {
      const page = doc.addPage([600, 800]);
      page.setRotation(degrees(angle));
      const frame = pageFrame(page);
      const sideways = angle % 180 !== 0;
      expect([frame.width, frame.height]).toEqual(sideways ? [800, 600] : [600, 800]);
      expect(frame.toPage(0, 0)).toEqual(expected[angle]);
    }
  });

  it('respects a crop box that does not start at 0,0', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([600, 800]);
    page.setCropBox(50, 100, 500, 600);
    const frame = pageFrame(page);
    expect([frame.width, frame.height]).toEqual([500, 600]);
    expect(frame.toPage(10, 20)).toEqual({ x: 60, y: 120 });
  });
});

describe('pageNumbersFileName', () => {
  it('adds a suffix', () => {
    expect(pageNumbersFileName('thesis.pdf')).toBe('thesis_numbered.pdf');
  });
});

describe('addPageNumbers', () => {
  it('numbers every page and keeps sizes and rotation', async () => {
    const input = fixture('three-pages.pdf');
    const before = await pdfInfo(input);
    const out = await addPageNumbers(input, {
      ...DEFAULT_PAGE_NUMBER_OPTIONS,
      format: 'n-of-total',
    });
    const after = await pdfInfo(out);
    expect(after).toEqual(before);
    expect(await drawnTexts(out, input)).toEqual(['1 of 3', '2 of 3', '3 of 3']);
  });

  it('can skip the cover and start from another number', async () => {
    const input = fixture('three-pages.pdf');
    const out = await addPageNumbers(input, {
      ...DEFAULT_PAGE_NUMBER_OPTIONS,
      format: 'page-n',
      skipFirst: true,
      startAt: 5,
    });
    expect(await drawnTexts(out, input)).toEqual(['Page 5', 'Page 6']);
  });

  it('reports progress', async () => {
    const progress: number[] = [];
    await addPageNumbers(fixture('ten-pages.pdf'), DEFAULT_PAGE_NUMBER_OPTIONS, (p) =>
      progress.push(p),
    );
    expect(progress.at(-1)).toBe(1);
  });

  it('rejects files that are not PDFs', async () => {
    await expect(
      addPageNumbers(fixture('not-a-pdf.pdf'), DEFAULT_PAGE_NUMBER_OPTIONS, undefined, 'x.pdf'),
    ).rejects.toThrow(/not a valid PDF/);
  });
});
