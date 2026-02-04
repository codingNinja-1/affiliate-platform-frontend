// Service Worker for Web Push Notifications
// Save as: public/service-worker.js

const CACHE_NAME = 'affiliate-platform-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  if (!event.data) {
    console.log('No data in push notification');
    return;
  }

  try {
    const data = event.data.json();
    const {
      title = 'Affiliate Platform',
      body = 'You have a new notification',
      icon = '/icon-192x192.png',
      badge = '/icon-72x72.png',
      tag = 'notification',
      data: customData = {},
    } = data;

    const options = {
      body,
      icon,
      badge,
      tag, // Only show one notification per tag
      requireInteraction: false,
      data: {
        dateOfArrival: Date.now(),
        ...customData,
      },
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('Affiliate Platform', {
        body: 'You have a new notification',
        tag: 'notification',
      })
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const clickedNotification = event.notification;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if the app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }

      // If app is not open, open it
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});

// Fetch event (for caching strategies if needed)
self.addEventListener('fetch', (event) => {
  // You can add caching strategies here if needed
});
