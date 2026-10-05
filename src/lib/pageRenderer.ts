/** A rendered PDF page, encoded as an image. */
export interface RenderedPage {
  data: Uint8Array;
  /** Pixel size of the rendered image. */
  width: number;
  height: number;
  /** Size of the original page in PDF points. */
  pageWidth: number;
  pageHeight: number;
}

export interface RenderRequest {
  /** Zero-based page index. */
  pageIndex: number;
  /** Output resolution in dots per inch (72 = 1:1 with PDF points). */
  dpi: number;
  mime: 'image/jpeg' | 'image/png';
  /** 0..1, only used for JPEG. */
  quality: number;
}

/**
 * Renders a page of an already-opened PDF. Implemented with pdf.js + canvas in the
 * browser (see lib/pdfRender.ts); tests pass a fake implementation.
 */
export type PageRenderer = (request: RenderRequest) => Promise<RenderedPage>;
