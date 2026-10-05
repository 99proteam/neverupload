import { OFFLINE_FAQ, PRIVACY_FAQ } from '../faq.ts';
import type { ToolMeta } from '../types.ts';

export const meta: ToolMeta = {
  slug: 'compress-image',
  name: 'Compress Image',
  category: 'image',
  icon: 'imageCompress',
  summary: 'Make JPG, PNG and WebP images smaller with a quality slider.',
  intro:
    'Compress JPG, PNG and WebP images to make them smaller for websites, email and forms that have an upload limit. Move the quality slider and see the new file size live before you download. Compress many photos at once, privately, on your own device.',
  steps: [
    'Drop one or more images into the box.',
    'Move the quality slider and watch the live size preview.',
    'Optionally convert to WebP or JPG for bigger savings.',
    'Press “Compress” and download your images (or a zip).',
  ],
  title: 'Compress JPG, PNG and WebP images, free and private | neverupload',
  description:
    'Reduce image file size with a quality slider and live size preview. Batch compress JPG, PNG and WebP in your browser; images never leave your device.',
  keywords: [
    'reduce',
    'shrink',
    'optimize',
    'smaller',
    'jpg',
    'png',
    'webp',
    'photo',
    'image compressor',
    'reduce image size',
    'compress jpeg',
    'compress png',
    'compress photo to 100kb',
  ],
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
