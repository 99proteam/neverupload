import { OFFLINE_FAQ, PRIVACY_FAQ } from '../faq.ts';
import type { ToolMeta } from '../types.ts';

export const meta: ToolMeta = {
  slug: 'resize-image',
  name: 'Resize Image',
  category: 'image',
  icon: 'resize',
  summary: 'Resize images by pixels or percent, keeping the aspect ratio.',
  intro:
    'Resize images to exact pixel dimensions or by percentage, without stretching them. Make photos the right size for passports, profile pictures, websites or online forms. Resize a whole batch at once; everything happens in your browser.',
  steps: [
    'Drop one or more images into the box.',
    'Choose “Pixels” and enter a width and/or height, or choose “Percent”.',
    'Keep “Keep aspect ratio” ticked to avoid stretching.',
    'Press “Resize” and download the result.',
  ],
  title: 'Resize images by pixels or percent, free and private | neverupload',
  description:
    'Resize JPG, PNG and WebP images by exact pixels or percentage while keeping the aspect ratio. Batch support. Runs in your browser; nothing is uploaded.',
  keywords: [
    'scale',
    'dimensions',
    'shrink',
    'enlarge',
    'width',
    'height',
    'pixels',
    'photo',
    'image resizer',
    'resize photo',
    'change image size',
    'resize image to pixels',
    'passport photo size',
  ],
  faq: [
    {
      q: 'What does "keep aspect ratio" do?',
      a: 'It stops the image from being stretched. Enter only a width or only a height and the other side is calculated. If you enter both, the image fits inside that box.',
    },
    {
      q: 'Can I resize many images at once?',
      a: 'Yes. Add as many images as you like; they are all resized with the same settings and downloaded as a zip.',
    },
    PRIVACY_FAQ,
    OFFLINE_FAQ,
  ],
};
