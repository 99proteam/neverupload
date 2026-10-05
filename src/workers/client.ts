import { UserFacingError } from '../lib/errors';
import { collectTransferables, type ProgressFn, type WorkerResponse } from './protocol';

export interface JobOptions {
  onProgress?: ProgressFn;
  signal?: AbortSignal;
}

/**
 * Run one operation in a fresh worker. Typed arrays in the payload are transferred
 * (zero-copy), so callers must not reuse them afterwards.
 */
export function runWorkerJob<R>(
  createWorker: () => Worker,
  op: string,
  payload: unknown,
  { onProgress, signal }: JobOptions = {},
): Promise<R> {
  return new Promise<R>((resolve, reject) => {
    const worker = createWorker();
    const finish = () => {
      worker.terminate();
      signal?.removeEventListener('abort', onAbort);
    };
    const onAbort = () => {
      finish();
      reject(new DOMException('Cancelled', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort);

    worker.addEventListener('message', (event: MessageEvent<WorkerResponse<R>>) => {
      const msg = event.data;
      if (msg.type === 'progress') {
        onProgress?.(msg.value);
      } else if (msg.type === 'result') {
        finish();
        resolve(msg.result);
      } else {
        finish();
        reject(msg.userFacing ? new UserFacingError(msg.message) : new Error(msg.message));
      }
    });
    worker.addEventListener('error', (event) => {
      finish();
      reject(new Error(event.message || 'The background worker crashed.'));
    });
    worker.postMessage({ op, payload }, collectTransferables(payload));
  });
}
