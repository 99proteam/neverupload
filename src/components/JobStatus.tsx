import type { JobState } from '../hooks/useJob';
import { ErrorAlert } from './ErrorAlert';
import { ProgressBar } from './ProgressBar';

/** Progress bar while working, error alert on failure; nothing otherwise. */
export function JobStatus<R>({ state, onDismiss }: { state: JobState<R>; onDismiss?: () => void }) {
  if (state.status === 'working') return <ProgressBar value={state.progress} label={state.label} />;
  if (state.status === 'error') return <ErrorAlert message={state.message} onDismiss={onDismiss} />;
  return null;
}
