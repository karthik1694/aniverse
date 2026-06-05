import { useEffect } from 'react';

const SITE_NAME = 'OtakuCafe';
const BASE_URL = 'https://otakucafe.fun';
const DEFAULT_IMAGE = `${BASE_URL}/images/og-image.png`;

function setMeta(selector, attr, value) {
  if (!value) return;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [key, val] = selector.replace('meta[', '').replace(']', '').split('=');
    el.setAttribute(key, val.replace(/["']/g, ''));
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setCanonical(url) {
  if (!url) return;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setJsonLd(id, data) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  if (!data) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}

/**
 * Lightweight client-side SEO hook.
 * Updates the document title, meta description, canonical URL,
 * Open Graph / Twitter tags, and optional JSON-LD structured data.
 */
export default function useSeo({
  title,
  description,
  path,
  image,
  type = 'website',
  jsonLd,
  keywords,
} = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const url = path ? `${BASE_URL}${path}` : BASE_URL;
    const img = image || DEFAULT_IMAGE;

    document.title = fullTitle;

    setMeta('meta[name="title"]', 'content', fullTitle);
    setMeta('meta[name="description"]', 'content', description);
    if (keywords) setMeta('meta[name="keywords"]', 'content', keywords);
    setCanonical(url);

    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:image"]', 'content', img);
    setMeta('meta[property="og:type"]', 'content', type);

    setMeta('meta[name="twitter:title"]', 'content', fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:url"]', 'content', url);
    setMeta('meta[name="twitter:image"]', 'content', img);

    setJsonLd('dynamic-jsonld', jsonLd);

    return () => {
      // Clean up page-specific structured data on unmount
      setJsonLd('dynamic-jsonld', null);
    };
  }, [title, description, path, image, type, keywords, JSON.stringify(jsonLd)]);
}

export { BASE_URL, SITE_NAME };
