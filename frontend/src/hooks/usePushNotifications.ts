import { useEffect, useState } from 'react';

/**
 * Hook to manage web push notification subscription
 */
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check browser support
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscriptionStatus();
    } else {
      setIsSupported(false);
      setIsLoading(false);
    }
  }, []);

  /**
   * Check if user is already subscribed to push notifications
   */
  async function checkSubscriptionStatus() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking push subscription status:', err);
      setError('Failed to check subscription status');
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Subscribe to push notifications
   */
  async function subscribe(vapidPublicKey: string) {
    if (!isSupported) {
      setError('Push notifications not supported');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Register service worker
      const registration = await navigator.serviceWorker.register(
        '/service-worker.js',
        { scope: '/' }
      );

      // Check for Notification permission
      if (Notification.permission === 'denied') {
        setError('Notification permission denied');
        return false;
      }

      // Request permission if needed
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setError('Notification permission not granted');
          return false;
        }
      }

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      // Send subscription to backend
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth')),
          user_agent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to subscribe: ${response.statusText}`);
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe to push notifications';
      console.error('Push subscription error:', err);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async function unsubscribe() {
    if (!isSupported) {
      setError('Push notifications not supported');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        return true;
      }

      // Send unsubscribe request to backend
      const response = await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to unsubscribe: ${response.statusText}`);
      }

      // Unsubscribe from push manager
      await subscription.unsubscribe();
      setIsSubscribed(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsubscribe from push notifications';
      console.error('Push unsubscription error:', err);
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  };
}

/**
 * Convert VAPID public key from base64url to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
