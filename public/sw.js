self.addEventListener("push", function (event) {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Neighborhood Watch", body: event.data.text() };
  }

  const url = data.url || "/alerts";

  const options = {
    body: data.body,
    icon: data.icon || "/icon.png",
    badge: data.badge || "/badge.png",
    vibrate: [100, 50, 100],
    data: { url },
  };

  event.waitUntil(self.registration.showNotification(data.title || "Alert", options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const target = event.notification?.data?.url || "/alerts";
  const fullUrl = new URL(target, self.location.origin).toString();

  event.waitUntil(clients.openWindow(fullUrl));
});
