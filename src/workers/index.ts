import { runWorkerJob, type JobOptions } from './client';

/**
 * Typed entry points to the background workers. Vite bundles each worker
 * separately; `new URL(..., import.meta.url)` keeps them same-origin and offline-cacheable.
 */
const createPdfWorker = () =>
  new Worker(new URL('./pdf.worker.ts', import.meta.url), { type: 'module', name: 'pdf-worker' });

const createImageWorker = () =>
  new Worker(new URL('./image.worker.ts', import.meta.url), {
    type: 'module',
    name: 'image-worker',
  });

export function runPdfJob<R>(op: string, payload: unknown, options?: JobOptions): Promise<R> {
  return runWorkerJob<R>(createPdfWorker, op, payload, options);
}

export function runImageJob<R>(op: string, payload: unknown, options?: JobOptions): Promise<R> {
  return runWorkerJob<R>(createImageWorker, op, payload, options);
}
