import { Download, RotateCcw } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { DeviceBadge } from '../../components/DeviceBadge';
import { ErrorAlert } from '../../components/ErrorAlert';
import { Segmented } from '../../components/Segmented';
import { ToolPage } from '../../components/ToolPage';
import { bytesToBlob, downloadBlob } from '../../lib/download';
import { toUserMessage } from '../../lib/errors';
import { meta } from './meta';
import {
  dataUrlToBytes,
  DEFAULT_QR_OPTIONS,
  generateQrPngDataUrl,
  generateQrSvg,
  type ErrorCorrection,
  type QrOptions,
} from './process';

export default function QrCodeTool() {
  const [text, setText] = useState('');
  const [options, setOptions] = useState<QrOptions>(DEFAULT_QR_OPTIONS);
  const [generated, setSvg] = useState<string | null>(null);
  const [qrError, setError] = useState<string | null>(null);
  // With no text there is nothing to show, whatever the last generation produced.
  const svg = text.trim() ? generated : null;
  const error = text.trim() ? qrError : null;
  const ids = { text: useId(), size: useId(), dark: useId(), light: useId(), margin: useId() };
  const set = <K extends keyof QrOptions>(key: K, value: QrOptions[K]) =>
    setOptions((o) => ({ ...o, [key]: value }));

  useEffect(() => {
    if (!text.trim()) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      generateQrSvg(text, options)
        .then((s) => {
          if (cancelled) return;
          setSvg(s);
          setError(null);
        })
        .catch((err) => {
          if (cancelled) return;
          setSvg(null);
          setError(toUserMessage(err));
        });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, options]);

  const downloadPng = async () => {
    try {
      const url = await generateQrPngDataUrl(text, options);
      downloadBlob(bytesToBlob(dataUrlToBytes(url), 'image/png'), 'qr-code.png');
    } catch (err) {
      setError(toUserMessage(err));
    }
  };

  const downloadSvg = () => {
    if (svg) downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), 'qr-code.svg');
  };

  return (
    <ToolPage meta={meta}>
      <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,280px)]">
        <div className="space-y-4">
          <div>
            <label htmlFor={ids.text} className="field-label">
              Text or URL
            </label>
            <textarea
              id={ids.text}
              className="input min-h-28"
              placeholder="https://example.com"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={ids.size} className="field-label">
                PNG size (px)
              </label>
              <select
                id={ids.size}
                className="input"
                value={options.size}
                onChange={(e) => set('size', Number(e.target.value))}
              >
                {[256, 512, 1024, 2048].map((s) => (
                  <option key={s} value={s}>
                    {s} × {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={ids.margin} className="field-label">
                Quiet zone (margin)
              </label>
              <select
                id={ids.margin}
                className="input"
                value={options.margin}
                onChange={(e) => set('margin', Number(e.target.value))}
              >
                {[0, 1, 2, 4].map((m) => (
                  <option key={m} value={m}>
                    {m === 0 ? 'None' : `${m} module${m === 1 ? '' : 's'}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Segmented<ErrorCorrection>
            label="Error correction"
            value={options.errorCorrection}
            onChange={(v) => set('errorCorrection', v)}
            options={[
              { value: 'L', label: 'Low' },
              { value: 'M', label: 'Medium' },
              { value: 'Q', label: 'High' },
              { value: 'H', label: 'Max' },
            ]}
          />
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <input
                id={ids.dark}
                type="color"
                value={options.dark}
                onChange={(e) => set('dark', e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-slate-300 dark:border-slate-700"
              />
              <label htmlFor={ids.dark} className="text-sm">
                Foreground
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id={ids.light}
                type="color"
                value={options.light}
                onChange={(e) => set('light', e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-slate-300 dark:border-slate-700"
              />
              <label htmlFor={ids.light} className="text-sm">
                Background
              </label>
            </div>
          </div>
          {error && <ErrorAlert message={error} />}
        </div>

        <div className="space-y-3">
          <div
            className="flex aspect-square items-center justify-center rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700"
            aria-live="polite"
          >
            {svg ? (
              <img
                src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
                alt={`QR code for: ${text.slice(0, 80)}`}
                className="h-full w-full"
              />
            ) : (
              <span className="px-4 text-center text-sm text-slate-500">
                Your QR code appears here as you type.
              </span>
            )}
          </div>
          {svg && (
            <>
              <DeviceBadge />
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-primary" onClick={downloadPng}>
                  <Download aria-hidden="true" className="h-4 w-4" /> PNG
                </button>
                <button type="button" className="btn-secondary" onClick={downloadSvg}>
                  <Download aria-hidden="true" className="h-4 w-4" /> SVG
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setText('');
                    setOptions(DEFAULT_QR_OPTIONS);
                  }}
                >
                  <RotateCcw aria-hidden="true" className="h-4 w-4" /> Process another
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </ToolPage>
  );
}
