import { toUserMessage } from './errors';
import { OUTPUT_FORMATS, type OutputMime } from './imageFormat';
import { withExtension } from './format';
import type { ProgressFn } from '../workers/protocol';

export type ResizeSpec =
  | { mode: 'none' }
  | { mode: 'percent'; percent: number }
  | { mode: 'pixels'; width: number | null; height: number | null; keepAspect: boolean };

export interface TransformOptions {
  mime: OutputMime;
  /** 0..1, ignored for PNG. */
  quality: number;
  resize: ResizeSpec;
  /** Fill colour behind transparent pixels when the output has no alpha (JPG). */
  background: string;
}

export interface TransformResult {
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Decode → (resize) → encode one image. The browser implementation runs in a Web
 * Worker with OffscreenCanvas (see lib/imageCodec.ts); tests inject a fake.
 */
export type ImageTransformer = (blob: Blob, options: TransformOptions) => Promise<TransformResult>;

export interface ImageFileInput {
  name: string;
  type: string;
  size: number;
  blob: Blob;
}

export interface ImageJobResult {
  originalName: string;
  originalSize: number;
  name: string;
  /** Missing when this file failed. */
  blob?: Blob;
  size: number;
  width?: number;
  height?: number;
  /** The processed file was not smaller, so the original was kept. */
  keptOriginal?: boolean;
  error?: string;
}

export interface ImagePlan {
  options: TransformOptions;
  /** If true and the output is not smaller (same format), return the original file. */
  preferSmaller: boolean;
}

/** Output file name for the given input and output format. */
export function outputName(inputName: string, mime: OutputMime): string {
  return withExtension(inputName, OUTPUT_FORMATS[mime].ext);
}

/** Largest canvas most browsers can allocate safely (Safari is the strictest). */
export const MAX_CANVAS_PIXELS = 16_777_216 * 4; // ~67 megapixels
export const MAX_CANVAS_SIDE = 16_384;

export function assertCanvasSize(width: number, height: number): void {
  if (width < 1 || height < 1) throw new Error('The output image would be empty.');
  if (width > MAX_CANVAS_SIDE || height > MAX_CANVAS_SIDE || width * height > MAX_CANVAS_PIXELS) {
    throw new Error(
      `${width}×${height} px is larger than your browser can handle. Choose a smaller size.`,
    );
  }
}

/** Process a batch of images one at a time; one bad file doesn't stop the rest. */
export async function runImageBatch(
  files: ImageFileInput[],
  plan: (file: ImageFileInput) => ImagePlan,
  transform: ImageTransformer,
  onProgress?: ProgressFn,
): Promise<ImageJobResult[]> {
  const results: ImageJobResult[] = [];
  for (const [i, file] of files.entries()) {
    const { options, preferSmaller } = plan(file);
    const name = outputName(file.name, options.mime);
    try {
      const out = await transform(file.blob, options);
      const sameFormat = normalizeMime(file.type) === options.mime;
      if (preferSmaller && sameFormat && out.blob.size >= file.size) {
        results.push({
          originalName: file.name,
          originalSize: file.size,
          name: file.name,
          blob: file.blob,
          size: file.size,
          width: out.width,
          height: out.height,
          keptOriginal: true,
        });
      } else {
        results.push({
          originalName: file.name,
          originalSize: file.size,
          name,
          blob: out.blob,
          size: out.blob.size,
          width: out.width,
          height: out.height,
        });
      }
    } catch (err) {
      results.push({
        originalName: file.name,
        originalSize: file.size,
        name,
        size: 0,
        error: toUserMessage(err),
      });
    }
    onProgress?.((i + 1) / files.length);
  }
  return results;
}

export function normalizeMime(type: string): string {
  return type === 'image/jpg' || type === 'image/pjpeg' ? 'image/jpeg' : type;
}
