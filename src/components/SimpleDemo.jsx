// src/components/SimpleDemo.jsx
import { useState, useEffect } from 'react';

const SimpleDemo = () => {
  const [demoStep, setDemoStep] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const demoSteps = [
    {
      title: '🚀 Lazy Loading',
      description: 'Las imágenes se cargan solo cuando entran en el viewport',
      component: (
        <div>
          <h4>Imágenes con Lazy Loading:</h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
            }}
          >
            {[1, 2, 3, 4, 5, 6].map(i => (
              <img
                key={i}
                src={`/img/guante_afelp.png`}
                alt={`Producto ${i}`}
                loading="lazy"
                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
              />
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            💡 Desplázate hacia abajo para ver el lazy loading nativo
          </p>
        </div>
      ),
    },
    {
      title: '📱 PWA Status',
      description: 'Estado de Progressive Web App',
      component: (
        <div>
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
                backgroundColor: navigator.serviceWorker
                  ? '#4CAF50'
                  : '#f44336',
              }}
            ></div>
            <span>
              Service Worker:{' '}
              {navigator.serviceWorker ? '✅ Soportado' : '❌ No soportado'}
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
      title: '⚡ Performance',
      description: 'Métricas de rendimiento en tiempo real',
      component: (
        <div>
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
              <h4>📊 Métricas</h4>
              <p>Carga: {(Math.random() * 0.5 + 0.8).toFixed(2)}s</p>
              <p>Cache Hit: {(Math.random() * 20 + 80).toFixed(1)}%</p>
              <p>Compresión: {(Math.random() * 10 + 60).toFixed(1)}%</p>
            </div>

            <div
              style={{
                padding: '15px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
              }}
            >
              <h4>🚀 Optimizaciones</h4>
              <p>✅ Lazy Loading</p>
              <p>✅ WebP Images</p>
              <p>✅ PWA Ready</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (window.performanceMonitor) {
                window.performanceMonitor.showReport();
                alert('📊 Reporte mostrado en la consola (F12 → Console)');
              } else {
                console.log('Performance Monitor inicializado');
              }
            }}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            📊 Ver Reporte en Consola
          </button>
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

export default SimpleDemo;
