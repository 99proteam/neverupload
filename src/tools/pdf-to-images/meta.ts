import { OFFLINE_FAQ, PRIVACY_FAQ } from '../faq.ts';
import type { ToolMeta } from '../types.ts';

export const meta: ToolMeta = {
  slug: 'pdf-to-images',
  name: 'PDF to Images',
  category: 'pdf',
  icon: 'pdfToImages',
  summary: 'Save each PDF page as a PNG or JPG image.',
  intro:
    'Convert each page of a PDF into a high-quality PNG or JPG image. Choose the resolution, from 72 DPI for the screen up to 300 DPI for printing, and download all pages as a zip. The conversion runs entirely in your browser.',
  steps: [
    'Drop a PDF into the box, or tap “Choose a PDF file”.',
    'Choose PNG or JPG and the resolution.',
    'Press “Convert”.',
    'Download the image, or a zip with one image per page.',
  ],
  title: 'PDF to JPG or PNG converter, free and private | neverupload',
  description:
    'Convert every page of a PDF to PNG or JPG images and download them as a zip. Pick the resolution. Runs in your browser; nothing is uploaded.',
  keywords: [
    'pdf to jpg',
    'pdf to png',
    'export',
    'pages',
    'image',
    'convert',
    'pdf to image',
    'pdf to jpg converter',
    'pdf to png converter',
    'save pdf page as image',
  ],
  faq: [
    {
      q: 'PNG or JPG?',
      a: 'PNG is lossless and best for text and diagrams. JPG makes much smaller files and is best for photos and scans.',
    },
    {
      q: 'What resolution should I use?',
      a: '150 DPI is good for screens. Use 300 DPI for printing. Higher resolutions make bigger files and take longer.',
    },
    PRIVACY_FAQ,
    OFFLINE_FAQ,
  ],
};
