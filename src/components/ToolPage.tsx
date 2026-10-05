import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import type { ToolMeta } from '../tools/types';
import { ALL_PAGES, ogImagePath, TOOL_METAS } from '../tools/meta';
import { ToolIcon } from './ToolIcon';

/**
 * Shell for every tool: heading and intro, the tool itself, "How to use" steps,
 * a "How it works" FAQ, and links to related tools (good for users and for SEO).
 */
export function ToolPage({ meta, children }: { meta: ToolMeta; children: ReactNode }) {
  const baseSlug = meta.toolSlug ?? meta.slug;
  useDocumentMeta(meta.title, meta.description, `${meta.slug}/`, ogImagePath(baseSlug));
  const related = TOOL_METAS.filter((t) => t.category === meta.category && t.slug !== baseSlug);
  const variants = ALL_PAGES.filter(
    (p) => p.slug !== meta.slug && (p.toolSlug ?? p.slug) === baseSlug && p.toolSlug,
  );
  const base = meta.toolSlug ? TOOL_METAS.find((t) => t.slug === meta.toolSlug) : undefined;

  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
          <ol className="flex flex-wrap items-center">
            <li>
              <Link to="/" className="hover:underline">
                All tools
              </Link>
            </li>
            {base && (
              <li className="flex items-center">
                <ChevronRight aria-hidden="true" className="mx-1 h-3.5 w-3.5" />
                <Link to={`/${base.slug}/`} className="hover:underline">
                  {base.name}
                </Link>
              </li>
            )}
            <li className="flex items-center" aria-current="page">
              <ChevronRight aria-hidden="true" className="mx-1 h-3.5 w-3.5" />
              {meta.name}
            </li>
          </ol>
        </nav>
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
          <ToolIcon name={meta.icon} className="h-7 w-7 text-brand-600 dark:text-brand-400" />
          {meta.name}
        </h1>
        <p className="text-slate-600 dark:text-slate-300">{meta.intro}</p>
      </header>

      <div className="card">{children}</div>

      <section aria-labelledby="how-to-use" className="space-y-3">
        <h2 id="how-to-use" className="text-xl font-semibold">
          How to {/ to /i.test(meta.name) ? 'convert' : 'use'} {meta.name}
        </h2>
        <ol className="list-decimal space-y-1.5 pl-6 text-slate-700 marker:font-semibold marker:text-brand-600 dark:text-slate-300">
          {meta.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="how-it-works" className="space-y-3">
        <h2 id="how-it-works" className="text-xl font-semibold">
          How it works
        </h2>
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {meta.faq.map((item) => (
            <details key={item.q} className="group p-4">
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <ChevronRight
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90"
                  />
                </span>
              </summary>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {[
        { id: 'popular', title: 'Popular conversions', pages: variants },
        { id: 'related', title: 'Related tools', pages: related },
      ].map(
        ({ id, title, pages }) =>
          pages.length > 0 && (
            <nav key={id} aria-labelledby={`${id}-links`} className="space-y-3">
              <h2 id={`${id}-links`} className="text-lg font-semibold">
                {title}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {pages.map((t) => (
                  <li key={t.slug}>
                    <Link
                      to={`/${t.slug}/`}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-sm hover:border-brand-500 dark:border-slate-700"
                    >
                      <ToolIcon name={t.icon} className="h-4 w-4" />
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ),
      )}
    </article>
  );
}
