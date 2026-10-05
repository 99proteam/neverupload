import { useEffect } from 'react';

function setMeta(selector: string, attr: string, value: string) {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/** Keep <title>, description and canonical URL in sync with the current page. */
export function useDocumentMeta(title: string, description: string, path: string) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (canonical) {
      const origin = new URL(canonical.getAttribute('href') ?? location.href, location.href).origin;
      canonical.setAttribute('href', `${origin}${import.meta.env.BASE_URL}${path}`);
    }
  }, [title, description, path]);
}
