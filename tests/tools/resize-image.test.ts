import { describe, expect, it } from 'vitest';
import { computeResizeDimensions, resizeImages } from '../../src/tools/resize-image/process';
import type { TransformOptions } from '../../src/lib/imageTransform';
import { fakeTransformer, imageInput } from '../helpers';

describe('computeResizeDimensions', () => {
  it('scales by percent', () => {
    expect(computeResizeDimensions(400, 300, { mode: 'percent', percent: 50 })).toEqual({
      width: 200,
      height: 150,
    });
    expect(computeResizeDimensions(3, 3, { mode: 'percent', percent: 1 })).toEqual({
      width: 1,
      height: 1,
    });
  });

  it('derives the missing side when keeping the aspect ratio', () => {
    const keep = { mode: 'pixels' as const, keepAspect: true };
    expect(computeResizeDimensions(400, 300, { ...keep, width: 200, height: null })).toEqual({
      width: 200,
      height: 150,
    });
    expect(computeResizeDimensions(400, 300, { ...keep, width: null, height: 600 })).toEqual({
      width: 800,
      height: 600,
    });
  });

  it('fits inside the box when both sides are given', () => {
    expect(
      computeResizeDimensions(400, 300, {
        mode: 'pixels',
        width: 100,
        height: 100,
        keepAspect: true,
      }),
    ).toEqual({ width: 100, height: 75 });
  });

  it('stretches when the aspect ratio is not kept', () => {
    expect(
      computeResizeDimensions(400, 300, {
        mode: 'pixels',
        width: 100,
        height: 100,
        keepAspect: false,
      }),
    ).toEqual({ width: 100, height: 100 });
    expect(
      computeResizeDimensions(400, 300, {
        mode: 'pixels',
        width: 100,
        height: null,
        keepAspect: false,
      }),
    ).toEqual({ width: 100, height: 300 });
  });

  it('leaves the size alone in "none" mode', () => {
    expect(computeResizeDimensions(400, 300, { mode: 'none' })).toEqual({
      width: 400,
      height: 300,
    });
  });

  it('rejects invalid input', () => {
    expect(() => computeResizeDimensions(1, 1, { mode: 'percent', percent: 0 })).toThrow();
    expect(() =>
      computeResizeDimensions(1, 1, {
        mode: 'pixels',
        width: null,
        height: null,
        keepAspect: true,
      }),
    ).toThrow(/width, a height/);
  });
});

describe('resizeImages', () => {
  it('resizes every file and keeps formats', async () => {
    const calls: TransformOptions[] = [];
    const results = await resizeImages(
      [imageInput('a.png', 'image/png', 100), imageInput('b.jpg', 'image/jpeg', 100)],
      { resize: { mode: 'percent', percent: 50 }, format: 'same', quality: 0.9 },
      fakeTransformer(() => 50, calls),
    );
    expect(calls.map((c) => c.mime)).toEqual(['image/png', 'image/jpeg']);
    expect(results.map((r) => [r.name, r.width, r.height])).toEqual([
      ['a.png', 200, 150],
      ['b.jpg', 200, 150],
    ]);
  });

  it('never swaps in the original even if the output is larger', async () => {
    const [r] = await resizeImages(
      [imageInput('a.jpg', 'image/jpeg', 10)],
      { resize: { mode: 'percent', percent: 200 }, format: 'same', quality: 0.9 },
      fakeTransformer(() => 999),
    );
    expect(r?.keptOriginal).toBeUndefined();
    expect(r?.width).toBe(800);
  });

  it('can convert while resizing', async () => {
    const [r] = await resizeImages(
      [imageInput('a.png', 'image/png', 10)],
      { resize: { mode: 'none' }, format: 'image/webp', quality: 0.9 },
      fakeTransformer(() => 5),
    );
    expect(r?.name).toBe('a.webp');
  });
});
