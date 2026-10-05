import { OFFLINE_FAQ, PRIVACY_FAQ } from '../faq.ts';
import type { ToolMeta } from '../types.ts';

export const meta: ToolMeta = {
  slug: 'pdf-to-images',
  name: 'PDF to Images',
  category: 'pdf',
  icon: 'pdfToImages',
  summary: 'Save each PDF page as a PNG or JPG image.',
  title: 'PDF to JPG or PNG converter, free and private | neverupload',
  description:
    'Convert every page of a PDF to PNG or JPG images and download them as a zip. Pick the resolution. Runs in your browser; nothing is uploaded.',
  keywords: ['pdf to jpg', 'pdf to png', 'export', 'pages', 'image', 'convert'],
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
