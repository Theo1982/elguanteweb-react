// src/utils/performanceMonitor.js
export const performanceMonitor = {
  // Métricas de carga inicial
  initialLoad: {
    startTime: null,
    endTime: null,
    duration: null,
  },

  // Métricas de navegación
  navigation: {
    pageViews: 0,
    routeChanges: 0,
    lazyLoads: 0,
  },

  // Métricas de cache
  cache: {
    hits: 0,
    misses: 0,
    size: 0,
  },

  // Métricas de imágenes
  images: {
    loaded: 0,
    failed: 0,
    lazyLoaded: 0,
    webpConverted: 0,
  },

  // Inicializar monitoreo
  init() {
    this.initialLoad.startTime = performance.now();

    // Monitorear carga inicial
    window.addEventListener('load', () => {
      this.initialLoad.endTime = performance.now();
      this.initialLoad.duration =
        this.initialLoad.endTime - this.initialLoad.startTime;
      this.logInitialLoad();
    });

    // Monitorear navegación
    if (window.history) {
      const originalPushState = window.history.pushState;
      window.history.pushState = (...args) => {
        this.navigation.routeChanges++;
        return originalPushState.apply(window.history, args);
      };
    }

    // Monitorear imágenes lazy
    this.observeLazyImages();

    console.log('🔍 Performance Monitor inicializado');
  },

  // Observar imágenes lazy
  observeLazyImages() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.images.lazyLoaded++;
        }
      });
    });

    // Observar todas las imágenes
    setTimeout(() => {
      document.querySelectorAll('img').forEach(img => {
        observer.observe(img);

        img.addEventListener('load', () => {
          this.images.loaded++;
        });

        img.addEventListener('error', () => {
          this.images.failed++;
        });
      });
    }, 1000);
  },

  // Registrar cache hit
  cacheHit() {
    this.cache.hits++;
  },

  // Registrar cache miss
  cacheMiss() {
    this.cache.misses++;
  },

  // Actualizar tamaño del cache
  updateCacheSize(size) {
    this.cache.size = size;
  },

  // Registrar conversión WebP
  webpConversion() {
    this.images.webpConverted++;
  },

  // Log de carga inicial
  logInitialLoad() {
    console.group('🚀 Métricas de Carga Inicial');
    console.log(`⏱️ Tiempo total: ${this.initialLoad.duration.toFixed(2)}ms`);
    console.log(`📊 Performance Score: ${this.calculatePerformanceScore()}%`);
    console.groupEnd();
  },

  // Calcular score de performance
  calculatePerformanceScore() {
    const duration = this.initialLoad.duration;
    if (duration < 1000) return 95;
    if (duration < 2000) return 85;
    if (duration < 3000) return 75;
    return 65;
  },

  // Mostrar reporte completo
  showReport() {
    console.group('📊 Reporte de Performance - Fase 2');
    console.log('='.repeat(50));

    // Carga inicial
    console.group('🚀 Carga Inicial');
    console.log(
      `⏱️ Duración: ${this.initialLoad.duration?.toFixed(2) || 'N/A'}ms`
    );
    console.log(`📊 Score: ${this.calculatePerformanceScore()}%`);
    console.groupEnd();

    // Navegación
    console.group('🧭 Navegación');
    console.log(`📄 Vistas de página: ${this.navigation.pageViews}`);
    console.log(`🔄 Cambios de ruta: ${this.navigation.routeChanges}`);
    console.log(`🖼️ Imágenes lazy: ${this.navigation.lazyLoads}`);
    console.groupEnd();

    // Cache
    console.group('📦 Cache');
    console.log(`✅ Hits: ${this.cache.hits}`);
    console.log(`❌ Misses: ${this.cache.misses}`);
    console.log(`📏 Tamaño: ${this.cache.size} entradas`);
    console.log(`🎯 Hit Rate: ${this.calculateHitRate()}%`);
    console.groupEnd();

    // Imágenes
    console.group('🖼️ Imágenes');
    console.log(`✅ Cargadas: ${this.images.loaded}`);
    console.log(`❌ Fallidas: ${this.images.failed}`);
    console.log(`🔄 Lazy loaded: ${this.images.lazyLoaded}`);
    console.log(`🎨 WebP convertidas: ${this.images.webpConverted}`);
    console.groupEnd();

    // Recomendaciones
    console.group('💡 Recomendaciones');
    this.showRecommendations();
    console.groupEnd();

    console.log('='.repeat(50));
    console.log('🎉 ¡Gracias por usar ElGuanteWeb Optimizado!');
    console.groupEnd();
  },

  // Calcular hit rate del cache
  calculateHitRate() {
    const total = this.cache.hits + this.cache.misses;
    return total > 0 ? ((this.cache.hits / total) * 100).toFixed(1) : 0;
  },

  // Mostrar recomendaciones
  showRecommendations() {
    const hitRate = parseFloat(this.calculateHitRate());

    if (hitRate < 80) {
      console.log('⚠️ Cache hit rate baja. Considera aumentar TTL del cache.');
    }

    if (this.images.failed > 0) {
      console.log('⚠️ Algunas imágenes fallaron. Verifica URLs de imágenes.');
    }

    if (this.initialLoad.duration > 2000) {
      console.log('⚠️ Tiempo de carga alto. Considera más optimizaciones.');
    }

    if (this.images.lazyLoaded < this.images.loaded * 0.5) {
      console.log(
        '💡 Pocos lazy loads. Verifica configuración de IntersectionObserver.'
      );
    }

    console.log(
      '✅ Sistema funcionando correctamente con optimizaciones Fase 2.'
    );
  },
};

// Inicializar automáticamente
if (typeof window !== 'undefined') {
  performanceMonitor.init();

  // Exponer globalmente para debugging
  window.performanceMonitor = performanceMonitor;
}

export default performanceMonitor;
