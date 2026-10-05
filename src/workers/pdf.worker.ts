/// <reference lib="webworker" />
import { detectImageFormat } from '../lib/imageFormat';
import { mergePdfs, type PdfInput } from '../tools/merge-pdf/process';
import { splitPdf } from '../tools/split-pdf/process';
import { organizePdf, type PageInstruction } from '../tools/organize-pdf/process';
import {
  imagesToPdf,
  type ImageInput,
  type ImagesToPdfOptions,
} from '../tools/images-to-pdf/process';
import { exposeWorker } from './host';
import { normalizeToPdfImage } from './canvas';

exposeWorker({
  merge: ({ files }: { files: PdfInput[] }, onProgress) => mergePdfs(files, onProgress),

  split: ({ file, groups }: { file: PdfInput; groups: number[][] }, onProgress) =>
    splitPdf(file.data, groups, onProgress, file.name),

  organize: ({ file, layout }: { file: PdfInput; layout: PageInstruction[] }, onProgress) =>
    organizePdf(file.data, layout, onProgress, file.name),

  imagesToPdf: (
    { images, options }: { images: ImageInput[]; options: ImagesToPdfOptions },
    onProgress,
  ) =>
    imagesToPdf(
      images,
      options,
      // Rotated JPEGs stay JPEG; WebP/GIF/BMP become lossless PNG.
      (img) => normalizeToPdfImage(img.data, detectImageFormat(img.data) === 'jpeg'),
      onProgress,
    ),
});
