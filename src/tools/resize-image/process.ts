import { UserFacingError } from '../../lib/errors';
import { outputMimeFor, type OutputMime } from '../../lib/imageFormat';
import {
  runImageBatch,
  type ImageFileInput,
  type ImageJobResult,
  type ImageTransformer,
  type ResizeSpec,
} from '../../lib/imageTransform';
import type { ProgressFn } from '../../workers/protocol';

/** Compute the output size for an image of `width`×`height` pixels. */
export function computeResizeDimensions(
  width: number,
  height: number,
  spec: ResizeSpec,
): { width: number; height: number } {
  if (spec.mode === 'none') return { width, height };
  if (spec.mode === 'percent') {
    if (!(spec.percent > 0)) throw new UserFacingError('Percentage must be greater than 0.');
    const f = spec.percent / 100;
    return {
      width: Math.max(1, Math.round(width * f)),
      height: Math.max(1, Math.round(height * f)),
    };
  }
  const w = spec.width && spec.width > 0 ? Math.round(spec.width) : null;
  const h = spec.height && spec.height > 0 ? Math.round(spec.height) : null;
  if (w === null && h === null) throw new UserFacingError('Enter a width, a height, or both.');
  if (!spec.keepAspect) return { width: w ?? width, height: h ?? height };
  if (w !== null && h !== null) {
    // Fit inside the box while keeping the aspect ratio.
    const scale = Math.min(w / width, h / height);
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
    };
  }
  if (w !== null) return { width: w, height: Math.max(1, Math.round((height * w) / width)) };
  return { width: Math.max(1, Math.round((width * (h as number)) / height)), height: h as number };
}

export interface ResizeOptions {
  resize: ResizeSpec;
  /** "same" keeps each file's format. */
  format: 'same' | OutputMime;
  quality: number;
}

export function resizeImages(
  files: ImageFileInput[],
  options: ResizeOptions,
  transform: ImageTransformer,
  onProgress?: ProgressFn,
): Promise<ImageJobResult[]> {
  if (files.length === 0) throw new UserFacingError('Add at least one image.');
  return runImageBatch(
    files,
    (file) => ({
      options: {
        mime: options.format === 'same' ? outputMimeFor(file.type) : options.format,
        quality: options.quality,
        resize: options.resize,
        background: '#ffffff',
      },
      preferSmaller: false,
    }),
    transform,
    onProgress,
  );
}
