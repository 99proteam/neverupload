import { Coffee, Heart } from 'lucide-react';
import { SITE } from '../tools/meta';

/** Large "Buy me a coffee" call to action. neverupload is funded only by donations. */
export function SponsorBanner({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      aria-labelledby={compact ? undefined : 'sponsor-title'}
      aria-label={compact ? 'Support neverupload' : undefined}
      className="overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-5 shadow-md sm:p-8 dark:border-amber-500/40 dark:from-amber-950/60 dark:via-slate-900 dark:to-orange-950/40"
    >
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#FFDD00] text-slate-900 shadow sm:h-20 sm:w-20">
          <Coffee aria-hidden="true" className="h-9 w-9 sm:h-11 sm:w-11" />
        </span>
        <div className="flex-1 space-y-1">
          {compact ? (
            <p className="text-lg font-bold sm:text-xl">Did this save you time?</p>
          ) : (
            <h2 id="sponsor-title" className="text-xl font-bold sm:text-2xl">
              Keep neverupload free, private and ad-free
            </h2>
          )}
          <p className="text-slate-700 dark:text-slate-300">
            No ads, no trackers, no paywalls. This project runs only on donations from people like
            you. A coffee keeps new tools coming.
          </p>
        </div>
        <a
          href={SITE.sponsorUrl}
          target="_blank"
          rel="noopener"
          className="inline-flex w-full shrink-0 items-center justify-center gap-3 rounded-xl bg-[#FFDD00] px-7 py-4 text-lg font-extrabold text-slate-900 shadow-lg ring-2 ring-amber-400 transition hover:-translate-y-0.5 hover:bg-[#FFE94D] hover:shadow-xl sm:w-auto sm:text-xl"
        >
          <Coffee aria-hidden="true" className="h-6 w-6" />
          Buy me a coffee
          <Heart aria-hidden="true" className="h-5 w-5 fill-pink-600 text-pink-600" />
        </a>
      </div>
    </aside>
  );
}

/** Small always-visible header button. */
export function SponsorButton() {
  return (
    <a
      href={SITE.sponsorUrl}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center gap-2 rounded-lg bg-[#FFDD00] px-3 py-2 text-sm font-bold text-slate-900 shadow ring-1 ring-amber-400 transition hover:bg-[#FFE94D] sm:px-4"
    >
      <Coffee aria-hidden="true" className="h-4 w-4" />
      <span className="hidden sm:inline">Buy me a coffee</span>
      <span className="sm:hidden">Donate</span>
    </a>
  );
}
