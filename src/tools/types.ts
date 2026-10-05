export type ToolCategory = 'pdf' | 'image' | 'other';

export type ToolIconName =
  | 'merge'
  | 'split'
  | 'compress'
  | 'organize'
  | 'imagesToPdf'
  | 'pdfToImages'
  | 'imageCompress'
  | 'resize'
  | 'convert'
  | 'qr';

export interface FaqItem {
  q: string;
  a: string;
}

/** Everything about a tool except its React UI. Plain data, safe to import from Node. */
export interface ToolMeta {
  /** URL path segment, e.g. "merge-pdf". */
  slug: string;
  name: string;
  category: ToolCategory;
  icon: ToolIconName;
  /** One line shown on the tool card. */
  summary: string;
  /** <title> of the page. */
  title: string;
  /** <meta name="description">. Keep it under ~160 characters. */
  description: string;
  /** Extra words that help the home-page search. */
  keywords: string[];
  /** "How it works" questions and answers shown on the page. */
  faq: FaqItem[];
}
