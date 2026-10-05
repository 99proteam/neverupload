import { useEffect } from 'react';
import { ogImagePath } from '../tools/meta';

function setMeta(selector: string, attr: string, value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/**
 * Keep the head tags in sync while navigating inside the app. The static HTML for
 * each page already has them (written at build time), so crawlers see them too.
 */
export function useDocumentMeta(title: string, description: string, path: string, image?: string) {
  useEffect(() => {
    document.title = title;
    const canonical = document.head.querySelector('link[rel="canonical"]');
    const origin = new URL(canonical?.getAttribute('href') ?? location.href, location.href).origin;
    const site = `${origin}${import.meta.env.BASE_URL}`;
    const url = `${site}${path}`;
    const img = `${site}${image ?? ogImagePath('home')}`;

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:image"]', 'content', img);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', img);
    canonical?.setAttribute('href', url);
  }, [title, description, path, image]);
}
