// OptiMix Service Worker v2.2.1
const CACHE_NAME = 'optimix-v2.2.1';

// 安装事件：预缓存关键资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                './',
                './index.html',
                './manifest.json',
            ]);
        })
    );
    // 立即激活新 SW，不等待旧 SW 关闭
    self.skipWaiting();
});

// 激活事件：清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    // 立即接管所有页面
    self.clients.claim();
});

// 请求拦截策略
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // 仅处理同源请求
    if (!request.url.startsWith(self.location.origin)) {
        return;
    }

    // 导航请求（页面请求）：Network First
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // 成功则缓存并返回
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // 网络失败则返回缓存
                    return caches.match(request).then((cached) => {
                        return cached || caches.match('./index.html');
                    });
                })
        );
        return;
    }

    // 静态资源（JS/CSS/图片等）：Cache First
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) {
                // 后台更新缓存
                fetch(request).then((response) => {
                    if (response && response.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, response);
                        });
                    }
                }).catch(() => { });
                return cached;
            }

            // 缓存未命中：从网络获取并缓存
            return fetch(request).then((response) => {
                if (!response || response.status !== 200) {
                    return response;
                }
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone);
                });
                return response;
            });
        })
    );
});
