/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (string | PrecacheEntry)[] | undefined;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname === "/" && url.searchParams.has("share") && event.request.method === "POST") {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const file = formData.get("file");
        if (file instanceof File) {
          const cache = await caches.open("shared-assets");
          await cache.put("shared-image", new Response(file));
        }
        return Response.redirect("/?share-target=true", 303);
      })()
    );
    return;
  }
});

serwist.addEventListeners();
