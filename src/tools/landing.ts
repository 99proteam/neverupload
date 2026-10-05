import { meta as imagesToPdf } from './images-to-pdf/meta.ts';
import { meta as pdfToImages } from './pdf-to-images/meta.ts';
import { meta as convertImage } from './convert-image/meta.ts';
import { meta as compressPdf } from './compress-pdf/meta.ts';
import { meta as compressImage } from './compress-image/meta.ts';
import type { ToolMeta } from './types.ts';

/**
 * Keyword landing pages: popular searches like "jpg to pdf" get their own URL,
 * title, heading and text, and open an existing tool with the right preset.
 */
interface LandingSpec {
  slug: string;
  base: ToolMeta;
  name: string;
  summary: string;
  title: string;
  description: string;
  intro: string;
  keywords: string[];
  preset?: Record<string, string>;
}

function landing(spec: LandingSpec): ToolMeta {
  return {
    ...spec.base,
    slug: spec.slug,
    name: spec.name,
    summary: spec.summary,
    title: spec.title,
    description: spec.description,
    intro: spec.intro,
    keywords: [...new Set([...spec.keywords, ...spec.base.keywords])],
    toolSlug: spec.base.slug,
    preset: spec.preset,
  };
}

const imageToPdf = (from: string, ext: string) =>
  landing({
    slug: `${ext}-to-pdf`,
    base: imagesToPdf,
    name: `${from} to PDF`,
    summary: `Convert ${from} images to a PDF document.`,
    title: `${from} to PDF converter: free, private, no upload | neverupload`,
    description: `Convert ${from} images to PDF in your browser. Combine many ${from} files into one PDF, choose A4 or Letter. Free, no sign-up, nothing uploaded.`,
    intro: `Turn ${from} pictures into a PDF in seconds. Add one or many ${from} files, put them in order, pick A4, Letter or fit-to-image pages and download a single PDF. The conversion runs on your own device, so your images are never uploaded to a server.`,
    keywords: [
      `${ext} to pdf`,
      `convert ${ext} to pdf`,
      `${ext} to pdf free`,
      `${ext} to pdf offline`,
    ],
  });

const pdfToImage = (to: string, format: 'png' | 'jpg') =>
  landing({
    slug: `pdf-to-${format}`,
    base: pdfToImages,
    name: `PDF to ${to}`,
    summary: `Convert every PDF page to a ${to} image.`,
    title: `PDF to ${to} converter: free, high quality, no upload | neverupload`,
    description: `Convert PDF pages to ${to} images at up to 300 DPI, right in your browser. Download all pages as a zip. Free, private, nothing uploaded.`,
    intro: `Convert a PDF to ${to} images in your browser. Every page becomes a separate ${to} file at the resolution you choose (72, 150 or 300 DPI) and you download them all together as a zip. Your PDF is never uploaded, which makes it safe for private documents.`,
    keywords: [`pdf to ${format}`, `convert pdf to ${format}`, `pdf to ${format} high quality`],
    preset: { format },
  });

const FORMAT_MIME = { JPG: 'image/jpeg', PNG: 'image/png', WebP: 'image/webp' } as const;
type FormatLabel = keyof typeof FORMAT_MIME;

const imageConvert = (from: FormatLabel, to: FormatLabel) => {
  const f = from.toLowerCase();
  const t = to.toLowerCase();
  return landing({
    slug: `${f}-to-${t}`,
    base: convertImage,
    name: `${from} to ${to}`,
    summary: `Convert ${from} images to ${to}, one or many at once.`,
    title: `${from} to ${to} converter: free, batch, no upload | neverupload`,
    description: `Convert ${from} to ${to} online for free. Batch convert many images at once in your browser; your files are never uploaded.`,
    intro: `Change ${from} images into ${to} files in your browser. Add a single picture or a whole folder, adjust the quality, and download the converted ${to} images (as a zip for batches). Nothing is uploaded: the conversion happens on your own device.`,
    keywords: [
      `${f} to ${t}`,
      `convert ${f} to ${t}`,
      `${f} to ${t} converter`,
      `${f} to ${t} batch`,
    ],
    preset: { target: FORMAT_MIME[to] },
  });
};

export const LANDING_METAS: ToolMeta[] = [
  imageToPdf('JPG', 'jpg'),
  imageToPdf('PNG', 'png'),
  imageToPdf('WebP', 'webp'),
  pdfToImage('JPG', 'jpg'),
  pdfToImage('PNG', 'png'),
  imageConvert('WebP', 'JPG'),
  imageConvert('WebP', 'PNG'),
  imageConvert('PNG', 'JPG'),
  imageConvert('JPG', 'PNG'),
  imageConvert('JPG', 'WebP'),
  imageConvert('PNG', 'WebP'),
  landing({
    slug: 'compress-pdf-for-email',
    base: compressPdf,
    name: 'Compress PDF for email',
    summary: 'Make a PDF small enough to attach to an email.',
    title: 'Compress a PDF for email or upload limits: free, private | neverupload',
    description:
      'Make a PDF small enough for email attachments and upload forms (e.g. under 1 MB or 2 MB). Free, works in your browser, no upload.',
    intro:
      'Email providers and online forms often reject large PDFs. Compress your PDF here to get under limits like 1 MB, 2 MB or 10 MB: lower the quality or resolution until the “after” size fits. Your document stays on your device the whole time.',
    keywords: [
      'compress pdf to 1mb',
      'compress pdf to 200kb',
      'pdf too large for email',
      'reduce pdf size for upload',
    ],
  }),
  landing({
    slug: 'compress-jpeg',
    base: compressImage,
    name: 'Compress JPEG',
    summary: 'Reduce JPG/JPEG photo size with a quality slider.',
    title: 'Compress JPEG photos online: free, batch, no upload | neverupload',
    description:
      'Reduce JPG and JPEG file size with a live preview. Compress photos to 100 KB, 200 KB or less for forms and websites. Free and private.',
    intro:
      'Shrink JPEG photos for online forms, job portals and websites that limit file size (for example 100 KB or 200 KB). Move the slider, watch the new size update live, and download. Batch compress many photos at once, without uploading them.',
    keywords: ['compress jpeg', 'compress jpg to 100kb', 'reduce photo size', 'jpeg compressor'],
    preset: { format: 'image/jpeg' },
  }),
];
