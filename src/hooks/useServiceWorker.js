// src/hooks/useServiceWorker.js
import { useState, useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export const useServiceWorker = () => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Verificar si Service Workers están soportados
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    } else {
      console.log('Service Workers no soportados en este navegador');
    }
  }, []);

  useEffect(() => {
    const setupMessaging = () => {
      if ('serviceWorker' in navigator && 'Notification' in window) {
        const messaging = getMessaging();

        // Request permission
        Notification.requestPermission()
          .then(permission => {
            if (permission === 'granted') {
              getToken(messaging, {
                vapidKey: import.meta.env.VITE_FCM_VAPID_KEY,
              })
                .then(token => {
                  console.log('FCM Token:', token);
                })
                .catch(error => {
                  console.error('Error getting FCM token:', error);
                });
            }
          })
          .catch(error => {
            console.error('Error requesting notification permission:', error);
          });

        // Listen for messages
        onMessage(messaging, payload => {
          console.log('Foreground message:', payload);
          // Note: useToast hook cannot be used here as it's not a React component
          // This would need to be handled differently, perhaps through a global toast system
        });
      }
    };

    setupMessaging();
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('✅ Service Worker registrado:', registration);

      setRegistration(registration);
      setIsRegistered(true);

      // Manejar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          setIsUpdating(true);

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setUpdateAvailable(true);
              setIsUpdating(false);
            }
          });
        }
      });

      // Escuchar mensajes del Service Worker
      navigator.serviceWorker.addEventListener('message', event => {
        const { type, data } = event.data;

        switch (type) {
          case 'CACHE_INFO':
            console.log('📊 Información del cache:', data);
            break;
          case 'OFFLINE_READY':
            console.log('🔌 Aplicación lista para modo offline');
            break;
          default:
            console.log('Mensaje del SW:', type, data);
        }
      });
    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
    }
  };

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      window.location.reload();
    }
  };

  const getCacheInfo = async () => {
    if (registration && registration.active) {
      return new Promise(resolve => {
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = event => {
          resolve(event.data);
        };

        registration.active.postMessage({ type: 'GET_CACHE_INFO' }, [
          messageChannel.port2,
        ]);
      });
    }
    return null;
  };

  const clearCache = async () => {
    if (registration && registration.active) {
      return new Promise((resolve, reject) => {
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = event => {
          if (event.data.success) {
            resolve(true);
          } else {
            reject(new Error(event.data.error));
          }
        };

        registration.active.postMessage({ type: 'CLEAR_CACHE' }, [
          messageChannel.port2,
        ]);
      });
    }
    return false;
  };

  const sendMessageToSW = message => {
    if (registration && registration.active) {
      registration.active.postMessage(message);
    }
  };

  return {
    isRegistered,
    isUpdating,
    updateAvailable,
    registration,
    updateServiceWorker,
    getCacheInfo,
    clearCache,
    sendMessageToSW,
  };
};
