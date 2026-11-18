import React, { useEffect } from 'react';
import { getSeoRoute, buildRouteSchemaGraph } from '../data/seoContent';

interface SeoManagerProps {
  pathname: string;
}

function upsertMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export const SeoManager: React.FC<SeoManagerProps> = ({ pathname }) => {
  useEffect(() => {
    const route = getSeoRoute(pathname);
    const origin = window.location.origin;
    const canonicalUrl = `${origin}${route.path === '/' ? '/' : route.path}`;
    const ogImageUrl = `${origin}/images/og-banner.jpg`;

    document.title = route.title;

    upsertMetaTag('name', 'description', route.description);
    upsertMetaTag('name', 'keywords', route.keywords);
    upsertMetaTag('property', 'og:title', route.title);
    upsertMetaTag('property', 'og:description', route.description);
    upsertMetaTag('property', 'og:url', canonicalUrl);
    upsertMetaTag('property', 'og:image', ogImageUrl);
    upsertMetaTag('name', 'twitter:title', route.title);
    upsertMetaTag('name', 'twitter:description', route.description);
    upsertMetaTag('name', 'twitter:image', ogImageUrl);

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    const schemaJson = JSON.stringify(buildRouteSchemaGraph(route, origin));
    let jsonLdScript = document.getElementById('clearcut-jsonld') as HTMLScriptElement | null;
    if (!jsonLdScript) {
      jsonLdScript = document.querySelector(
        'script[type="application/ld+json"]'
      ) as HTMLScriptElement | null;
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.id = 'clearcut-jsonld';
    }
    jsonLdScript.textContent = schemaJson;
  }, [pathname]);

  return null;
};
