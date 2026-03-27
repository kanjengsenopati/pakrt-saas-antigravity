/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// Handle Push Notifications
self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const { title, body, icon, image, data: customData } = data;

        const options: any = {
            body,
            icon: icon || '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            image: image,
            data: customData,
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            tag: 'pakrt-notification',
            renotify: true,
            actions: [
                { action: 'open', title: 'Buka Aplikasi' },
                { action: 'close', title: 'Tutup' }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
        
        // Note: Sound is typically handled by the OS/Browser based on importance.
        // Custom sound in background is limited, but we'll try to trigger audio if app is open
        // via postMessage to the client.
        self.clients.matchAll({ type: 'window' }).then((clients) => {
            clients.forEach((client) => {
                client.postMessage({
                    type: 'PUSH_NOTIFICATION_RECEIVED',
                    payload: data
                });
            });
        });

    } catch (err) {
        console.error('Push event error:', err);
    }
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') return;

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});
