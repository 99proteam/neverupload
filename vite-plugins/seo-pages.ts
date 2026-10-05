import type { Plugin } from 'vite';
import type { ToolMeta } from '../src/tools/types.ts';

interface SeoPagesOptions {
  /** Absolute site URL including the base path, without trailing slash. */
  siteUrl: string;
  site: { name: string; title: string; description: string; tagline: string };
  tools: ToolMeta[];
}

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "connect-src 'self' blob: data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Emit a static HTML file per tool route (dist/<slug>/index.html) with its own
 * title, description, canonical URL, FAQ structured data and pre-rendered text.
 * This gives every tool proper SEO and makes deep links work on GitHub Pages,
 * which has no server-side routing. Also writes 404.html, sitemap.xml and robots.txt.
 */
export function seoPages({ siteUrl, site, tools }: SeoPagesOptions): Plugin {
  return {
    name: 'neverupload:seo-pages',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      // Production-only CSP: the app may only talk to its own origin, so file data
      // can't be sent anywhere even by accident. (Dev mode needs inline scripts.)
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      );
    },
    generateBundle(_, bundle) {
      const index = bundle['index.html'];
      if (!index || index.type !== 'asset') return;
      const template = String(index.source);

      const render = (opts: {
        title: string;
        description: string;
        path: string;
        body: string;
        jsonLd?: object;
      }) => {
        let html = template
          .replace(/<title>[^<]*<\/title>/, `<title>${escape(opts.title)}</title>`)
          .replace(
            /(<meta\s+name="description"\s+content=")[^"]*(")/,
            `$1${escape(opts.description)}$2`,
          )
          .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${escape(opts.title)}$2`)
          .replace(
            /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
            `$1${escape(opts.description)}$2`,
          )
          .replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/, `$1${siteUrl}/${opts.path}$2`)
          .replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${siteUrl}/${opts.path}$2`)
          .replace('<div id="root"></div>', `<div id="root">${opts.body}</div>`);
        if (opts.jsonLd) {
          html = html.replace(
            '</head>',
            `<script type="application/ld+json">${JSON.stringify(opts.jsonLd).replace(/</g, '\\u003c')}</script>\n</head>`,
          );
        }
        return html;
      };

      const banner = `<p><strong>${escape(site.tagline)}</strong> Everything runs in your browser.</p>`;

      // Home page.
      const list = tools
        .map(
          (t) =>
            `<li><a href="${siteUrl}/${t.slug}/">${escape(t.name)}</a>: ${escape(t.summary)}</li>`,
        )
        .join('');
      index.source = render({
        title: site.title,
        description: site.description,
        path: '',
        body: `<main style="max-width:60rem;margin:auto;padding:1rem;font-family:system-ui"><h1>${escape(site.name)}: free PDF and image tools</h1>${banner}<ul>${list}</ul></main>`,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: site.name,
          url: `${siteUrl}/`,
          description: site.description,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any (web browser)',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
      });

      for (const tool of tools) {
        const faq = tool.faq.map((f) => `<h3>${escape(f.q)}</h3><p>${escape(f.a)}</p>`).join('');
        this.emitFile({
          type: 'asset',
          fileName: `${tool.slug}/index.html`,
          source: render({
            title: tool.title,
            description: tool.description,
            path: `${tool.slug}/`,
            body: `<main style="max-width:60rem;margin:auto;padding:1rem;font-family:system-ui"><h1>${escape(tool.name)}</h1><p>${escape(tool.summary)}</p>${banner}<h2>How it works</h2>${faq}</main>`,
            jsonLd: {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: tool.faq.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            },
          }),
        });
      }

      // GitHub Pages serves 404.html for unknown paths; the app shows its own "not found".
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: render({
          title: `Page not found | ${site.name}`,
          description: site.description,
          path: '',
          body: '',
        }).replace('</title>', '</title>\n    <meta name="robots" content="noindex" />'),
      });

      const urls = ['', ...tools.map((t) => `${t.slug}/`)];
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${siteUrl}/${u}</loc></url>`)
          .join('\n')}\n</urlset>\n`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      });
    },
  };
}
