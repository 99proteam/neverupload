import { UserFacingError } from '../../lib/errors';
import { outputMimeFor, type OutputMime } from '../../lib/imageFormat';
import {
  runImageBatch,
  type ImageFileInput,
  type ImageJobResult,
  type ImageTransformer,
  type TransformOptions,
} from '../../lib/imageTransform';
import type { ProgressFn } from '../../workers/protocol';

export interface CompressImageOptions {
  /** 0.05 – 1 */
  quality: number;
  /** "same" keeps each file's format. PNG is lossless, so it only shrinks a little. */
  format: 'same' | OutputMime;
}

export function compressionPlan(
  file: Pick<ImageFileInput, 'type'>,
  options: CompressImageOptions,
): TransformOptions {
  return {
    mime: options.format === 'same' ? outputMimeFor(file.type) : options.format,
    quality: Math.min(1, Math.max(0.05, options.quality)),
    resize: { mode: 'none' },
    background: '#ffffff',
  };
}

export function compressImages(
  files: ImageFileInput[],
  options: CompressImageOptions,
  transform: ImageTransformer,
  onProgress?: ProgressFn,
): Promise<ImageJobResult[]> {
  if (files.length === 0) throw new UserFacingError('Add at least one image.');
  return runImageBatch(
    files,
    (file) => ({ options: compressionPlan(file, options), preferSmaller: true }),
    transform,
    onProgress,
  );
}
