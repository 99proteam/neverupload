import { useCallback, useState } from 'react';
import { readFileBytes } from '../lib/files';
import { toUserMessage } from '../lib/errors';

export interface LoadedPdf {
  file: File;
  pageCount: number;
}

/** Load a single PDF and find out how many pages it has (via pdf.js, lazily imported). */
export function usePdfFile(onError: (message: string) => void) {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (file: File) => {
      setLoading(true);
      try {
        const { openPdf, closePdf } = await import('../lib/pdfRender');
        const doc = await openPdf(await readFileBytes(file));
        const pageCount = doc.numPages;
        await closePdf(doc);
        setPdf({ file, pageCount });
      } catch (err) {
        onError(toUserMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [onError],
  );

  const clear = useCallback(() => setPdf(null), []);
  return { pdf, loading, load, clear };
}
