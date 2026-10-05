import { runImageJob } from '../workers';
import { transformWithCanvas } from '../workers/canvas';
import type { ImageTransformer, TransformResult } from './imageTransform';

const workerSupported =
  typeof Worker !== 'undefined' &&
  typeof OffscreenCanvas !== 'undefined' &&
  typeof OffscreenCanvas.prototype.convertToBlob === 'function';

/**
 * Browser image transformer: runs in a Web Worker with OffscreenCanvas when
 * available, otherwise on the main thread with a regular canvas.
 */
export const browserImageTransformer: ImageTransformer = (blob, options) =>
  workerSupported
    ? runImageJob<TransformResult>('transform', { blob, options })
    : transformWithCanvas(blob, options);
