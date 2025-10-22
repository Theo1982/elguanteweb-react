import { useEffect } from 'react';

// Google Analytics 4 setup
let gtag = null;

export const loadAnalytics = () => {
  if (typeof window !== 'undefined' && !gtag) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX'; // Replace with actual GA4 ID
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX'); // Replace with actual GA4 ID
  }
};

export const useAnalytics = () => {
  const trackPageView = path => {
    if (gtag) {
      gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: path,
      });
    }
  };

  const trackEvent = (eventName, eventParams = {}) => {
    if (gtag) {
      gtag('event', eventName, eventParams);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleRouteChange = () => {
        trackPageView(window.location.pathname);
      };

      window.addEventListener('popstate', handleRouteChange);
      return () => window.removeEventListener('popstate', handleRouteChange);
    }
  }, []);

  return { trackPageView, trackEvent };
};

// E-commerce events
export const trackAddToCart = product => {
  if (gtag) {
    gtag('event', 'add_to_cart', {
      currency: 'ARS',
      value: product.precio,
      items: [
        {
          item_id: product.id,
          item_name: product.nombre,
          item_category: product.categoria,
          price: product.precio,
          quantity: 1,
        },
      ],
    });
  }
};

export const trackPurchase = order => {
  if (gtag) {
    gtag('event', 'purchase', {
      transaction_id: order.id,
      value: order.total,
      currency: 'ARS',
      items: order.items,
    });
  }
};

export const trackViewItem = product => {
  if (gtag) {
    gtag('event', 'view_item', {
      items: [
        {
          item_id: product.id,
          item_name: product.nombre,
          item_category: product.categoria,
          price: product.precio,
        },
      ],
    });
  }
};
