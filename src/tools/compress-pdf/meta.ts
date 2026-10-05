import { OFFLINE_FAQ, PRIVACY_FAQ } from '../faq.ts';
import type { ToolMeta } from '../types.ts';

export const meta: ToolMeta = {
  slug: 'compress-pdf',
  name: 'Compress PDF',
  category: 'pdf',
  icon: 'compress',
  summary: 'Shrink scanned or image-heavy PDFs. See the size before and after.',
  title: 'Compress PDF to reduce file size, free and private | neverupload',
  description:
    'Reduce PDF file size by re-rendering pages as JPEG at the quality you choose. See before and after sizes. Runs in your browser; nothing is uploaded.',
  keywords: ['reduce', 'shrink', 'smaller', 'optimize', 'size', 'pdf'],
  faq: [
    {
      q: 'How does the compression work?',
      a: 'Each page is drawn as an image at the resolution you pick and saved as a JPEG at the quality you pick. The images are then put back together into a new PDF with the same page sizes.',
    },
    {
      q: 'Will my text still be selectable?',
      a: 'No. Because pages become images, text can no longer be selected or searched. This works best for scans and photo-heavy documents. Keep your original if you need selectable text.',
    },
    {
      q: 'What if the result is bigger?',
      a: 'Some PDFs are already well optimized. If the compressed version would be larger, neverupload tells you and gives you back the original.',
    },
    PRIVACY_FAQ,
    OFFLINE_FAQ,
  ],
};
