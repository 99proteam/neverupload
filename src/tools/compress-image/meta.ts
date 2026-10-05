import { OFFLINE_FAQ, PRIVACY_FAQ } from '../faq.ts';
import type { ToolMeta } from '../types.ts';

export const meta: ToolMeta = {
  slug: 'compress-image',
  name: 'Compress Image',
  category: 'image',
  icon: 'imageCompress',
  summary: 'Make JPG, PNG and WebP images smaller with a quality slider.',
  title: 'Compress JPG, PNG and WebP images, free and private | neverupload',
  description:
    'Reduce image file size with a quality slider and live size preview. Batch compress JPG, PNG and WebP in your browser; images never leave your device.',
  keywords: ['reduce', 'shrink', 'optimize', 'smaller', 'jpg', 'png', 'webp', 'photo'],
  faq: [
    {
      q: 'What quality should I pick?',
      a: 'Around 70–80% usually looks the same as the original at a fraction of the size. Watch the live preview to find the right balance.',
    },
    {
      q: 'Why does my PNG barely shrink?',
      a: 'PNG is a lossless format, so a quality setting has little effect. Choose WebP or JPG as the output format for big savings.',
    },
    PRIVACY_FAQ,
    OFFLINE_FAQ,
  ],
};
