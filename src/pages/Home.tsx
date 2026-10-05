import { Search } from 'lucide-react';
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { PrivacyBanner } from '../components/PrivacyBanner';
import { ToolIcon } from '../components/ToolIcon';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { searchTools, SITE, TOOL_METAS } from '../tools/meta';
import type { ToolCategory } from '../tools/types';

const SECTIONS: { category: ToolCategory; title: string }[] = [
  { category: 'pdf', title: 'PDF tools' },
  { category: 'image', title: 'Image tools' },
  { category: 'other', title: 'Other tools' },
];

export default function Home() {
  useDocumentMeta(SITE.title, SITE.description, '');
  const [query, setQuery] = useState('');
  const searchId = useId();
  const results = searchTools(TOOL_METAS, query);

  return (
    <div className="space-y-8">
      <section className="space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Free PDF and image tools that{' '}
          <span className="text-brand-600 dark:text-brand-400">never upload</span> your files
        </h1>
        <p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-300">
          Merge, split, compress and convert right in your browser. No sign-up, no ads, no
          watermarks, and nothing ever leaves your device.
        </p>
      </section>

      <PrivacyBanner large />

      <div className="relative">
        <label htmlFor={searchId} className="sr-only">
          Search tools
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400"
        />
        <input
          id={searchId}
          type="search"
          placeholder="Search tools, e.g. “merge” or “jpg”"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input py-3 pl-10 text-base"
          autoComplete="off"
        />
      </div>

      {results.length === 0 && (
        <p className="text-center text-slate-600 dark:text-slate-400" role="status">
          No tools match “{query}”.
        </p>
      )}

      {SECTIONS.map(({ category, title }) => {
        const tools = results.filter((t) => t.category === category);
        if (tools.length === 0) return null;
        return (
          <section key={category} aria-labelledby={`section-${category}`} className="space-y-3">
            <h2 id={`section-${category}`} className="text-lg font-semibold">
              {title}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    to={`/${tool.slug}/`}
                    className="flex h-full gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow dark:border-slate-800 dark:bg-slate-900"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                      <ToolIcon name={tool.icon} className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-semibold">{tool.name}</span>
                      <span className="block text-sm text-slate-600 dark:text-slate-400">
                        {tool.summary}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
