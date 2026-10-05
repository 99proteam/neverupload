import { OFFLINE_FAQ, PRIVACY_FAQ } from '../faq.ts';
import type { ToolMeta } from '../types.ts';

export const meta: ToolMeta = {
  slug: 'organize-pdf',
  name: 'Rotate & Reorder PDF',
  category: 'pdf',
  icon: 'organize',
  summary: 'Rotate, reorder or delete pages using page thumbnails.',
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
