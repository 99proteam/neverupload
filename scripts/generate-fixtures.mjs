// Regenerates the small sample files in tests/fixtures. Run with: npm run fixtures
// Everything is created from code, so no binary blobs of unknown origin end up in the repo.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';
import { degrees, PDFDocument, StandardFonts } from 'pdf-lib';

const out = new URL('../tests/fixtures/', import.meta.url);
mkdirSync(out, { recursive: true });
const save = (name, bytes) => writeFileSync(new URL(name, out), bytes);

// --- PDFs ---------------------------------------------------------------
async function makePdf(sizes, { rotateSecond = false } = {}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  sizes.forEach(([w, h], i) => {
    const page = doc.addPage([w, h]);
    page.drawText(`Page ${i + 1}`, { x: 40, y: h - 80, size: 36, font });
    if (rotateSecond && i === 1) page.setRotation(degrees(90));
  });
  doc.setTitle('neverupload test fixture');
  return doc.save();
}
save(
  'three-pages.pdf',
  await makePdf(
    [
      [595, 842],
      [612, 792],
      [300, 400],
    ],
    { rotateSecond: true },
  ),
);
save('one-page.pdf', await makePdf([[200, 200]]));
save('ten-pages.pdf', await makePdf(Array.from({ length: 10 }, () => [300, 300])));
save('not-a-pdf.pdf', new TextEncoder().encode('This is plain text, not a PDF.'));

// --- PNG (tiny encoder: 24x16 RGBA gradient) ----------------------------
function png(width, height) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const i = row + 1 + x * 4;
      raw[i] = (x * 255) / width;
      raw[i + 1] = (y * 255) / height;
      raw[i + 2] = 128;
      raw[i + 3] = 255;
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
save('sample.png', png(24, 16));

// --- JPEG (40x30 baseline, made with ImageMagick once) ------------------
const jpeg = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAAAAAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAeACgDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAFxABAQEBAAAAAAAAAAAAAAAAABMBYf/EABYBAQEBAAAAAAAAAAAAAAAAAAAHAf/EABgRAAMBAQAAAAAAAAAAAAAAAAAVYQEC/9oADAMBAAIRAxEAPwDMrFk6xZqCFmdUo2LJ1iwggdUo2E6wIIHVJ1ulup1dK6tSPkkbnSjbpbqdXSuiPkOdKNuidXQR8hzp/9k=',
  'base64',
);
save('sample.jpg', jpeg);

/** Insert an EXIF APP1 segment carrying only an Orientation tag. */
function withOrientation(jpg, orientation, little) {
  const tiff = Buffer.alloc(26);
  if (little) {
    tiff.write('II', 0, 'ascii');
    tiff.writeUInt16LE(42, 2);
    tiff.writeUInt32LE(8, 4);
    tiff.writeUInt16LE(1, 8); // one IFD entry
    tiff.writeUInt16LE(0x0112, 10);
    tiff.writeUInt16LE(3, 12); // SHORT
    tiff.writeUInt32LE(1, 14);
    tiff.writeUInt16LE(orientation, 18);
  } else {
    tiff.write('MM', 0, 'ascii');
    tiff.writeUInt16BE(42, 2);
    tiff.writeUInt32BE(8, 4);
    tiff.writeUInt16BE(1, 8);
    tiff.writeUInt16BE(0x0112, 10);
    tiff.writeUInt16BE(3, 12);
    tiff.writeUInt32BE(1, 14);
    tiff.writeUInt16BE(orientation, 18);
  }
  const payload = Buffer.concat([Buffer.from('Exif\0\0', 'binary'), tiff]);
  const header = Buffer.from([0xff, 0xe1, 0, 0]);
  header.writeUInt16BE(payload.length + 2, 2);
  return Buffer.concat([jpg.subarray(0, 2), header, payload, jpg.subarray(2)]);
}
save('rotated-6-le.jpg', withOrientation(jpeg, 6, true));
save('rotated-8-be.jpg', withOrientation(jpeg, 8, false));

// --- WebP (20x10 lossless, made with ImageMagick once) -------------------
save('sample.webp', Buffer.from('UklGRhwAAABXRUJQVlA4TA8AAAAvE0ACAAdQwIj+ByKi/wEA', 'base64'));

console.log('Fixtures written to tests/fixtures/');
