import { useEffect, useState } from 'react';
import { DropZone } from '../../components/DropZone';
import { IMAGE_ACCEPT, ImageBatchResults, ImageFileList } from '../../components/ImageBatch';
import { JobStatus } from '../../components/JobStatus';
import { QualitySlider } from '../../components/QualitySlider';
import { Segmented } from '../../components/Segmented';
import { ToolPage } from '../../components/ToolPage';
import { useImageItems } from '../../hooks/useImageItems';
import { useJob } from '../../hooks/useJob';
import { toUserMessage } from '../../lib/errors';
import { formatBytes, percentSaved } from '../../lib/format';
import { browserImageTransformer } from '../../lib/imageCodec';
import { finishImageBatch, type ImageBatchOutput } from '../../lib/imageBatchZip';
import { isOutputMime, type OutputMime } from '../../lib/imageFormat';
import type { ToolProps } from '../types';
import { meta } from './meta';
import { compressImages, compressionPlan, type CompressImageOptions } from './process';

type FormatChoice = 'same' | OutputMime;

/** Re-encode the first image whenever the settings change, to preview the result size. */
function useLivePreview(file: File | undefined, options: CompressImageOptions) {
  const [preview, setPreview] = useState<{ size: number; url: string } | { error: string } | null>(
    null,
  );
  const { quality, format } = options;

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    let url: string | null = null;
    const timer = setTimeout(async () => {
      try {
        const out = await browserImageTransformer(file, compressionPlan(file, { quality, format }));
        if (cancelled) return;
        url = URL.createObjectURL(out.blob);
        setPreview({ size: out.blob.size, url });
      } catch (err) {
        if (!cancelled) setPreview({ error: toUserMessage(err) });
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (url) URL.revokeObjectURL(url);
    };
  }, [file, quality, format]);

  return file ? preview : null;
}

export default function CompressImageTool({ page = meta, preset }: ToolProps) {
  const images = useImageItems();
  const job = useJob<ImageBatchOutput>();
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState<FormatChoice>(
    preset?.format && isOutputMime(preset.format) ? preset.format : 'same',
  );
  const first = images.items[0]?.file;
  const preview = useLivePreview(first, { quality: quality / 100, format });

  const run = () =>
    job.run('Compressing images…', async (onProgress) =>
      finishImageBatch(
        await compressImages(
          images.inputs(),
          { quality: quality / 100, format },
          browserImageTransformer,
          onProgress,
        ),
      ),
    );

  const reset = () => {
    images.clear();
    job.reset();
  };

  const hasPng = images.items.some((i) => i.file.type === 'image/png');

  return (
    <ToolPage meta={page}>
      {job.state.status === 'done' ? (
        <ImageBatchResults
          output={job.state.result}
          onReset={reset}
          zipName="compressed-images.zip"
          extra={
            <button type="button" className="btn-secondary" onClick={() => job.reset()}>
              Try other settings
            </button>
          }
        />
      ) : images.items.length === 0 ? (
        <div className="space-y-4">
          <DropZone
            accept={IMAGE_ACCEPT}
            multiple
            label="images"
            hint="JPG, PNG or WebP. Add as many as you like."
            onFiles={(f) => {
              job.reset();
              images.add(f);
            }}
            onError={job.fail}
          />
          <JobStatus state={job.state} onDismiss={job.reset} />
        </div>
      ) : (
        <div className="space-y-5">
          <ImageFileList items={images.items} onRemove={images.remove} disabled={job.busy} />
          <DropZone
            accept={IMAGE_ACCEPT}
            multiple
            compact
            label="images"
            onFiles={images.add}
            onError={job.fail}
            disabled={job.busy}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <QualitySlider
              value={quality}
              onChange={setQuality}
              min={5}
              max={100}
              disabled={job.busy}
            />
            <Segmented
              label="Output format"
              value={format}
              onChange={setFormat}
              disabled={job.busy}
              options={[
                { value: 'same', label: 'Same as input' },
                { value: 'image/jpeg', label: 'JPG' },
                { value: 'image/webp', label: 'WebP' },
              ]}
            />
          </div>
          {hasPng && format === 'same' && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tip: PNG is lossless and barely shrinks. Choose WebP or JPG for much smaller files.
            </p>
          )}
          {first && preview && (
            <div
              className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800"
              aria-live="polite"
            >
              {'error' in preview ? (
                <span className="text-red-700 dark:text-red-400">{preview.error}</span>
              ) : (
                <div className="flex items-center gap-3">
                  <img
                    src={preview.url}
                    alt="Preview at the chosen quality"
                    className="h-16 w-16 rounded object-cover"
                  />
                  <p>
                    <span className="font-medium">Preview ({first.name}):</span>{' '}
                    {formatBytes(first.size)} → {formatBytes(preview.size)}{' '}
                    {preview.size < first.size ? (
                      <span className="text-brand-700 dark:text-brand-400">
                        (−{percentSaved(first.size, preview.size)}%)
                      </span>
                    ) : (
                      <span className="text-slate-500">(no saving, original will be kept)</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
          <JobStatus state={job.state} onDismiss={job.reset} />
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={run} disabled={job.busy}>
              Compress {images.items.length} image{images.items.length === 1 ? '' : 's'}
            </button>
            <button type="button" className="btn-secondary" onClick={reset} disabled={job.busy}>
              Clear
            </button>
          </div>
        </div>
      )}
    </ToolPage>
  );
}
