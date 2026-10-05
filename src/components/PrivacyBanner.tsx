import { ShieldCheck } from 'lucide-react';
import { SITE } from '../tools/meta';

export function PrivacyBanner({ large = false }: { large?: boolean }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-900 dark:bg-brand-900/30 dark:text-brand-100 ${
        large ? 'p-4 sm:p-5' : 'px-3 py-2'
      }`}
    >
      <ShieldCheck
        aria-hidden="true"
        className={`shrink-0 text-brand-600 dark:text-brand-400 ${large ? 'mt-0.5 h-6 w-6' : 'mt-px h-5 w-5'}`}
      />
      <div>
        <p className={`font-semibold ${large ? 'text-base sm:text-lg' : 'text-sm'}`}>
          {SITE.tagline}
        </p>
        <p className={`text-brand-800 dark:text-brand-200 ${large ? 'mt-1 text-sm' : 'text-xs'}`}>
          Everything runs in your browser. Nothing is uploaded, there are no accounts and no
          trackers, and it keeps working offline.
        </p>
      </div>
    </div>
  );
}
