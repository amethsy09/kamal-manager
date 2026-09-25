self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  event.waitUntil(self.registration.showNotification(data.title || "Rappel du Kammil", {
    body: data.body || "Un nouveau rappel est disponible.",
    icon: "/kaamil-dahira-logo.jpeg",
    badge: "/kaamil-dahira-logo.jpeg",
    data: { url: data.url || "/rappel" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/rappel", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => client.url.startsWith(self.location.origin));
    if (existing) { await existing.navigate(target); return existing.focus(); }
    return self.clients.openWindow(target);
  })());
});
