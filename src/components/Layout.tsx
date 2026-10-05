import { Coffee, ShieldCheck } from 'lucide-react';
import { GithubIcon } from './GithubIcon';
import { Suspense } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ALL_PAGES, SITE } from '../tools/meta';
import { OfflineStatus } from './OfflineStatus';
import { PrivacyBanner } from './PrivacyBanner';
import { ProgressBar } from './ProgressBar';

export function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-slate-900"
      >
        Skip to content
      </a>
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <ShieldCheck
              aria-hidden="true"
              className="h-6 w-6 text-brand-600 dark:text-brand-400"
            />
            <span>
              never<span className="text-brand-600 dark:text-brand-400">upload</span>
            </span>
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1 text-sm">
            {!isHome && (
              <Link
                to="/"
                className="rounded-md px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                All tools
              </Link>
            )}
            <a
              href={SITE.repoUrl}
              className="btn-icon"
              aria-label="Source code on GitHub"
              rel="noopener"
            >
              <GithubIcon className="h-5 w-5" />
            </a>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-6 sm:py-10">
        {!isHome && <PrivacyBanner />}
        <Suspense fallback={<ProgressBar value={null} label="Loading tool…" />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800">
        <nav aria-label="All tools" className="mx-auto max-w-5xl px-4 pt-6">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            {ALL_PAGES.map((p) => (
              <li key={p.slug}>
                <Link to={`/${p.slug}/`} className="hover:underline">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
          <p>
            <strong className="text-slate-800 dark:text-slate-200">{SITE.name}</strong> is free and
            open source (MIT). {SITE.tagline}
          </p>
          <OfflineStatus />
          <div className="flex items-center gap-4">
            <a href={SITE.repoUrl} className="hover:underline" rel="noopener">
              GitHub
            </a>
            <a
              href={SITE.sponsorUrl}
              className="inline-flex items-center gap-1 hover:underline"
              rel="noopener"
            >
              <Coffee aria-hidden="true" className="h-4 w-4 text-amber-600" />
              Support neverupload
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
