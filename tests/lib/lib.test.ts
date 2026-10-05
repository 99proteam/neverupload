import { describe, expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import { moveItem } from '../../src/lib/array';
import { toUserMessage, UserFacingError } from '../../src/lib/errors';
import { matchesAccept } from '../../src/lib/files';
import {
  baseName,
  formatBytes,
  percentSaved,
  uniqueNames,
  withExtension,
} from '../../src/lib/format';
import { detectImageFormat, outputMimeFor, readJpegOrientation } from '../../src/lib/imageFormat';
import { assertCanvasSize, outputName } from '../../src/lib/imageTransform';
import { zipFiles } from '../../src/lib/zip';
import { searchTools, TOOL_METAS } from '../../src/tools/meta';
import { collectTransferables } from '../../src/workers/protocol';
import { fixture } from '../helpers';

describe('format helpers', () => {
  it('formats bytes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(150 * 1024 * 1024)).toBe('150 MB');
    expect(formatBytes(-1)).toBe('—');
  });
  it('computes savings', () => {
    expect(percentSaved(200, 50)).toBe(75);
    expect(percentSaved(100, 150)).toBe(-50);
    expect(percentSaved(0, 5)).toBe(0);
  });
  it('handles file names', () => {
    expect(baseName('a.b.pdf')).toBe('a.b');
    expect(baseName('.env')).toBe('.env');
    expect(withExtension('photo.jpeg', 'webp')).toBe('photo.webp');
    expect(uniqueNames(['a.jpg', 'A.jpg', 'a.jpg', 'b'])).toEqual([
      'a.jpg',
      'A (2).jpg',
      'a (3).jpg',
      'b',
    ]);
  });
});

describe('zipFiles', () => {
  it('creates a zip with unique names', () => {
    const data = new Uint8Array([1, 2, 3]);
    const zip = unzipSync(
      zipFiles([
        { name: 'x.pdf', data },
        { name: 'x.pdf', data },
      ]),
    );
    expect(Object.keys(zip)).toEqual(['x.pdf', 'x (2).pdf']);
  });
  it('refuses to create an empty zip', () => {
    expect(() => zipFiles([])).toThrow();
  });
});

describe('image format detection', () => {
  it('detects formats by magic bytes', () => {
    expect(detectImageFormat(fixture('sample.jpg'))).toBe('jpeg');
    expect(detectImageFormat(fixture('sample.png'))).toBe('png');
    expect(detectImageFormat(fixture('sample.webp'))).toBe('webp');
    expect(detectImageFormat(fixture('one-page.pdf'))).toBeNull();
  });
  it('reads EXIF orientation in both byte orders', () => {
    expect(readJpegOrientation(fixture('sample.jpg'))).toBe(1);
    expect(readJpegOrientation(fixture('rotated-6-le.jpg'))).toBe(6);
    expect(readJpegOrientation(fixture('rotated-8-be.jpg'))).toBe(8);
    expect(readJpegOrientation(fixture('sample.png'))).toBe(1);
  });
  it('maps input types to writable output types', () => {
    expect(outputMimeFor('image/jpg')).toBe('image/jpeg');
    expect(outputMimeFor('image/webp')).toBe('image/webp');
    expect(outputMimeFor('image/gif')).toBe('image/png');
    expect(outputName('x.jpeg', 'image/jpeg')).toBe('x.jpg');
  });
  it('guards canvas limits', () => {
    expect(() => assertCanvasSize(4000, 3000)).not.toThrow();
    expect(() => assertCanvasSize(20000, 10)).toThrow(/larger than your browser/);
    expect(() => assertCanvasSize(0, 10)).toThrow();
  });
});

describe('misc', () => {
  it('moves items', () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2, 3], 0, 5)).toEqual([1, 2, 3]);
  });
  it('matches accept strings', () => {
    expect(matchesAccept({ name: 'a.PDF', type: '' }, 'application/pdf,.pdf')).toBe(true);
    expect(matchesAccept({ name: 'a.png', type: 'image/png' }, 'image/*')).toBe(true);
    expect(matchesAccept({ name: 'a.txt', type: 'text/plain' }, 'image/*,.pdf')).toBe(false);
  });
  it('turns errors into friendly messages', () => {
    expect(toUserMessage(new UserFacingError('Nice message'))).toBe('Nice message');
    expect(toUserMessage(new Error('Input document is encrypted'))).toMatch(/password-protected/);
  });
  it('collects transferable buffers once', () => {
    const a = new Uint8Array(4);
    const list = collectTransferables({ files: [{ data: a }, { data: a }], n: 1 });
    expect(list).toEqual([a.buffer]);
  });
  it('searches tools by name and keyword', () => {
    expect(searchTools(TOOL_METAS, 'jpg').map((t) => t.slug)).toContain('images-to-pdf');
    expect(searchTools(TOOL_METAS, 'MERGE').map((t) => t.slug)).toEqual(['merge-pdf']);
    expect(searchTools(TOOL_METAS, '')).toHaveLength(10);
  });
  it('has complete SEO metadata for every tool', () => {
    const slugs = new Set<string>();
    for (const t of TOOL_METAS) {
      expect(slugs.has(t.slug)).toBe(false);
      slugs.add(t.slug);
      expect(t.description.length).toBeLessThanOrEqual(170);
      expect(t.title.length).toBeGreaterThan(10);
      expect(t.faq.length).toBeGreaterThanOrEqual(2);
    }
  });
});
