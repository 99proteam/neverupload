import { UserFacingError } from '../lib/errors';
import {
  collectTransferables,
  type ProgressFn,
  type WorkerRequest,
  type WorkerResponse,
} from './protocol';

type Handler = (payload: never, onProgress: ProgressFn) => Promise<unknown>;

/** Wire up a worker's message handler to a map of operations. */
export function exposeWorker(handlers: Record<string, Handler>): void {
  const post = (msg: WorkerResponse, transfer: Transferable[] = []) =>
    (self as unknown as Worker).postMessage(msg, transfer);

  self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
    const { op, payload } = event.data;
    const handler = handlers[op];
    try {
      if (!handler) throw new Error(`Unknown operation: ${op}`);
      let last = 0;
      const result = await handler(payload as never, (value) => {
        // Throttle progress messages a little; the UI doesn't need every tick.
        if (value >= 1 || value - last >= 0.01) {
          last = value;
          post({ type: 'progress', value });
        }
      });
      post({ type: 'result', result }, collectTransferables(result));
    } catch (err) {
      post({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
        userFacing: err instanceof UserFacingError,
      });
    }
  });
}
