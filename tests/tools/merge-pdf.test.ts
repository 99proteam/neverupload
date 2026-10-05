import { describe, expect, it } from 'vitest';
import { mergePdfs } from '../../src/tools/merge-pdf/process';
import { fixture, pdfInfo } from '../helpers';

describe('mergePdfs', () => {
  it('merges documents in the given order', async () => {
    const out = await mergePdfs([
      { name: 'a.pdf', data: fixture('one-page.pdf') },
      { name: 'b.pdf', data: fixture('three-pages.pdf') },
    ]);
    const info = await pdfInfo(out);
    expect(info.pageCount).toBe(4);
    expect(info.sizes).toEqual([
      [200, 200],
      [595, 842],
      [612, 792],
      [300, 400],
    ]);
  });

  it('respects a different order', async () => {
    const out = await mergePdfs([
      { name: 'b.pdf', data: fixture('three-pages.pdf') },
      { name: 'a.pdf', data: fixture('one-page.pdf') },
    ]);
    const info = await pdfInfo(out);
    expect(info.sizes.at(-1)).toEqual([200, 200]);
  });

  it('keeps page rotation', async () => {
    const out = await mergePdfs([
      { name: 'a.pdf', data: fixture('three-pages.pdf') },
      { name: 'b.pdf', data: fixture('one-page.pdf') },
    ]);
    expect((await pdfInfo(out)).rotations).toEqual([0, 90, 0, 0]);
  });

  it('reports progress up to 1', async () => {
    const progress: number[] = [];
    await mergePdfs(
      [
        { name: 'a.pdf', data: fixture('one-page.pdf') },
        { name: 'b.pdf', data: fixture('one-page.pdf') },
      ],
      (p) => progress.push(p),
    );
    expect(progress.at(-1)).toBe(1);
    expect([...progress].sort((a, b) => a - b)).toEqual(progress);
  });

  it('needs at least two files', async () => {
    await expect(mergePdfs([{ name: 'a.pdf', data: fixture('one-page.pdf') }])).rejects.toThrow(
      /at least two/,
    );
  });

  it('names the broken file in the error', async () => {
    await expect(
      mergePdfs([
        { name: 'good.pdf', data: fixture('one-page.pdf') },
        { name: 'broken.pdf', data: fixture('not-a-pdf.pdf') },
      ]),
    ).rejects.toThrow(/"broken\.pdf"/);
  });
});
