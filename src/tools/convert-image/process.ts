import { UserFacingError } from '../../lib/errors';
import type { OutputMime } from '../../lib/imageFormat';
import {
  runImageBatch,
  type ImageFileInput,
  type ImageJobResult,
  type ImageTransformer,
} from '../../lib/imageTransform';
import type { ProgressFn } from '../../workers/protocol';

export interface ConvertImageOptions {
  target: OutputMime;
  /** 0..1, used for JPG and WebP. */
  quality: number;
  /** Colour that replaces transparency when converting to JPG. */
  background: string;
}

export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

export function convertImages(
  files: ImageFileInput[],
  options: ConvertImageOptions,
  transform: ImageTransformer,
  onProgress?: ProgressFn,
): Promise<ImageJobResult[]> {
  if (files.length === 0) throw new UserFacingError('Add at least one image.');
  const background = isValidHexColor(options.background) ? options.background : '#ffffff';
  return runImageBatch(
    files,
    () => ({
      options: {
        mime: options.target,
        quality: options.quality,
        resize: { mode: 'none' },
        background,
      },
      preferSmaller: false,
    }),
    transform,
    onProgress,
  );
}
