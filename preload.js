// ============================================================
// HubChat - プリロードスクリプト (preload.js) v1.2
// メインプロセスとレンダラーを安全につなぐ橋渡し役
// ============================================================

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {

  // 設定の読み書き（electron-store経由）
  storeGet: (key, defaultValue) =>
    ipcRenderer.invoke('store-get', key, defaultValue),

  storeSet: (key, value) =>
    ipcRenderer.invoke('store-set', key, value),

  storeDelete: (key) =>
    ipcRenderer.invoke('store-delete', key),

  storeClear: () =>
    ipcRenderer.invoke('store-clear'),

  // 外部リンクをブラウザで開く
  openExternal: (url) =>
    ipcRenderer.invoke('open-external', url),

  // ライセンス検証
  verifyLicense: (key) =>
    ipcRenderer.invoke('verify-license', key),

  // ポップアップウィンドウを開く（セッション共有対応）
  // LINE Business・Messenger等のポップアップ対応
  openPopup: (url, partition) =>
    ipcRenderer.invoke('open-popup', { url, partition }),

  // サービスドメインリスト送信
  updateServiceDomains: (domains) =>
    ipcRenderer.send('update-service-domains', domains),

  // メインプロセスからのナビゲート指示を受信
  onNavigateInService: (callback) =>
    ipcRenderer.on('navigate-in-service', (event, url) => callback(url)),

  onSwitchToService: (callback) =>
    ipcRenderer.on('switch-to-service', (event, url) => callback(url)),


    onCycleService: (callback) =>
      ipcRenderer.on("cycle-service", (event, direction) => callback(direction)),
  // 実行中のOS（'darwin' = Mac, 'win32' = Windows）
  platform: process.platform,
})
