import type { ImageJobResult } from './imageTransform';
import { bytesToBlob } from './download';
import { zipFiles } from './zip';

export interface ImageBatchOutput {
  results: ImageJobResult[];
  /** Present when more than one file succeeded. */
  zip?: Blob;
}

/** Bundle the successful results into a zip when there is more than one. */
export async function finishImageBatch(results: ImageJobResult[]): Promise<ImageBatchOutput> {
  const ok = results.filter((r): r is ImageJobResult & { blob: Blob } => Boolean(r.blob));
  if (ok.length < 2) return { results };
  const files = await Promise.all(
    ok.map(async (r) => ({ name: r.name, data: new Uint8Array(await r.blob.arrayBuffer()) })),
  );
  return { results, zip: bytesToBlob(zipFiles(files), 'application/zip') };
}
