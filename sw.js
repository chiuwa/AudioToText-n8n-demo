const CACHE_NAME = 'audio-ai-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/js/logger.js',
  '/js/fileHandler.js', 
  '/js/audioProcessor.js',
  '/js/uiController.js',
  '/js/app.js',
  '/manifest.json'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 攔截網路請求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在快取中找到，直接返回
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// 處理分享的檔案
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // 檢查是否為分享請求 - 支援兩種路徑
  if (event.request.method === 'POST' && (url.pathname === '/' || url.pathname === '/share')) {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request) {
  try {
    console.log('處理分享請求:', request.url);
    
    const formData = await request.formData();
    const files = formData.getAll('media');
    
    console.log('接收到檔案數量:', files.length);
    
    if (files && files.length > 0) {
      // 儲存分享的檔案到暫存
      const sharedFile = files[0];
      console.log('分享檔案詳情:', {
        name: sharedFile.name,
        type: sharedFile.type,
        size: sharedFile.size
      });
      
      // 等待客戶端準備就緒
      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window'
      });
      
      if (clients.length > 0) {
        // 發送給現有客戶端
        clients[0].postMessage({
          type: 'SHARED_FILE',
          file: sharedFile
        });
        console.log('檔案已發送給現有客戶端');
      } else {
        // 如果沒有現有客戶端，儲存檔案供稍後使用
        console.log('沒有現有客戶端，將重定向到首頁');
      }
    } else {
      console.log('沒有接收到檔案');
    }
    
    // 返回主頁面，添加查詢參數表示這是分享操作
    return Response.redirect('/?shared=true', 302);
    
  } catch (error) {
    console.error('處理分享檔案時出錯:', error);
    // 即使出錯也要重定向到首頁
    return Response.redirect('/?error=share_failed', 302);
  }
} 