import { AlertTriangle } from 'lucide-react';

export function ErrorAlert({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
    >
      <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button type="button" className="font-semibold underline" onClick={onDismiss}>
          Dismiss
        </button>
      )}
    </div>
  );
}
