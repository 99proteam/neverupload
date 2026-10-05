import { OFFLINE_FAQ, PRIVACY_FAQ } from '../faq.ts';
import type { ToolMeta } from '../types.ts';

export const meta: ToolMeta = {
  slug: 'organize-pdf',
  name: 'Rotate & Reorder PDF',
  category: 'pdf',
  icon: 'organize',
  summary: 'Rotate, reorder or delete pages using page thumbnails.',
  intro:
    'Rotate PDF pages, change their order or delete pages you don’t need, using clear page thumbnails. Fix sideways scans, put pages in the right order and remove blank pages without any software and without uploading your PDF.',
  steps: [
    'Drop a PDF into the box to see every page as a thumbnail.',
    'Rotate pages left or right, or use “Rotate all”.',
    'Drag pages to reorder them, or delete the ones you don’t need.',
    'Press “Save PDF” and download the result.',
  ],
  title: 'Rotate and reorder PDF pages, free and private | neverupload',
  description:
    'Rotate, reorder and delete PDF pages with visual thumbnails, then download the result. Works in your browser; your PDF never leaves your device.',
  keywords: [
    'rotate',
    'reorder',
    'rearrange',
    'sort',
    'delete',
    'remove',
    'pages',
    'organize',
    'pdf',
    'rotate pdf',
    'reorder pdf pages',
    'delete pdf pages',
    'rearrange pdf',
    'fix sideways pdf',
  ],
  faq: [
    {
      q: 'How do I rotate or move pages?',
      a: 'Open a PDF to see every page as a thumbnail. Use the rotate buttons on a page, or "Rotate all". Drag a page to move it, or use the arrow buttons (these also work with the keyboard).',
    },
    {
      q: 'Does rotating reduce quality?',
      a: 'No. Pages are not re-rendered; only their rotation setting and order change, so text and images stay exactly as they were.',
    },
    PRIVACY_FAQ,
    OFFLINE_FAQ,
  ],
};
