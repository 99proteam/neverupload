import { OFFLINE_FAQ, PRIVACY_FAQ } from '../faq.ts';
import type { ToolMeta } from '../types.ts';

export const meta: ToolMeta = {
  slug: 'images-to-pdf',
  name: 'Images to PDF',
  category: 'pdf',
  icon: 'imagesToPdf',
  summary: 'Turn JPG, PNG and WebP images into one PDF.',
  intro:
    'Convert JPG, PNG and WebP images into one PDF document. Perfect for turning photos of receipts, scanned pages or screenshots into a single file. Choose A4, Letter or fit-to-image pages, set the order, and download. Your photos never leave your phone or computer.',
  steps: [
    'Drop your images into the box, or tap “Choose images”.',
    'Drag them into the order the pages should appear.',
    'Choose the page size (A4, Letter or fit to image), orientation and margin.',
    'Press “Create PDF” and download it.',
  ],
  title: 'JPG, PNG and WebP to PDF converter, free and private | neverupload',
  description:
    'Convert JPG, PNG and WebP images into a single PDF. Choose A4, Letter or fit-to-image pages. Runs in your browser; your photos are never uploaded.',
  keywords: [
    'jpg to pdf',
    'png to pdf',
    'webp to pdf',
    'photo',
    'picture',
    'convert',
    'scan',
    'image to pdf',
    'photo to pdf',
    'jpg to pdf converter',
    'combine images into pdf',
  ],
  faq: [
    {
      q: 'Which page size should I choose?',
      a: 'A4 and Letter place each image centred on a standard page, which is good for printing. "Fit to image" makes each page exactly the size of its image.',
    },
    {
      q: 'Is image quality reduced?',
      a: 'No. JPG and PNG images are embedded as they are. WebP images are converted losslessly to PNG, because PDF cannot store WebP.',
    },
    PRIVACY_FAQ,
    OFFLINE_FAQ,
  ],
};
