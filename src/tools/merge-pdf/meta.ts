import { OFFLINE_FAQ, PRIVACY_FAQ } from '../faq.ts';
import type { ToolMeta } from '../types.ts';

export const meta: ToolMeta = {
  slug: 'merge-pdf',
  name: 'Merge PDF',
  category: 'pdf',
  icon: 'merge',
  summary: 'Combine several PDFs into one file, in the order you choose.',
  title: 'Merge PDF files online, free and private | neverupload',
  description:
    'Combine multiple PDF files into one in your browser. Drag to reorder, then download. Free, no sign-up, and your files never leave your device.',
  keywords: ['combine', 'join', 'append', 'concatenate', 'pdf'],
  faq: [
    {
      q: 'How do I merge PDF files?',
      a: 'Drop two or more PDFs into the box (or pick them with the button), drag them into the order you want, and press "Merge PDFs". Your combined file downloads straight away.',
    },
    PRIVACY_FAQ,
    {
      q: 'Is there a file size or page limit?',
      a: 'There is no fixed limit. Files of 100 MB and more work fine on most computers; the only real limit is your device’s memory.',
    },
    {
      q: 'Can I merge password-protected PDFs?',
      a: 'Not yet. Remove the password in your PDF reader first, then merge.',
    },
    OFFLINE_FAQ,
  ],
};
