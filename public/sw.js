const CACHE_NAME = 'nootbuk-v1'

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/audio-worklet/pcm-recorder-processor.js',
  '/basic-pitch/model/model.json',
  '/basic-pitch/model/group1-shard1of1.bin',
]

function shouldCachePath(pathname) {
  return (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/soundfonts/') ||
    pathname.startsWith('/basic-pitch/') ||
    pathname.startsWith('/audio-worklet/') ||
    pathname.startsWith('/icons/')
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))),
    ),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) {
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone()
          void caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(async () => {
          const cached =
            (await caches.match(event.request)) ||
            (await caches.match('/index.html'))
          return cached || Response.error()
        }),
    )
    return
  }

  if (shouldCachePath(url.pathname) || PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            void caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, copy),
            )
          }
          return response
        })

        return cached || networkFetch
      }),
    )
  }
})
