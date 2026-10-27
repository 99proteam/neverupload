import { OFFLINE_FAQ, PRIVACY_FAQ } from '../faq.ts';
import type { ToolMeta } from '../types.ts';

export const meta: ToolMeta = {
  slug: 'watermark-pdf',
  name: 'Watermark PDF',
  category: 'pdf',
  icon: 'watermark',
  summary: 'Stamp text such as DRAFT or CONFIDENTIAL across every page.',
  intro:
    'Add a text watermark such as DRAFT, CONFIDENTIAL or your company name to every page of a PDF. Choose diagonal, horizontal or tiled placement, a color and how see-through it is. The watermark is added in your browser, so sensitive documents never leave your device.',
  steps: [
    'Drop a PDF into the box, or tap “Choose a PDF file”.',
    'Type the watermark text, e.g. CONFIDENTIAL.',
    'Pick the layout, color and opacity.',
    'Press “Add watermark” and download the watermarked PDF.',
  ],
  title: 'Add a watermark to a PDF, free and private | neverupload',
  description:
    'Stamp DRAFT, CONFIDENTIAL or any text across every PDF page: diagonal, horizontal or tiled, any opacity. Runs in your browser; nothing is uploaded.',
  keywords: [
    'stamp',
    'confidential',
    'draft',
    'copyright',
    'brand',
    'watermark pdf',
    'add watermark to pdf',
    'pdf watermark free',
    'stamp pdf',
    'mark pdf as draft',
  ],
  faq: [
    {
      q: 'Can the watermark be removed?',
      a: 'It is drawn into each page, so it shows in every PDF viewer and when printed. Someone with a PDF editor could still delete it, so for strong protection also share the file only with people you trust.',
    },
    {
      q: 'Which characters can I use?',
      a: 'Latin letters, numbers and common symbols, using the standard Helvetica font built into every PDF reader. Emoji and non-Latin scripts are not supported yet.',
    },
    {
      q: 'Will my text still be selectable?',
      a: 'Yes. Your pages are not re-rendered; the watermark is added on top, so the original text, links and images stay exactly as they were.',
    },
    PRIVACY_FAQ,
    OFFLINE_FAQ,
  ],
};
