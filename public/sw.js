// =============================================================================
// SERVICE WORKER - Enhanced for Offline Support and Notifications
// =============================================================================
// This service worker provides:
// 1. Offline caching (cache-first, then network)
// 2. Background notification scheduling
// 3. Periodic sync for reminders

const CACHE_NAME = "rt-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/logo.jpg",
  "/icon-192.png",
  "/icon-512.png"
];

// Install: Cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => {
      console.log("[SW] Activated and old caches cleared");
      return self.clients.claim();
    })
  );
});

// Fetch: Cache-first strategy for GET requests
self.addEventListener("fetch", (event) => {
  // Skip non-GET and API requests
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/")) return;

  // Ignore unsupported schemes (like chrome-extension://)
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Try cache first, fallback to network
      if (cached) {
        // Update cache in background
        fetch(event.request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response);
            });
          }
        }).catch(() => { });
        return cached;
      }

      // Not in cache, fetch from network
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned);
          });
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
        return new Response("Offline", { status: 503 });
      });
    })
  );
});

// Message handler for scheduled notifications
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SCHEDULE_NOTIFICATION") {
    const { title, body, scheduledTime, tag } = event.data;
    const delay = scheduledTime - Date.now();

    if (delay > 0) {
      setTimeout(() => {
        self.registration.showNotification(title, {
          body,
          icon: "/logo.jpg",
          badge: "/icon-192.png",
          tag,
          vibrate: [200, 100, 200],
          requireInteraction: true,
          actions: [
            { action: "view", title: "View Task" },
            { action: "dismiss", title: "Dismiss" }
          ]
        });
      }, delay);
    }
  }

  if (event.data && event.data.type === "CHECK_REMINDERS") {
    checkScheduledReminders();
  }
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "view" || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // Focus existing window or open new one
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow("/");
      })
    );
  }
});

// Check reminders from localStorage (runs periodically)
async function checkScheduledReminders() {
  try {
    // Get reminders from localStorage via client
    const allClients = await clients.matchAll();
    if (allClients.length === 0) {
      console.log("[SW] No clients available for reminder check");
      return;
    }

    // Request reminders from client
    allClients[0].postMessage({ type: "GET_REMINDERS" });
  } catch (error) {
    console.log("[SW] Error checking reminders:", error);
  }
}

// Periodic background sync (if supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-reminders") {
    event.waitUntil(checkScheduledReminders());
  }
});

console.log("[SW] Service Worker loaded - v2");
