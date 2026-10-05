import { OFFLINE_FAQ } from '../faq.ts';
import type { ToolMeta } from '../types.ts';

export const meta: ToolMeta = {
  slug: 'qr-code-generator',
  name: 'QR Code Generator',
  category: 'other',
  icon: 'qr',
  summary: 'Turn text or a link into a QR code. Download PNG or SVG.',
  intro:
    'Create a QR code for a website link, Wi-Fi details, a phone number or any text. Customise colours and size, then download it as a PNG or a print-ready SVG. These QR codes are static: they never expire and contain no tracking redirects.',
  steps: [
    'Type or paste your link or text.',
    'Adjust the size, colours and error correction if you like.',
    'Check the live preview.',
    'Download the QR code as PNG or SVG.',
  ],
  title: 'Free QR code generator, PNG and SVG, no tracking | neverupload',
  description:
    'Create QR codes from text or URLs and download them as PNG or SVG. No sign-up, no tracking links, no expiry. Generated entirely in your browser.',
  keywords: [
    'qr',
    'barcode',
    'link',
    'url',
    'svg',
    'png',
    'generator',
    'qr code maker',
    'free qr code',
    'qr code for url',
    'wifi qr code',
    'qr code svg',
  ],
  faq: [
    {
      q: 'Do these QR codes expire?',
      a: 'Never. The QR code contains your text or link directly. There is no redirect service in between, so nothing can stop working or track your visitors.',
    },
    {
      q: 'PNG or SVG?',
      a: 'SVG scales to any size without getting blurry, which is ideal for print. PNG works everywhere, including documents and chat apps.',
    },
    {
      q: 'What is error correction?',
      a: 'Higher levels let the code still scan when part of it is damaged or covered, but make the code denser. "Medium" is a good default.',
    },
    {
      q: 'Is my text sent anywhere?',
      a: 'No. The QR code is generated in your browser. Your text never leaves your device.',
    },
    OFFLINE_FAQ,
  ],
};
