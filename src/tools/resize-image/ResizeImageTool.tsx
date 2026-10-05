import { useId, useState } from 'react';
import { DropZone } from '../../components/DropZone';
import { IMAGE_ACCEPT, ImageBatchResults, ImageFileList } from '../../components/ImageBatch';
import { JobStatus } from '../../components/JobStatus';
import { Segmented } from '../../components/Segmented';
import { ToolPage } from '../../components/ToolPage';
import { useImageItems } from '../../hooks/useImageItems';
import { useJob } from '../../hooks/useJob';
import { browserImageTransformer } from '../../lib/imageCodec';
import { finishImageBatch, type ImageBatchOutput } from '../../lib/imageBatchZip';
import type { ResizeSpec } from '../../lib/imageTransform';
import type { OutputMime } from '../../lib/imageFormat';
import type { ToolProps } from '../types';
import { meta } from './meta';
import { resizeImages } from './process';

type Mode = 'pixels' | 'percent';

function parsePositive(value: string): number | null {
  const n = Number(value);
  return value.trim() && Number.isFinite(n) && n > 0 ? n : null;
}

export default function ResizeImageTool({ page = meta }: ToolProps) {
  const images = useImageItems();
  const job = useJob<ImageBatchOutput>();
  const [mode, setMode] = useState<Mode>('pixels');
  const [width, setWidth] = useState('1280');
  const [height, setHeight] = useState('');
  const [keepAspect, setKeepAspect] = useState(true);
  const [percent, setPercent] = useState('50');
  const [format, setFormat] = useState<'same' | OutputMime>('same');
  const ids = { w: useId(), h: useId(), p: useId(), k: useId() };

  const spec: ResizeSpec =
    mode === 'percent'
      ? { mode: 'percent', percent: parsePositive(percent) ?? 0 }
      : { mode: 'pixels', width: parsePositive(width), height: parsePositive(height), keepAspect };
  const valid =
    spec.mode === 'percent'
      ? spec.percent > 0 && spec.percent <= 1000
      : spec.mode === 'pixels' && (spec.width !== null || spec.height !== null);

  const run = () =>
    job.run('Resizing images…', async (onProgress) =>
      finishImageBatch(
        await resizeImages(
          images.inputs(),
          { resize: spec, format, quality: 0.9 },
          browserImageTransformer,
          onProgress,
        ),
      ),
    );

  const reset = () => {
    images.clear();
    job.reset();
  };

  return (
    <ToolPage meta={page}>
      {job.state.status === 'done' ? (
        <ImageBatchResults
          output={job.state.result}
          onReset={reset}
          zipName="resized-images.zip"
          showDimensions
        />
      ) : images.items.length === 0 ? (
        <div className="space-y-4">
          <DropZone
            accept={IMAGE_ACCEPT}
            multiple
            label="images"
            hint="JPG, PNG or WebP. All images get the same settings."
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
          <Segmented
            label="Resize by"
            value={mode}
            onChange={setMode}
            disabled={job.busy}
            options={[
              { value: 'pixels', label: 'Pixels' },
              { value: 'percent', label: 'Percent' },
            ]}
          />
          {mode === 'pixels' ? (
            <div className="space-y-3">
              <div className="grid max-w-md grid-cols-2 gap-3">
                <div>
                  <label htmlFor={ids.w} className="field-label">
                    Width (px)
                  </label>
                  <input
                    id={ids.w}
                    className="input"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    disabled={job.busy}
                  />
                </div>
                <div>
                  <label htmlFor={ids.h} className="field-label">
                    Height (px)
                  </label>
                  <input
                    id={ids.h}
                    className="input"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={height}
                    placeholder={keepAspect ? 'Auto' : ''}
                    onChange={(e) => setHeight(e.target.value)}
                    disabled={job.busy}
                  />
                </div>
              </div>
              <label htmlFor={ids.k} className="flex items-center gap-2 text-sm">
                <input
                  id={ids.k}
                  type="checkbox"
                  className="h-4 w-4 accent-brand-600"
                  checked={keepAspect}
                  onChange={(e) => setKeepAspect(e.target.checked)}
                  disabled={job.busy}
                />
                Keep aspect ratio
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {keepAspect
                  ? 'Leave one side empty to calculate it automatically. With both filled in, images fit inside that box.'
                  : 'Images will be stretched to exactly this size.'}
              </p>
            </div>
          ) : (
            <div className="max-w-40">
              <label htmlFor={ids.p} className="field-label">
                Scale (%)
              </label>
              <input
                id={ids.p}
                className="input"
                type="number"
                min={1}
                max={1000}
                inputMode="numeric"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                disabled={job.busy}
              />
            </div>
          )}
          <Segmented
            label="Output format"
            value={format}
            onChange={setFormat}
            disabled={job.busy}
            options={[
              { value: 'same', label: 'Same as input' },
              { value: 'image/jpeg', label: 'JPG' },
              { value: 'image/png', label: 'PNG' },
              { value: 'image/webp', label: 'WebP' },
            ]}
          />
          <JobStatus state={job.state} onDismiss={job.reset} />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={run}
              disabled={job.busy || !valid}
            >
              Resize {images.items.length} image{images.items.length === 1 ? '' : 's'}
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
