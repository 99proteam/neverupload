import { OFFLINE_FAQ, PRIVACY_FAQ } from '../faq.ts';
import type { ToolMeta } from '../types.ts';

export const meta: ToolMeta = {
  slug: 'split-pdf',
  name: 'Split PDF',
  category: 'pdf',
  icon: 'split',
  summary: 'Extract page ranges or split every page into its own PDF.',
  intro:
    'Split a PDF into separate files or extract just the pages you need. Type page ranges such as 1-3, 5, 8-10, or split every page into its own PDF and download them all as a zip. Your document is processed on your device and never uploaded.',
  steps: [
    'Drop a PDF into the box, or tap “Choose a PDF file”.',
    'Choose “Page ranges” and type the pages you want, or choose “Every page”.',
    'Press “Split PDF”.',
    'Download the new PDF, or a zip file with all the parts.',
  ],
  title: 'Split PDF by page ranges, free and private | neverupload',
  description:
    'Split a PDF by page ranges like 1-3, 5, 8-10, or into single pages downloaded as a zip. Runs in your browser; files never leave your device.',
  keywords: [
    'extract',
    'separate',
    'pages',
    'range',
    'cut',
    'pdf',
    'split pdf online',
    'extract pdf pages',
    'separate pdf pages',
    'split pdf by pages',
  ],
  faq: [
    {
      q: 'How do page ranges work?',
      a: 'Type pages and ranges separated by commas, for example "1-3, 5, 8-10". Each part becomes its own PDF. "8-" means page 8 to the end.',
    },
    {
      q: 'How do I get every page as a separate file?',
      a: 'Choose "Every page" and press Split. You get a zip file with one PDF per page.',
    },
    PRIVACY_FAQ,
    OFFLINE_FAQ,
  ],
};
