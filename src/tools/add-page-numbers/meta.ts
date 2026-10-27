import { OFFLINE_FAQ, PRIVACY_FAQ } from '../faq.ts';
import type { ToolMeta } from '../types.ts';

export const meta: ToolMeta = {
  slug: 'add-page-numbers',
  name: 'Add Page Numbers',
  category: 'pdf',
  icon: 'pageNumbers',
  summary: 'Number the pages of a PDF: position, style and starting number.',
  intro:
    'Add page numbers to a PDF in seconds. Put them at the bottom or top, on the left, center or right, choose a style such as “Page 3 of 12”, start from any number and skip the cover page. Numbering happens in your browser, so contracts, theses and reports stay private.',
  steps: [
    'Drop a PDF into the box, or tap “Choose a PDF file”.',
    'Pick where the numbers go and how they look.',
    'Optionally set the starting number or skip the first page.',
    'Press “Add page numbers” and download the numbered PDF.',
  ],
  title: 'Add page numbers to a PDF, free and private | neverupload',
  description:
    'Number PDF pages at the top or bottom, with styles like “Page 1 of 10”, a custom start and an option to skip the cover. Runs in your browser; nothing is uploaded.',
  keywords: [
    'number',
    'numbering',
    'paginate',
    'pagination',
    'footer',
    'header',
    'add page numbers to pdf',
    'number pdf pages',
    'pdf page numbering',
    'page x of y',
    'bates',
  ],
  faq: [
    {
      q: 'Can I leave the cover page without a number?',
      a: 'Yes. Tick “Skip the first page” and numbering starts on page two. Combine it with “Start at” to begin from any number you like.',
    },
    {
      q: 'Does it work with rotated or landscape pages?',
      a: 'Yes. The number is placed relative to the page as you see it, so it stays upright and in the corner you picked on portrait, landscape and rotated pages.',
    },
    {
      q: 'Is the rest of my PDF changed?',
      a: 'No. Text stays selectable and links, bookmarks and images are kept. Only the page number text is added on top of each page.',
    },
    PRIVACY_FAQ,
    OFFLINE_FAQ,
  ],
};
