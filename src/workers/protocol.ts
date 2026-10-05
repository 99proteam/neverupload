/**
 * Tiny typed RPC between the UI thread and Web Workers.
 * One worker is spawned per job and terminated afterwards, so jobs never share
 * state and memory is released as soon as a job is done.
 */
export type ProgressFn = (fraction: number) => void;

export interface WorkerRequest<P = unknown> {
  op: string;
  payload: P;
}

export type WorkerResponse<R = unknown> =
  | { type: 'progress'; value: number }
  | { type: 'result'; result: R }
  | { type: 'error'; message: string; userFacing: boolean };

/** Collect ArrayBuffers inside a value so they can be transferred instead of copied. */
export function collectTransferables(value: unknown, out: Transferable[] = []): Transferable[] {
  if (value instanceof ArrayBuffer) {
    if (!out.includes(value)) out.push(value);
  } else if (ArrayBuffer.isView(value)) {
    const buffer = value.buffer;
    if (
      buffer instanceof ArrayBuffer &&
      !out.includes(buffer) &&
      value.byteLength === buffer.byteLength
    ) {
      out.push(buffer);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) collectTransferables(item, out);
  } else if (value && typeof value === 'object' && !(value instanceof Blob)) {
    for (const item of Object.values(value)) collectTransferables(item, out);
  }
  return out;
}
