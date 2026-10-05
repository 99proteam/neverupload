import { OFFLINE_FAQ, PRIVACY_FAQ } from '../faq.ts';
import type { ToolMeta } from '../types.ts';

export const meta: ToolMeta = {
  slug: 'convert-image',
  name: 'Convert Image',
  category: 'image',
  icon: 'convert',
  summary: 'Convert between JPG, PNG and WebP, one image or many.',
  title: 'Convert images between JPG, PNG and WebP, free and private | neverupload',
  description:
    'Convert images between JPG, PNG and WebP formats in batches. Choose quality and background colour. Runs in your browser; images never leave your device.',
  keywords: ['jpg to png', 'png to jpg', 'webp to jpg', 'jpg to webp', 'png to webp', 'format'],
  faq: [
    {
      q: 'What happens to transparency when converting to JPG?',
      a: 'JPG cannot store transparency, so transparent areas are filled with the background colour you choose (white by default).',
    },
    {
      q: 'Why can’t I create WebP files?',
      a: 'A few older browsers (mainly older Safari) cannot encode WebP. If that happens you will see a clear message; try another browser.',
    },
    PRIVACY_FAQ,
    OFFLINE_FAQ,
  ],
};
