import type { Plugin } from 'vite';
import type { ToolMeta } from '../src/tools/types.ts';

interface SeoPagesOptions {
  /** Absolute site URL including the base path, without trailing slash. */
  siteUrl: string;
  site: {
    name: string;
    title: string;
    description: string;
    tagline: string;
    repoUrl: string;
    sponsorUrl: string;
  };
  /** Real tools (shown in the main list). */
  tools: ToolMeta[];
  /** Every page with its own URL: tools + keyword landing pages. */
  pages: ToolMeta[];
  /** Optional search-engine verification codes (from env vars at build time). */
  verification?: { google?: string; bing?: string; yandex?: string };
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

/** Replace the content/href of an existing tag, matched by an attribute. */
function setAttr(html: string, tag: string, key: string, value: string, attr = 'content'): string {
  const re = new RegExp(`(<${tag}\\s+${key}\\s+${attr}=")[^"]*(")`, 'g');
  return html.replace(re, `$1${escape(value)}$2`);
}

const ldScript = (data: object) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

/**
 * Build-time SEO:
 * - one static HTML file per page (dist/<slug>/index.html) with its own title,
 *   description, keywords, canonical, Open Graph / Twitter tags and image,
 * - JSON-LD structured data (WebSite, Organization, WebApplication, BreadcrumbList,
 *   FAQPage, HowTo),
 * - pre-rendered, crawlable text (heading, intro, steps, FAQ, links),
 * - 404.html, sitemap.xml, robots.txt and llms.txt,
 * - a strict Content Security Policy.
 * Static per-route HTML also makes deep links work on GitHub Pages.
 */
export function seoPages({
  siteUrl,
  site,
  tools,
  pages,
  verification = {},
}: SeoPagesOptions): Plugin {
  const lastmod = new Date().toISOString().slice(0, 10);
  const url = (path: string) => `${siteUrl}/${path}`;
  const ogImage = (p?: ToolMeta) => url(`og/${p ? (p.toolSlug ?? p.slug) : 'home'}.png`);

  const organization = {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: site.name,
    url: url(''),
    logo: url('pwa-512x512.png'),
    sameAs: [site.repoUrl],
  };
  const website = {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: site.name,
    url: url(''),
    description: site.description,
    inLanguage: 'en',
    publisher: { '@id': `${siteUrl}/#organization` },
  };

  return {
    name: 'neverupload:seo-pages',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      // Production-only CSP: the app may only talk to its own origin, so file data
      // can't be sent anywhere even by accident. (Dev mode needs inline scripts.)
      let extra = `\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`;
      if (verification.google) {
        extra += `\n    <meta name="google-site-verification" content="${escape(verification.google)}" />`;
      }
      if (verification.bing) {
        extra += `\n    <meta name="msvalidate.01" content="${escape(verification.bing)}" />`;
      }
      if (verification.yandex) {
        extra += `\n    <meta name="yandex-verification" content="${escape(verification.yandex)}" />`;
      }
      return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />${extra}`);
    },
    generateBundle(_, bundle) {
      const index = bundle['index.html'];
      if (!index || index.type !== 'asset') return;
      const template = String(index.source);

      const render = (opts: {
        title: string;
        description: string;
        keywords: string[];
        path: string;
        image: string;
        imageAlt: string;
        body: string;
        jsonLd: object[];
      }) => {
        let html = template.replace(
          /<title>[^<]*<\/title>/,
          `<title>${escape(opts.title)}</title>`,
        );
        html = setAttr(html, 'meta', 'name="description"', opts.description);
        html = setAttr(html, 'meta', 'name="keywords"', opts.keywords.join(', '));
        html = setAttr(html, 'meta', 'property="og:title"', opts.title);
        html = setAttr(html, 'meta', 'property="og:description"', opts.description);
        html = setAttr(html, 'meta', 'property="og:url"', url(opts.path));
        html = setAttr(html, 'meta', 'property="og:image"', opts.image);
        html = setAttr(html, 'meta', 'property="og:image:alt"', opts.imageAlt);
        html = setAttr(html, 'meta', 'name="twitter:title"', opts.title);
        html = setAttr(html, 'meta', 'name="twitter:description"', opts.description);
        html = setAttr(html, 'meta', 'name="twitter:image"', opts.image);
        html = setAttr(html, 'meta', 'name="twitter:image:alt"', opts.imageAlt);
        html = setAttr(html, 'link', 'rel="canonical"', url(opts.path), 'href');
        html = setAttr(html, 'link', 'rel="alternate" hreflang="en"', url(opts.path), 'href');
        html = setAttr(
          html,
          'link',
          'rel="alternate" hreflang="x-default"',
          url(opts.path),
          'href',
        );
        html = setAttr(
          html,
          'link',
          'rel="sitemap" type="application/xml"',
          url('sitemap.xml'),
          'href',
        );
        html = html.replace('<div id="root"></div>', `<div id="root">${opts.body}</div>`);
        const ld = ldScript({ '@context': 'https://schema.org', '@graph': opts.jsonLd });
        return html.replace('</head>', `${ld}\n  </head>`);
      };

      const wrap = (inner: string) =>
        `<main style="max-width:60rem;margin:auto;padding:1rem;font-family:system-ui,sans-serif;line-height:1.5">${inner}</main>`;
      const banner = `<p><strong>${escape(site.tagline)}</strong> Everything runs in your browser: no uploads, no sign-up, no watermarks, works offline.</p>`;
      const linkList = (list: ToolMeta[]) =>
        `<ul>${list.map((t) => `<li><a href="${url(`${t.slug}/`)}">${escape(t.name)}</a>: ${escape(t.summary)}</li>`).join('')}</ul>`;
      const landings = pages.filter((p) => p.toolSlug);

      // ---------- Home page ----------
      index.source = render({
        title: site.title,
        description: site.description,
        keywords: [
          'free pdf tools',
          'online pdf tools without upload',
          'private pdf editor',
          'offline pdf tools',
          'image converter',
          'image compressor',
          ...tools.map((t) => t.name.toLowerCase()),
          ...landings.map((t) => t.name.toLowerCase()),
        ],
        path: '',
        image: ogImage(),
        imageAlt: `${site.name}: free PDF and image tools. ${site.tagline}`,
        body: wrap(
          `<h1>${escape(site.name)}: free PDF and image tools that never upload your files</h1>${banner}<h2>Tools</h2>${linkList(tools)}<h2>Popular conversions</h2>${linkList(landings)}`,
        ),
        jsonLd: [
          organization,
          website,
          {
            '@type': 'WebApplication',
            name: site.name,
            url: url(''),
            description: site.description,
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Any (web browser)',
            browserRequirements: 'Requires JavaScript and a modern browser',
            isAccessibleForFree: true,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            featureList: tools.map((t) => t.name),
            screenshot: ogImage(),
          },
          {
            '@type': 'ItemList',
            name: 'neverupload tools',
            itemListElement: tools.map((t, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: t.name,
              url: url(`${t.slug}/`),
            })),
          },
        ],
      });

      // ---------- One page per tool / landing page ----------
      for (const page of pages) {
        const base = page.toolSlug ? tools.find((t) => t.slug === page.toolSlug) : undefined;
        const related = tools.filter(
          (t) => t.category === page.category && t.slug !== (page.toolSlug ?? page.slug),
        );
        const variants = pages.filter(
          (p) =>
            p.toolSlug &&
            (p.toolSlug === page.slug || p.toolSlug === page.toolSlug) &&
            p.slug !== page.slug,
        );
        const pageUrl = url(`${page.slug}/`);
        const crumbs = [
          { name: site.name, item: url('') },
          ...(base ? [{ name: base.name, item: url(`${base.slug}/`) }] : []),
          { name: page.name, item: pageUrl },
        ];

        const body = wrap(
          [
            `<nav aria-label="Breadcrumb"><a href="${url('')}">All tools</a>${base ? ` › <a href="${url(`${base.slug}/`)}">${escape(base.name)}</a>` : ''} › ${escape(page.name)}</nav>`,
            `<h1>${escape(page.name)}</h1>`,
            `<p>${escape(page.intro)}</p>`,
            banner,
            `<h2>How to ${/ to /i.test(page.name) ? 'convert' : 'use'} ${escape(page.name)}</h2>`,
            `<ol>${page.steps.map((s) => `<li>${escape(s)}</li>`).join('')}</ol>`,
            `<h2>How it works</h2>`,
            page.faq.map((f) => `<h3>${escape(f.q)}</h3><p>${escape(f.a)}</p>`).join(''),
            variants.length ? `<h2>Popular conversions</h2>${linkList(variants)}` : '',
            related.length ? `<h2>Related tools</h2>${linkList(related)}` : '',
          ].join(''),
        );

        this.emitFile({
          type: 'asset',
          fileName: `${page.slug}/index.html`,
          source: render({
            title: page.title,
            description: page.description,
            keywords: page.keywords,
            path: `${page.slug}/`,
            image: ogImage(page),
            imageAlt: `${page.name}: free and private, in your browser. ${site.tagline}`,
            body,
            jsonLd: [
              organization,
              website,
              {
                '@type': 'WebApplication',
                '@id': `${pageUrl}#app`,
                name: `${page.name} (${site.name})`,
                url: pageUrl,
                description: page.description,
                applicationCategory: 'UtilitiesApplication',
                operatingSystem: 'Any (web browser)',
                isAccessibleForFree: true,
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                image: ogImage(page),
                publisher: { '@id': `${siteUrl}/#organization` },
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: crumbs.map((c, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  name: c.name,
                  item: c.item,
                })),
              },
              {
                '@type': 'HowTo',
                name: `How to ${/ to /i.test(page.name) ? 'convert' : 'use'} ${page.name}`,
                description: page.intro,
                totalTime: 'PT1M',
                estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
                step: page.steps.map((text, i) => ({
                  '@type': 'HowToStep',
                  position: i + 1,
                  name: `Step ${i + 1}`,
                  text,
                  url: `${pageUrl}#how-to-use`,
                })),
              },
              {
                '@type': 'FAQPage',
                mainEntity: page.faq.map((f) => ({
                  '@type': 'Question',
                  name: f.q,
                  acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
              },
            ],
          }),
        });
      }

      // ---------- 404 ----------
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: render({
          title: `Page not found | ${site.name}`,
          description: site.description,
          keywords: [],
          path: '',
          image: ogImage(),
          imageAlt: site.name,
          body: '',
          jsonLd: [website],
        }).replace(
          /<meta\s+name="robots"\s+content="[^"]*"\s*\/>/,
          '<meta name="robots" content="noindex" />',
        ),
      });

      // ---------- sitemap.xml ----------
      const entries = [
        { loc: url(''), priority: '1.0' },
        ...tools.map((t) => ({ loc: url(`${t.slug}/`), priority: '0.9' })),
        ...landings.map((t) => ({ loc: url(`${t.slug}/`), priority: '0.8' })),
      ];
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries
  .map(
    (e) =>
      `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
  )
  .join('\n')}
</urlset>
`,
      });

      // ---------- robots.txt ----------
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /404.html\n\nSitemap: ${url('sitemap.xml')}\n`,
      });

      // ---------- llms.txt (summary for AI search assistants) ----------
      this.emitFile({
        type: 'asset',
        fileName: 'llms.txt',
        source: `# ${site.name}\n\n> ${site.description}\n\nAll processing happens locally in the browser; files are never uploaded. Free, open source (MIT), no sign-up, works offline.\n\n## Tools\n\n${tools.map((t) => `- [${t.name}](${url(`${t.slug}/`)}): ${t.summary}`).join('\n')}\n\n## Popular conversions\n\n${landings.map((t) => `- [${t.name}](${url(`${t.slug}/`)}): ${t.summary}`).join('\n')}\n\n## Project\n\n- [Source code](${site.repoUrl})\n- [Support the project](${site.sponsorUrl})\n`,
      });
    },
  };
}
