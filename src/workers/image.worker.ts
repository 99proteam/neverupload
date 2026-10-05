/// <reference lib="webworker" />
import type { TransformOptions } from '../lib/imageTransform';
import { exposeWorker } from './host';
import { transformWithCanvas } from './canvas';

exposeWorker({
  transform: async ({ blob, options }: { blob: Blob; options: TransformOptions }) =>
    transformWithCanvas(blob, options),
});
