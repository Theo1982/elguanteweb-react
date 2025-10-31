import { useEffect } from 'react';

export const useSEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website'
}) => {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = `${title} | ElGuante`;
    }

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && description) {
      metaDescription.setAttribute('content', description);
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && keywords) {
      metaKeywords.setAttribute('content', keywords);
    }

    // Update Open Graph meta tags
    updateMetaTag('property', 'og:title', title ? `${title} | ElGuante` : 'ElGuante - Tienda en línea');
    updateMetaTag('property', 'og:description', description || 'Productos de limpieza y hogar de calidad. Envíos a todo el país.');
    updateMetaTag('property', 'og:image', image || '/img/icon-144x144.png');
    updateMetaTag('property', 'og:url', url || window.location.href);
    updateMetaTag('property', 'og:type', type);

    // Update Twitter Card meta tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', title ? `${title} | ElGuante` : 'ElGuante - Tienda en línea');
    updateMetaTag('name', 'twitter:description', description || 'Productos de limpieza y hogar de calidad. Envíos a todo el país.');
    updateMetaTag('name', 'twitter:image', image || '/img/icon-144x144.png');

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = url || window.location.href;

    // Add structured data (JSON-LD)
    if (type === 'product' && title) {
      addStructuredData({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title,
        description: description,
        image: image,
        brand: {
          '@type': 'Brand',
          name: 'ElGuante'
        },
        offers: {
          '@type': 'Offer',
          availability: 'https://schema.org/InStock',
          priceCurrency: 'ARS'
        }
      });
    } else {
      addStructuredData({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'ElGuante',
        description: 'Tienda en línea de productos de limpieza y hogar',
        url: window.location.origin,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${window.location.origin}/shop?search={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      });
    }

  }, [title, description, keywords, image, url, type]);
};

const updateMetaTag = (attribute, name, content) => {
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const addStructuredData = (data) => {
  // Remove existing structured data
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

// Hook específico para productos
export const useProductSEO = (product) => {
  useSEO({
    title: product?.name,
    description: product?.description || `Compra ${product?.name} en ElGuante. Envío gratis en compras mayores a $5000.`,
    keywords: product?.tags?.join(', ') || 'productos limpieza hogar',
    image: product?.images?.[0] || '/img/icon-144x144.png',
    type: 'product'
  });
};

// Hook para páginas estáticas
export const usePageSEO = (pageType) => {
  const seoData = {
    home: {
      title: 'Inicio',
      description: 'Bienvenido a ElGuante - Tu tienda en línea de productos de limpieza y hogar. Envíos a todo el país.',
      keywords: 'limpieza hogar productos tienda online envios'
    },
    shop: {
      title: 'Tienda',
      description: 'Descubre nuestra amplia variedad de productos de limpieza y hogar. Calidad garantizada.',
      keywords: 'productos limpieza hogar tienda online comprar'
    },
    cart: {
      title: 'Carrito de Compras',
      description: 'Revisa y modifica los productos en tu carrito antes de finalizar tu compra.',
      keywords: 'carrito compras productos limpieza hogar'
    },
    login: {
      title: 'Iniciar Sesión',
      description: 'Accede a tu cuenta de ElGuante para ver tus pedidos y gestionar tus datos.',
      keywords: 'login cuenta usuario iniciar sesion'
    }
  };

  useSEO(seoData[pageType] || seoData.home);
};
