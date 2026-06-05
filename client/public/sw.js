/**
 * Flight Drama Service Worker — Web Push Notifications
 * Handles push events and shows desktop/mobile notifications
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Flight Drama', body: event.data.text(), url: '/' };
  }

  const title = data.title || 'Flight Drama ✈';
  const options = {
    body: data.body || 'Breaking aviation news',
    icon: '/logo192.png',
    badge: '/logo192.png',
    image: data.image || undefined,
    data: { url: data.url || '/' },
    tag: data.tag || 'flight-drama-breaking',
    renotify: true,
    requireInteraction: data.breaking || false,
    actions: [
      { action: 'read', title: 'Read Now ✈' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if already open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
