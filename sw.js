/* ============================================================================
   SK Sarees — Service Worker (Web Push notifications)
   Shows push notifications (incl. abandoned-cart reminders) even when the
   site tab is closed, and opens the right page on click.
   ========================================================================== */
'use strict';
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(self.clients.claim());
});
/* Firebase Messaging compat payloads (data.message / data.notification) too */
self.addEventListener('push', function(e){
  let data = {};
  try{
    if (e.data){
      const j = e.data.json();
      data = j.notification || j.data || j || {};
    }
  }catch(err){ try{ data = { title: 'SK Sarees', body: String(e.data || '') }; }catch(e2){} }
  const title = data.title || '🪡 SK Sarees';
  const options = {
    body: data.body || data.message || 'Your saree cart is waiting for you!',
    icon: data.icon || 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: data.tag || 'sk-sarees',
    renotify: true,
    data: { url: data.url || './cart.html' },
    vibrate: [100, 50, 100],
  };
  e.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './cart.html';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
    for (const c of list){
      if (c.url.indexOf(self.location.origin) === 0){ c.navigate(url); return c.focus(); }
    }
    return clients.openWindow(url);
  }));
});
