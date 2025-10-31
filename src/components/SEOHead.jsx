import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function SEOHead({ title, description, keywords, image, noindex = false }) {
  const location = useLocation();

  useEffect(() => {
    // Update title
    document.title = title ? `${title} | ElGuante` : 'ElGuante - Tienda en línea';

    // Update meta tags
    updateMetaTag('name', 'description', description || 'Productos de limpieza y hogar de calidad. Envíos a todo el país.');
    updateMetaTag('name', 'keywords', keywords || 'productos limpieza hogar tienda online envios');

    // Open Graph
    updateMetaTag('property', 'og:title', title || 'ElGuante - Tienda en línea');
    updateMetaTag('property', 'og:description', description || 'Productos de limpieza y hogar de calidad. Envíos a todo el país.');
    updateMetaTag('property', 'og:image', image || `${window.location.origin}/img/icon-144x144.png`);
    updateMetaTag('property', 'og:url', window.location.href);
    updateMetaTag('property', 'og:type', 'website');

    // Twitter Card
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', title || 'ElGuante - Tienda en línea');
    updateMetaTag('name', 'twitter:description', description || 'Productos de limpieza y hogar de calidad. Envíos a todo el país.');
    updateMetaTag('name', 'twitter:image', image || `${window.location.origin}/img/icon-144x144.png`);

    // Canonical URL
    updateCanonicalUrl();

    // Robots
    updateMetaTag('name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow');

    // Add JSON-LD structured data
    addStructuredData();

  }, [title, description, keywords, image, noindex, location]);

  const updateMetaTag = (attribute, name, content) => {
    let element = document.querySelector(`meta[${attribute}="${name}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attribute, name);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  const updateCanonicalUrl = () => {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;
  };

  const addStructuredData = () => {
    // Remove existing
    const existing = document.querySelector('script[type="application/ld+json"]#seo-data');
    if (existing) existing.remove();

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'ElGuante',
      description: 'Tienda en línea de productos de limpieza y hogar',
      url: window.location.origin,
      logo: `${window.location.origin}/img/icon-144x144.png`,
      sameAs: [
        // Add social media URLs if available
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+54-XXX-XXXXXXX', // Add real phone if available
        contactType: 'customer service'
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${window.location.origin}/shop?search={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'seo-data';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  };

  return null; // This component doesn't render anything
}
