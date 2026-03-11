// ============================================================
// HubChat - メインプロセス (main.js) v1.2
// ============================================================

const { app, BrowserWindow, ipcMain, shell, session } = require('electron')
const path = require('path')
const Store = require('electron-store')

const store = new Store()
let mainWindow

// 完全にChromeとして偽装するUser-Agent
const CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

// ============================================================
// ウィンドウ作成
// ============================================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#1e1e2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  })

  mainWindow.webContents.setUserAgent(CHROME_UA)

  // メインウィンドウのポップアップ許可
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        width: 900,
        height: 700,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: false,
        }
      }
    }
  })

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
}

// ============================================================
// アプリ起動
// ============================================================
app.whenReady().then(() => {
  // ★ 全セッション（webview含む）のUser-Agentを強制上書き
  // これによりElectron/hubchatの文字列が完全に消える
  app.userAgentFallback = CHROME_UA

  // defaultSessionのリクエストヘッダーも書き換え
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = CHROME_UA
    callback({ requestHeaders: details.requestHeaders })
  })

  // ★ レスポンスヘッダーのCSP・X-Frame-Optionsを削除
  // Chatwork等がwebviewをブロックするのを防ぐ
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders
    if (headers) {
      // CSP削除（大文字小文字両対応）
      delete headers['content-security-policy']
      delete headers['Content-Security-Policy']
      delete headers['content-security-policy-report-only']
      delete headers['Content-Security-Policy-Report-Only']
      // X-Frame-Options削除（iframe/webviewブロック解除）
      delete headers['x-frame-options']
      delete headers['X-Frame-Options']
    }
    callback({ responseHeaders: headers })
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ============================================================
// IPC: ポップアップウィンドウを開く（LINE Business・Messenger等）
// partitionを共有することでログイン済みセッションを引き継ぐ
// ============================================================
ipcMain.handle('open-popup', (event, { url, partition }) => {
  const popup = new BrowserWindow({
    width: 1000,
    height: 750,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      partition: partition || 'persist:default',
    }
  })

  popup.webContents.setUserAgent(CHROME_UA)

  // ポップアップ内でさらにポップアップが開く場合も対応
  popup.webContents.setWindowOpenHandler(({ url: innerUrl }) => {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        width: 900,
        height: 700,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: false,
          partition: partition || 'persist:default',
        }
      }
    }
  })

  popup.loadURL(url)
})

// ============================================================
// IPC ハンドラー
// ============================================================
ipcMain.handle('store-get', (event, key, defaultValue) => {
  return store.get(key, defaultValue)
})

ipcMain.handle('store-set', (event, key, value) => {
  store.set(key, value)
})

ipcMain.handle('store-delete', (event, key) => {
  store.delete(key)
})

ipcMain.handle('store-clear', () => {
  store.clear()
})

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url)
})
