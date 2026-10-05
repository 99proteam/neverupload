import { useId } from 'react';

export function QualitySlider({
  value,
  onChange,
  label = 'Quality',
  min = 10,
  max = 95,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="field-label flex justify-between">
        <span>{label}</span>
        <span className="tabular-nums">{value}%</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-600"
      />
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Smaller file</span>
        <span>Better quality</span>
      </div>
    </div>
  );
}
