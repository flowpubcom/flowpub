/* Service Worker de FlowPub — solo notificaciones push (Web Push).
   Muestra la notificación entrante y, al tocarla, enfoca/abre la app en la URL
   correspondiente (perfil, Flow o conversación). */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "FlowPub";
  const options = {
    body: data.body || "",
    icon: "/icono-192",
    badge: "/icono-192",
    tag: data.tag,
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ("focus" in client) {
            client.navigate?.(url);
            return client.focus();
          }
        }
        return self.clients.openWindow ? self.clients.openWindow(url) : undefined;
      }),
  );
});
