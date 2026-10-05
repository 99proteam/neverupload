import { PDFDocument } from 'pdf-lib';
import { UserFacingError } from './errors';

/** Load a PDF with pdf-lib, turning common failures into friendly errors. */
export async function loadPdfDocument(data: Uint8Array, name = 'This file'): Promise<PDFDocument> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(data, { ignoreEncryption: true, updateMetadata: false });
  } catch {
    throw new UserFacingError(`"${name}" is not a valid PDF or is damaged.`);
  }
  if (doc.isEncrypted) {
    throw new UserFacingError(
      `"${name}" is password-protected. Remove the password first, then try again.`,
    );
  }
  return doc;
}

/** Save options that keep output small without slowing things down much. */
export const SAVE_OPTIONS = { useObjectStreams: true } as const;
