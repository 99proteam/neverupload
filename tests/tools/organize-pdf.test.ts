import { describe, expect, it } from 'vitest';
import {
  identityLayout,
  normalizeRotation,
  organizePdf,
} from '../../src/tools/organize-pdf/process';
import { fixture, pdfInfo } from '../helpers';

describe('normalizeRotation', () => {
  it.each([
    [0, 0],
    [90, 90],
    [-90, 270],
    [360, 0],
    [450, 90],
    [-450, 270],
    [100, 90],
  ])('%i → %i', (input, expected) => {
    expect(normalizeRotation(input)).toBe(expected);
  });
});

describe('organizePdf', () => {
  it('keeps the document unchanged with the identity layout', async () => {
    const out = await organizePdf(fixture('three-pages.pdf'), identityLayout(3));
    const info = await pdfInfo(out);
    expect(info.sizes).toEqual([
      [595, 842],
      [612, 792],
      [300, 400],
    ]);
    expect(info.rotations).toEqual([0, 90, 0]);
  });

  it('reorders, rotates (on top of existing rotation) and drops pages', async () => {
    const out = await organizePdf(fixture('three-pages.pdf'), [
      { source: 2, rotate: 90 },
      { source: 1, rotate: 270 },
    ]);
    const info = await pdfInfo(out);
    expect(info.sizes).toEqual([
      [300, 400],
      [612, 792],
    ]);
    expect(info.rotations).toEqual([90, 0]);
  });

  it('refuses to produce an empty document', async () => {
    await expect(organizePdf(fixture('one-page.pdf'), [])).rejects.toThrow(/at least one page/);
  });

  it('rejects unknown pages', async () => {
    await expect(organizePdf(fixture('one-page.pdf'), [{ source: 4, rotate: 0 }])).rejects.toThrow(
      /out of range/,
    );
  });
});
