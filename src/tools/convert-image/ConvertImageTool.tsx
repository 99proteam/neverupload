import { useId, useState } from 'react';
import { DropZone } from '../../components/DropZone';
import { IMAGE_ACCEPT, ImageBatchResults, ImageFileList } from '../../components/ImageBatch';
import { JobStatus } from '../../components/JobStatus';
import { QualitySlider } from '../../components/QualitySlider';
import { Segmented } from '../../components/Segmented';
import { ToolPage } from '../../components/ToolPage';
import { useImageItems } from '../../hooks/useImageItems';
import { useJob } from '../../hooks/useJob';
import { browserImageTransformer } from '../../lib/imageCodec';
import { finishImageBatch, type ImageBatchOutput } from '../../lib/imageBatchZip';
import { isOutputMime, type OutputMime } from '../../lib/imageFormat';
import type { ToolProps } from '../types';
import { meta } from './meta';
import { convertImages } from './process';

export default function ConvertImageTool({ page = meta, preset }: ToolProps) {
  const images = useImageItems();
  const job = useJob<ImageBatchOutput>();
  const [target, setTarget] = useState<OutputMime>(
    preset?.target && isOutputMime(preset.target) ? preset.target : 'image/jpeg',
  );
  const [quality, setQuality] = useState(90);
  const [background, setBackground] = useState('#ffffff');
  const bgId = useId();

  const run = () =>
    job.run('Converting images…', async (onProgress) =>
      finishImageBatch(
        await convertImages(
          images.inputs(),
          { target, quality: quality / 100, background },
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
          zipName="converted-images.zip"
        />
      ) : images.items.length === 0 ? (
        <div className="space-y-4">
          <DropZone
            accept={IMAGE_ACCEPT}
            multiple
            label="images"
            hint="JPG, PNG or WebP. Convert one image or a whole batch."
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
            label="Convert to"
            value={target}
            onChange={setTarget}
            disabled={job.busy}
            options={[
              { value: 'image/jpeg', label: 'JPG' },
              { value: 'image/png', label: 'PNG' },
              { value: 'image/webp', label: 'WebP' },
            ]}
          />
          {target !== 'image/png' && (
            <QualitySlider
              value={quality}
              onChange={setQuality}
              min={10}
              max={100}
              disabled={job.busy}
            />
          )}
          {target === 'image/jpeg' && (
            <div className="flex items-center gap-3">
              <input
                id={bgId}
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-slate-300 dark:border-slate-700"
                disabled={job.busy}
              />
              <label htmlFor={bgId} className="text-sm">
                Background for transparent areas
              </label>
            </div>
          )}
          <JobStatus state={job.state} onDismiss={job.reset} />
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={run} disabled={job.busy}>
              Convert {images.items.length} image{images.items.length === 1 ? '' : 's'}
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
