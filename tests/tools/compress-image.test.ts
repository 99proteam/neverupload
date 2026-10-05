import { describe, expect, it } from 'vitest';
import { compressImages, compressionPlan } from '../../src/tools/compress-image/process';
import type { TransformOptions } from '../../src/lib/imageTransform';
import { fakeTransformer, imageInput } from '../helpers';

describe('compressionPlan', () => {
  it('keeps the input format by default and clamps quality', () => {
    expect(compressionPlan({ type: 'image/jpeg' }, { quality: 2, format: 'same' })).toMatchObject({
      mime: 'image/jpeg',
      quality: 1,
      resize: { mode: 'none' },
    });
    expect(
      compressionPlan({ type: 'image/png' }, { quality: 0.5, format: 'image/webp' }).mime,
    ).toBe('image/webp');
  });
});

describe('compressImages', () => {
  it('compresses each file with the chosen quality', async () => {
    const calls: TransformOptions[] = [];
    const results = await compressImages(
      [imageInput('a.jpg', 'image/jpeg', 1000), imageInput('b.webp', 'image/webp', 2000)],
      { quality: 0.6, format: 'same' },
      fakeTransformer(() => 500, calls),
    );
    expect(calls.map((c) => [c.mime, c.quality])).toEqual([
      ['image/jpeg', 0.6],
      ['image/webp', 0.6],
    ]);
    expect(results.map((r) => [r.name, r.size, r.keptOriginal])).toEqual([
      ['a.jpg', 500, undefined],
      ['b.webp', 500, undefined],
    ]);
  });

  it('keeps the original when re-encoding would make it bigger', async () => {
    const original = imageInput('a.jpg', 'image/jpeg', 100);
    const [result] = await compressImages(
      [original],
      { quality: 0.9, format: 'same' },
      fakeTransformer(() => 300),
    );
    expect(result).toMatchObject({ keptOriginal: true, size: 100, name: 'a.jpg' });
    expect(result?.blob).toBe(original.blob);
  });

  it('renames files when the format changes', async () => {
    const [result] = await compressImages(
      [imageInput('photo.png', 'image/png', 5000)],
      { quality: 0.7, format: 'image/webp' },
      fakeTransformer(() => 900),
    );
    expect(result?.name).toBe('photo.webp');
  });

  it('reports a failing file without stopping the batch', async () => {
    let n = 0;
    const results = await compressImages(
      [imageInput('bad.jpg', 'image/jpeg', 10), imageInput('good.jpg', 'image/jpeg', 1000)],
      { quality: 0.7, format: 'same' },
      async (blob, options) => {
        if (n++ === 0) throw new Error('This image could not be decoded.');
        return fakeTransformer(() => 10)(blob, options);
      },
    );
    expect(results[0]?.error).toMatch(/could not be decoded/);
    expect(results[1]?.size).toBe(10);
  });

  it('requires at least one file', () => {
    expect(() =>
      compressImages(
        [],
        { quality: 1, format: 'same' },
        fakeTransformer(() => 1),
      ),
    ).toThrow();
  });
});
