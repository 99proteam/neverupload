import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import type { ToolMeta } from '../tools/types';
import { TOOL_METAS } from '../tools/meta';
import { ToolIcon } from './ToolIcon';

/** Shell for every tool: heading, the tool itself, a "How it works" FAQ and related tools. */
export function ToolPage({ meta, children }: { meta: ToolMeta; children: ReactNode }) {
  useDocumentMeta(meta.title, meta.description, `${meta.slug}/`);
  const related = TOOL_METAS.filter((t) => t.category === meta.category && t.slug !== meta.slug);

  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:underline">
            All tools
          </Link>
          <ChevronRight aria-hidden="true" className="mx-1 inline h-3.5 w-3.5" />
          <span>{meta.name}</span>
        </nav>
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
          <ToolIcon name={meta.icon} className="h-7 w-7 text-brand-600 dark:text-brand-400" />
          {meta.name}
        </h1>
        <p className="text-slate-600 dark:text-slate-300">{meta.summary}</p>
      </header>

      <div className="card">{children}</div>

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

      {related.length > 0 && (
        <nav aria-labelledby="related-tools" className="space-y-3">
          <h2 id="related-tools" className="text-lg font-semibold">
            Related tools
          </h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((t) => (
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
      )}
    </article>
  );
}
