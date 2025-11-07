// src/components/PerformanceDemo.jsx
import { useState, useEffect, useCallback } from 'react';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { useSmartCache } from '../hooks/useSmartCache';
import LazyImage from './LazyImage';

const PerformanceDemo = () => {
  const [demoStep, setDemoStep] = useState(0);
  const [metrics, setMetrics] = useState({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);


  const {
    isSupported: swSupported,
    isRegistered: swRegistered,
    updateAvailable,
    updateServiceWorker,
  } = useServiceWorker();

  const { getCacheStats } = useSmartCache();

  useEffect(() => {
    // Monitorear estado de conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Obtener métricas iniciales
    updateMetrics();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateMetrics]);

  const updateMetrics = useCallback(() => {
    const cacheStats = getCacheStats();

    // Simular métricas de performance
    const perfMetrics = {
      loadTime: Math.random() * 0.5 + 0.8, // 0.8-1.3s
      cacheHitRate: Math.random() * 20 + 80, // 80-100%
      imageCompression: Math.random() * 10 + 60, // 60-70%
      bundleSize: Math.random() * 100 + 200, // 200-300KB
      ...cacheStats,
    };

    setMetrics(perfMetrics);
  }, [getCacheStats]);

  const demoSteps = [
    {
      title: '🚀 Lazy Loading en Acción',
      description: 'Las imágenes se cargan solo cuando entran en el viewport',
      component: (
        <div className="demo-images">
          <h4>Imágenes con Lazy Loading:</h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
            }}
          >
            {[1, 2, 3, 4, 5, 6].map(i => (
              <LazyImage
                key={i}
                src={`/img/guante_afelp.png`}
                alt={`Producto ${i}`}
                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
              />
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            💡 Desplázate hacia abajo para ver el lazy loading en acción
          </p>
        </div>
      ),
    },
    {
      title: '📱 PWA - Progressive Web App',
      description: 'Tu app funciona como nativa y offline',
      component: (
        <div className="demo-pwa">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: swSupported ? '#4CAF50' : '#f44336',
              }}
            ></div>
            <span>
              Service Worker: {swSupported ? '✅ Soportado' : '❌ No soportado'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: swRegistered ? '#4CAF50' : '#ff9800',
              }}
            ></div>
            <span>
              Service Worker:{' '}
              {swRegistered ? '✅ Registrado' : '⏳ Registrando...'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: isOnline ? '#4CAF50' : '#f44336',
              }}
            ></div>
            <span>Conexión: {isOnline ? '🟢 Online' : '🔴 Offline'}</span>
          </div>

          {updateAvailable && (
            <div
              style={{
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#e3f2fd',
                borderRadius: '5px',
              }}
            >
              <p>📢 ¡Nueva versión disponible!</p>
              <button
                onClick={updateServiceWorker}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                Actualizar Ahora
              </button>
            </div>
          )}

          <div style={{ marginTop: '15px', fontSize: '14px' }}>
            <h4>Funcionalidades PWA:</h4>
            <ul style={{ paddingLeft: '20px' }}>
              <li>📦 Cache inteligente</li>
              <li>🔄 Sincronización offline</li>
              <li>📱 Instalable como app</li>
              <li>🔔 Notificaciones push</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: '⚡ Cache Inteligente',
      description: 'Sistema de cache optimizado con TTL automático',
      component: (
        <div className="demo-cache">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '15px',
            }}
          >
            <div
              style={{
                padding: '15px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
              }}
            >
              <h4>📊 Estadísticas del Cache</h4>
              <p>Tamaño: {metrics.size || 0} entradas</p>
              <p>Máximo: {metrics.maxSize || 100} entradas</p>
              <p>TTL: {(metrics.cacheDuration || 300000) / 1000}s</p>
            </div>

            <div
              style={{
                padding: '15px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
              }}
            >
              <h4>🚀 Métricas de Performance</h4>
              <p>Carga: {(metrics.loadTime || 1).toFixed(2)}s</p>
              <p>Cache Hit: {(metrics.cacheHitRate || 85).toFixed(1)}%</p>
              <p>Compresión: {(metrics.imageCompression || 65).toFixed(1)}%</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button
              onClick={updateMetrics}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              🔄 Actualizar Métricas
            </button>

            <button
              onClick={() => {
                if (window.performanceMonitor) {
                  window.performanceMonitor.showReport();
                  alert('📊 Reporte mostrado en la consola (F12 → Console)');
                } else {
                  console.log('Performance Monitor no disponible');
                }
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              📊 Ver Reporte
            </button>
          </div>
        </div>
      ),
    },
    {
      title: '🖼️ Optimización de Imágenes',
      description: 'Conversión automática a WebP con compresión',
      component: (
        <div className="demo-images">
          <h4>Optimización WebP:</h4>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '15px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <img
                src="/img/guante_afelp.png"
                alt="Original"
                style={{
                  width: '100px',
                  height: '100px',
                  objectFit: 'cover',
                  border: '2px solid #ccc',
                }}
              />
              <p style={{ fontSize: '12px', marginTop: '5px' }}>Original</p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <LazyImage
                src="/img/guante_afelp.png"
                alt="Optimizado"
                style={{
                  width: '100px',
                  height: '100px',
                  objectFit: 'cover',
                  border: '2px solid #4CAF50',
                }}
              />
              <p style={{ fontSize: '12px', marginTop: '5px' }}>
                WebP Optimizado
              </p>
            </div>
          </div>

          <div style={{ fontSize: '14px', color: '#666' }}>
            <p>
              🎯 <strong>Beneficios:</strong>
            </p>
            <ul style={{ paddingLeft: '20px' }}>
              <li>📏 60-70% reducción de tamaño</li>
              <li>⚡ Carga más rápida</li>
              <li>📱 Mejor experiencia móvil</li>
              <li>🔄 Conversión automática</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '350px',
        backgroundColor: 'white',
        border: '2px solid #2196F3',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        zIndex: 1000,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#2196F3' }}>
          🎯 Demo Fase 2 - Optimizaciones
        </h3>
        <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
          {demoSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setDemoStep(index)}
              style={{
                padding: '5px 10px',
                border: 'none',
                borderRadius: '5px',
                backgroundColor: demoStep === index ? '#2196F3' : '#e3f2fd',
                color: demoStep === index ? 'white' : '#2196F3',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>
          {demoSteps[demoStep].title}
        </h4>
        <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
          {demoSteps[demoStep].description}
        </p>
      </div>

      <div>{demoSteps[demoStep].component}</div>

      <div
        style={{
          marginTop: '20px',
          paddingTop: '15px',
          borderTop: '1px solid #eee',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '12px', color: '#666' }}>
            Paso {demoStep + 1} de {demoSteps.length}
          </span>
          <div>
            <button
              onClick={() =>
                setDemoStep(
                  (demoStep - 1 + demoSteps.length) % demoSteps.length
                )
              }
              style={{
                padding: '5px 10px',
                marginRight: '5px',
                border: '1px solid #ccc',
                borderRadius: '3px',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              ←
            </button>
            <button
              onClick={() => setDemoStep((demoStep + 1) % demoSteps.length)}
              style={{
                padding: '5px 10px',
                border: '1px solid #ccc',
                borderRadius: '3px',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDemo;
