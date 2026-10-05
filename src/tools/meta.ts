import { meta as mergePdf } from './merge-pdf/meta.ts';
import { meta as splitPdf } from './split-pdf/meta.ts';
import { meta as compressPdf } from './compress-pdf/meta.ts';
import { meta as organizePdf } from './organize-pdf/meta.ts';
import { meta as imagesToPdf } from './images-to-pdf/meta.ts';
import { meta as pdfToImages } from './pdf-to-images/meta.ts';
import { meta as compressImage } from './compress-image/meta.ts';
import { meta as resizeImage } from './resize-image/meta.ts';
import { meta as convertImage } from './convert-image/meta.ts';
import { meta as qrCode } from './qr-code-generator/meta.ts';
import { LANDING_METAS } from './landing.ts';
import type { ToolMeta } from './types.ts';

/** All tools, in the order they appear on the home page. */
export const TOOL_METAS: ToolMeta[] = [
  mergePdf,
  splitPdf,
  compressPdf,
  organizePdf,
  imagesToPdf,
  pdfToImages,
  compressImage,
  resizeImage,
  convertImage,
  qrCode,
];

/** Every page with its own URL: the tools plus keyword landing pages. */
export const ALL_PAGES: ToolMeta[] = [...TOOL_METAS, ...LANDING_METAS];

export { LANDING_METAS };

export const SITE = {
  name: 'neverupload',
  tagline: 'Your files never leave your device.',
  title: 'neverupload: free PDF and image tools that never upload your files',
  description:
    'Free, open-source PDF and image tools that run 100% in your browser. Merge, split, compress, convert and more. Your files never leave your device. Works offline.',
  repoUrl: 'https://github.com/99proteam/neverupload',
  sponsorUrl: 'https://buymeacoffee.com/99proteam',
} as const;

/** Social preview image for a page (landing pages share their tool's image). */
export function ogImagePath(slug: string): string {
  return `og/${slug}.png`;
}

/** Case-insensitive search over name, summary and keywords. */
export function searchTools(tools: ToolMeta[], query: string): ToolMeta[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return tools;
  return tools.filter((t) => {
    const haystack = [t.name, t.summary, t.category, ...t.keywords].join(' ').toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
