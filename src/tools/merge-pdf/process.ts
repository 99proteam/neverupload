import { PDFDocument } from 'pdf-lib';
import { UserFacingError } from '../../lib/errors';
import { loadPdfDocument, SAVE_OPTIONS } from '../../lib/pdf';
import type { ProgressFn } from '../../workers/protocol';

export interface PdfInput {
  name: string;
  data: Uint8Array;
}

/** Merge PDFs in the given order into a single document. */
export async function mergePdfs(files: PdfInput[], onProgress?: ProgressFn): Promise<Uint8Array> {
  if (files.length < 2) throw new UserFacingError('Add at least two PDF files to merge.');
  const out = await PDFDocument.create();
  for (const [i, file] of files.entries()) {
    const src = await loadPdfDocument(file.data, file.name);
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const page of pages) out.addPage(page);
    onProgress?.(((i + 1) / files.length) * 0.9);
  }
  const bytes = await out.save(SAVE_OPTIONS);
  onProgress?.(1);
  return bytes;
}
