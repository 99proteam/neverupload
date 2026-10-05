import { describe, expect, it } from 'vitest';
import { convertImages, isValidHexColor } from '../../src/tools/convert-image/process';
import type { TransformOptions } from '../../src/lib/imageTransform';
import { fakeTransformer, imageInput } from '../helpers';

describe('convertImages', () => {
  it('converts every file to the target format with new extensions', async () => {
    const calls: TransformOptions[] = [];
    const results = await convertImages(
      [imageInput('a.png', 'image/png', 100), imageInput('b.webp', 'image/webp', 100)],
      { target: 'image/jpeg', quality: 0.8, background: '#000000' },
      fakeTransformer(() => 40, calls),
    );
    expect(results.map((r) => r.name)).toEqual(['a.jpg', 'b.jpg']);
    expect(calls.every((c) => c.mime === 'image/jpeg' && c.background === '#000000')).toBe(true);
    expect(results.every((r) => r.blob?.type === 'image/jpeg')).toBe(true);
  });

  it('falls back to a white background for invalid colours', async () => {
    const calls: TransformOptions[] = [];
    await convertImages(
      [imageInput('a.png', 'image/png', 1)],
      { target: 'image/jpeg', quality: 0.8, background: 'red' },
      fakeTransformer(() => 1, calls),
    );
    expect(calls[0]?.background).toBe('#ffffff');
  });

  it('reports encoder errors per file', async () => {
    const results = await convertImages(
      [imageInput('a.png', 'image/png', 1)],
      { target: 'image/webp', quality: 0.8, background: '#ffffff' },
      async () => {
        throw new Error("Your browser can't create WEBP files.");
      },
    );
    expect(results[0]).toMatchObject({ name: 'a.webp', error: expect.stringMatching(/WEBP/) });
  });
});

describe('isValidHexColor', () => {
  it('accepts #rrggbb only', () => {
    expect(isValidHexColor('#a1B2c3')).toBe(true);
    expect(isValidHexColor('#fff')).toBe(false);
    expect(isValidHexColor('white')).toBe(false);
  });
});
