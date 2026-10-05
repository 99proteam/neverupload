import { PDFDocument } from 'pdf-lib';
import { UserFacingError } from '../../lib/errors';
import { baseName } from '../../lib/format';
import { loadPdfDocument, SAVE_OPTIONS } from '../../lib/pdf';
import type { ProgressFn } from '../../workers/protocol';

/**
 * Parse a page range string such as "1-3, 5, 8-10" into groups of zero-based page
 * indices. Each comma-separated part becomes one group (one output file).
 * Open ranges like "8-" (page 8 to the end) are allowed.
 */
export function parsePageRanges(input: string, pageCount: number): number[][] {
  const parts = input
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0)
    throw new UserFacingError('Enter at least one page or range, e.g. 1-3, 5.');

  return parts.map((part) => {
    const match = /^(\d+)\s*(?:[-–]\s*(\d*))?$/.exec(part);
    if (!match) throw new UserFacingError(`"${part}" is not a valid page or range.`);
    const start = Number(match[1]);
    const isRange = part.includes('-') || part.includes('–');
    const end = isRange ? (match[2] ? Number(match[2]) : pageCount) : start;
    if (start < 1 || end < 1) throw new UserFacingError('Page numbers start at 1.');
    if (start > pageCount || end > pageCount) {
      throw new UserFacingError(
        `"${part}" is outside this document — it has ${pageCount} page${pageCount === 1 ? '' : 's'}.`,
      );
    }
    if (end < start) throw new UserFacingError(`"${part}" goes backwards. Use ${end}-${start}.`);
    return Array.from({ length: end - start + 1 }, (_, i) => start - 1 + i);
  });
}

/** One group per page — used for "split every page". */
export function everyPageGroups(pageCount: number): number[][] {
  return Array.from({ length: pageCount }, (_, i) => [i]);
}

/** File name for a group, e.g. "report_pages-1-3.pdf" or "report_page-5.pdf". */
export function splitFileName(sourceName: string, group: number[]): string {
  const first = (group[0] ?? 0) + 1;
  const last = (group[group.length - 1] ?? 0) + 1;
  const label = group.length === 1 ? `page-${first}` : `pages-${first}-${last}`;
  return `${baseName(sourceName)}_${label}.pdf`;
}

/** Create one PDF per group of page indices. */
export async function splitPdf(
  data: Uint8Array,
  groups: number[][],
  onProgress?: ProgressFn,
  name?: string,
): Promise<Uint8Array[]> {
  const src = await loadPdfDocument(data, name);
  const count = src.getPageCount();
  const outputs: Uint8Array[] = [];
  for (const [i, group] of groups.entries()) {
    if (group.length === 0) throw new UserFacingError('A page range is empty.');
    if (group.some((p) => p < 0 || p >= count)) throw new UserFacingError('Page out of range.');
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(src, group);
    for (const page of pages) doc.addPage(page);
    outputs.push(await doc.save(SAVE_OPTIONS));
    onProgress?.((i + 1) / groups.length);
  }
  return outputs;
}
