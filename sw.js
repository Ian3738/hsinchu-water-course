/* ============================================================
   Service worker
   ------------------------------------------------------------
   解決兩件事：

   1. 改版之後學生載到舊程式。
      GitHub Pages 對靜態檔送 max-age=600，改版後十分鐘內
      瀏覽器會直接吃快取，不回頭問伺服器。之前「按鈕沒反應」
      「關卡說已解開卻過不去」都是這樣來的。
      → 程式與頁面一律網路優先，拿到就更新快取。

   2. 教室網路不穩。
      → 網路失敗時回頭用快取，課照上。

   圖片與影片不會改，走快取優先，省流量也快。

   關掉的方法：網址加 ?nosw=1，會註銷並清掉快取。
   ============================================================ */

const VERSION = 'hwc-20260817-2013';
const CODE = `${VERSION}-code`;
const ASSET = `${VERSION}-asset`;

/* 網路優先：頁面與程式 */
const isCode = url =>
  /\.(?:html|js|mjs|css|json)$/.test(url.pathname) ||
  url.pathname.endsWith('/');

/* 快取優先：不會變的東西 */
const isAsset = url =>
  /\.(?:webp|png|jpe?g|svg|gif|mp4|webm|mp3|ogg|woff2?)$/.test(url.pathname);

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => !n.startsWith(VERSION)).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // 字型、Firebase 之類交給瀏覽器自己處理

  if (isAsset(url)) {
    e.respondWith((async () => {
      const cache = await caches.open(ASSET);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch (err) {
        return hit || Response.error();
      }
    })());
    return;
  }

  if (isCode(url)) {
    e.respondWith((async () => {
      const cache = await caches.open(CODE);
      try {
        // cache: 'reload' 確保真的去問伺服器，不吃 HTTP 快取
        const res = await fetch(req, { cache: 'reload' });
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch (err) {
        const hit = await cache.match(req);
        if (hit) return hit;
        // 連首頁都沒有就只能讓它失敗
        throw err;
      }
    })());
  }
});
