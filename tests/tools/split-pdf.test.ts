import { describe, expect, it } from 'vitest';
import {
  everyPageGroups,
  parsePageRanges,
  splitFileName,
  splitPdf,
} from '../../src/tools/split-pdf/process';
import { fixture, pdfInfo } from '../helpers';

describe('parsePageRanges', () => {
  it('parses ranges and single pages into zero-based groups', () => {
    expect(parsePageRanges('1-3, 5, 8-10', 10)).toEqual([[0, 1, 2], [4], [7, 8, 9]]);
  });

  it('accepts open-ended ranges, en dashes and extra whitespace', () => {
    expect(parsePageRanges(' 8- ', 10)).toEqual([[7, 8, 9]]);
    expect(parsePageRanges('2 – 3', 10)).toEqual([[1, 2]]);
    expect(parsePageRanges('1;2', 2)).toEqual([[0], [1]]);
  });

  it('ignores empty parts', () => {
    expect(parsePageRanges('1,,2,', 2)).toEqual([[0], [1]]);
  });

  it.each([
    ['', /at least one/],
    ['abc', /not a valid/],
    ['0', /start at 1/],
    ['11', /outside this document/],
    ['5-3', /backwards/],
    ['1-2-3', /not a valid/],
  ])('rejects %j', (input, message) => {
    expect(() => parsePageRanges(input, 10)).toThrow(message);
  });
});

describe('everyPageGroups', () => {
  it('creates one group per page', () => {
    expect(everyPageGroups(3)).toEqual([[0], [1], [2]]);
  });
});

describe('splitFileName', () => {
  it('describes the pages in the name', () => {
    expect(splitFileName('report.pdf', [0, 1, 2])).toBe('report_pages-1-3.pdf');
    expect(splitFileName('report.pdf', [4])).toBe('report_page-5.pdf');
  });
});

describe('splitPdf', () => {
  it('creates one PDF per group', async () => {
    const outputs = await splitPdf(fixture('ten-pages.pdf'), parsePageRanges('1-3, 5, 8-10', 10));
    const counts = await Promise.all(outputs.map(async (o) => (await pdfInfo(o)).pageCount));
    expect(counts).toEqual([3, 1, 3]);
  });

  it('keeps page sizes and rotation', async () => {
    const [second] = await splitPdf(fixture('three-pages.pdf'), [[1]]);
    const info = await pdfInfo(second as Uint8Array);
    expect(info.sizes).toEqual([[612, 792]]);
    expect(info.rotations).toEqual([90]);
  });

  it('splits every page', async () => {
    const outputs = await splitPdf(fixture('three-pages.pdf'), everyPageGroups(3));
    expect(outputs).toHaveLength(3);
  });

  it('rejects out-of-range pages', async () => {
    await expect(splitPdf(fixture('one-page.pdf'), [[3]])).rejects.toThrow(/out of range/);
  });
});
