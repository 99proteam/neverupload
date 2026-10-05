import { useCallback, useRef, useState } from 'react';
import { toUserMessage } from '../lib/errors';
import type { ProgressFn } from '../workers/protocol';

export type JobState<R> =
  | { status: 'idle' }
  | { status: 'working'; progress: number | null; label: string }
  | { status: 'done'; result: R }
  | { status: 'error'; message: string };

/**
 * Small state machine for a tool's processing job: idle → working → done | error.
 * Late results from a job that was reset are ignored.
 */
export function useJob<R>() {
  const [state, setState] = useState<JobState<R>>({ status: 'idle' });
  const runId = useRef(0);

  const run = useCallback(async (label: string, task: (onProgress: ProgressFn) => Promise<R>) => {
    const id = ++runId.current;
    setState({ status: 'working', progress: null, label });
    try {
      const result = await task((progress) => {
        if (runId.current === id) setState({ status: 'working', progress, label });
      });
      if (runId.current === id) setState({ status: 'done', result });
    } catch (err) {
      console.error(err);
      if (runId.current === id) setState({ status: 'error', message: toUserMessage(err) });
    }
  }, []);

  const reset = useCallback(() => {
    runId.current++;
    setState({ status: 'idle' });
  }, []);

  const fail = useCallback((err: unknown) => {
    runId.current++;
    setState({ status: 'error', message: toUserMessage(err) });
  }, []);

  return { state, run, reset, fail, busy: state.status === 'working' };
}
