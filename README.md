# 🎙️ Audio Video AI Transcription PWA

> 一個基於 PWA 技術的智能音訊影片轉文字應用，支援網頁錄音、檔案上傳、WhatsApp 分享等多種方式，透過 AI 進行音訊分析並生成逐字稿。

[![PWA](https://img.shields.io/badge/PWA-ready-brightgreen.svg)](https://developers.google.com/web/progressive-web-apps/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![SOLID](https://img.shields.io/badge/Architecture-SOLID-blue.svg)](https://en.wikipedia.org/wiki/SOLID)

## ✨ 專案特色

這是一個完整的**漸進式網頁應用程式（PWA）**，結合了現代 Web 技術與人工智能，為用戶提供便捷的音訊影片轉文字服務。

### 🎯 核心功能

- 🎙️ **網頁錄音** - 直接在瀏覽器中錄音，無需安裝額外軟體
- 📁 **檔案上傳** - 支援拖拽上傳，多種音訊影片格式
- 📱 **WhatsApp 分享** - 從 WhatsApp 直接分享音訊到應用
- 🤖 **AI 轉文字** - 整合 AI 服務進行音訊分析
- 📝 **逐字稿顯示** - 時間軸精確的逐字稿界面
- 💾 **多格式匯出** - JSON、TXT、SRT 字幕格式
- 📱 **PWA 支援** - 可安裝為手機應用

### 🎨 設計亮點

- **響應式布局** - 適配各種螢幕尺寸
- **現代化 UI** - 漸變背景、動畫效果
- **無障礙設計** - 考慮使用者體驗

## 🚀 功能展示

### 錄音功能
```
✅ 瀏覽器麥克風權限管理
✅ 即時錄音狀態顯示
✅ 錄音時間計時器
✅ 自動音頻格式優化
```

### 檔案支援
```
🎵 音訊格式: MP3, WAV, M4A, FLAC, OGG, AAC, WEBM
🎬 影片格式: MP4, MOV, AVI, WEBM, 3GP
📏 檔案限制: 最大 20MB
```

### PWA 功能
```
📱 可安裝到桌面
🔄 離線快取
📤 分享目標支援
🔔 背景同步
```

## 🛠️ 技術架構

本專案採用**模組化設計**，遵循 **SOLID 原則**：

### 核心模組

#### 🎙️ AudioRecorder 
```javascript
- 網頁錄音功能
- 麥克風權限管理
- MediaRecorder API 整合
- 音頻格式自動選擇
- 資源清理管理
```

#### 📁 FileHandler
```javascript
- 多格式檔案驗證
- Base64 編碼轉換
- 檔案資訊擷取
- 大小限制檢查
```

#### 🤖 AudioProcessor
```javascript
- Webhook API 通訊
- 複雜回應解析
- 錯誤處理機制
- 逐字稿格式化
```

#### 🎨 UIController
```javascript
- 動態 UI 更新
- 媒體預覽功能
- 逐字稿顯示
- 匯出功能管理
```

#### 📱 Service Worker
```javascript
- 檔案分享處理
- 離線資源快取
- 後台檔案同步
- 安裝提示管理
```


### 雲端部署
專案已優化用於以下平台：
- **Cloudflare Pages** ⭐ 推薦
- **Netlify**
- **Vercel**
- **GitHub Pages**

### 環境需求
- **HTTPS** - 錄音功能必須
- **現代瀏覽器** - 支援 MediaRecorder API
- **PWA 支援** - Service Worker、Web App Manifest

## 🔧 配置說明

### AI 服務整合
```javascript
// 在 audioProcessor.js 中配置您的 AI 服務端點
const WEBHOOK_URL = 'YOUR_AI_SERVICE_ENDPOINT';
```

### PWA 自定義
```json
// manifest.json - 應用資訊
{
  "name": "您的應用名稱",
  "short_name": "簡短名稱",
  "start_url": "/",
  "display": "standalone"
}
```

## 📱 使用指南

### iPhone WhatsApp 分享設定
1. **Safari 安裝 PWA** - 點擊分享 → 加入主畫面
2. **WhatsApp 分享** - 長按音訊 → 分享 → 選擇應用
3. **等待識別** - 系統需要 10-30 分鐘識別新安裝的 PWA

### 網頁錄音使用
1. **授權麥克風** - 首次使用需授權
2. **開始錄音** - 點擊錄音按鈕
3. **即時監控** - 查看錄音狀態和時間
4. **停止處理** - 停止後自動轉為音訊檔案

## 🌟 特色功能詳解

### 智能 API 解析
```javascript
- 陣列格式逐字稿
- 巢狀物件結構
- Markdown 代碼塊解析
- 容錯機制
```

### 逐字稿功能
```javascript
- 時間軸顯示/隱藏
- 分段式內容展示
- 多格式匯出（JSON/TXT/SRT）
- 響應式界面
```

### 媒體預覽
```javascript
- 音訊影片預覽
- HTML5 播放器整合
- 時長自動檢測
- 載入狀態管理
- 錯誤處理
```

## 🎯 瀏覽器相容性

| 功能 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| 基本功能 | ✅ | ✅ | ✅ | ✅ |
| 網頁錄音 | ✅ | ✅ | ✅ (iOS 14.3+) | ✅ |
| PWA 安裝 | ✅ | ✅ | ✅ | ✅ |
| 分享目標 | ✅ | ✅ | ✅ | ✅ |




⭐ 如果這個專案對您有幫助，請給個 Star！