import { Heart } from 'lucide-react';
import { SITE } from '../tools/meta';

/** Large GitHub Sponsors call to action. neverupload is funded only by sponsors and donations. */
export function SponsorBanner({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      aria-labelledby={compact ? undefined : 'sponsor-title'}
      aria-label={compact ? 'Support neverupload' : undefined}
      className="overflow-hidden rounded-2xl border-2 border-pink-300 bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 p-5 shadow-md sm:p-8 dark:border-pink-500/40 dark:from-pink-950/60 dark:via-slate-900 dark:to-fuchsia-950/40"
    >
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#bf3989] text-white shadow sm:h-20 sm:w-20">
          <Heart aria-hidden="true" className="h-9 w-9 fill-current sm:h-11 sm:w-11" />
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
            No ads, no trackers, no paywalls. This project runs only on sponsors like you. Help us
            reach {SITE.sponsorGoal} on GitHub Sponsors so new tools keep coming. Prefer a one-off?{' '}
            <a
              href={SITE.coffeeUrl}
              target="_blank"
              rel="noopener"
              className="font-semibold underline"
            >
              Buy me a coffee
            </a>
            .
          </p>
        </div>
        <a
          href={SITE.sponsorUrl}
          target="_blank"
          rel="noopener"
          className="inline-flex w-full shrink-0 items-center justify-center gap-3 rounded-xl bg-[#bf3989] px-7 py-4 text-lg font-extrabold text-white shadow-lg ring-2 ring-pink-400 transition hover:-translate-y-0.5 hover:bg-[#a52f75] hover:shadow-xl sm:w-auto sm:text-xl"
        >
          <Heart aria-hidden="true" className="h-6 w-6 fill-current" />
          Sponsor on GitHub
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
      className="inline-flex items-center gap-2 rounded-lg bg-[#bf3989] px-3 py-2 text-sm font-bold text-white shadow ring-1 ring-pink-400 transition hover:bg-[#a52f75] sm:px-4"
    >
      <Heart aria-hidden="true" className="h-4 w-4 fill-current" />
      <span className="hidden sm:inline">Sponsor on GitHub</span>
      <span className="sm:hidden">Sponsor</span>
    </a>
  );
}
