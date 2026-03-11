// ============================================================
// HubChat - メインプロセス (main.js) v1.9
// ============================================================

const { app, BrowserWindow, ipcMain, shell, session } = require('electron')
const { autoUpdater } = require("electron-updater")


// ── 許可ドメインリスト（アプリ内で開く） ──
const ALLOWED_DOMAINS = [
  'slack.com','mail.google.com','outlook.live.com','outlook.office.com','login.microsoftonline.com',
  'teams.microsoft.com','discord.com','chatwork.com','chat.google.com',
  'line.worksmobile.com','chat.line.biz','manager.line.biz',
  'instagram.com','messenger.com','x.com','twitter.com',
  'whatsapp.com','skype.com','telegram.org',
  'accounts.google.com','login.live.com','appleid.apple.com',
  'github.com','notion.so','trello.com','asana.com',
  'zoom.us','calendar.google.com','drive.google.com',
  'ydk-business.com','chatgpt.com','cdn.oaistatic.com'
]

function isAllowedDomain(url) {
  try {
    const hostname = new URL(url).hostname
    return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))
  } catch { return false }
}

const path = require('path')
const Store = require('electron-store')

const store = new Store()
let mainWindow
let addedServiceDomains = []

const CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'

const BROWSER_SPOOF_JS = `
(function() {
  try {
    Object.defineProperty(navigator, 'userAgentData', {
      get: function() {
        return {
          brands: [
            { brand: "Chromium", version: "137" },
            { brand: "Google Chrome", version: "137" },
            { brand: "Not=A?Brand", version: "24" }
          ],
          mobile: false,
          platform: "macOS",
          getHighEntropyValues: function(hints) {
            return Promise.resolve({
              brands: [
                { brand: "Chromium", version: "137" },
                { brand: "Google Chrome", version: "137" },
                { brand: "Not=A?Brand", version: "24" }
              ],
              mobile: false,
              platform: "macOS",
              platformVersion: "15.0.0",
              architecture: "x86",
              bitness: "64",
              model: "",
              uaFullVersion: "137.0.0.0",
              fullVersionList: [
                { brand: "Chromium", version: "137.0.0.0" },
                { brand: "Google Chrome", version: "137.0.0.0" },
                { brand: "Not=A?Brand", version: "24.0.0.0" }
              ]
            });
          },
          toJSON: function() {
            return {
              brands: [
                { brand: "Chromium", version: "137" },
                { brand: "Google Chrome", version: "137" },
                { brand: "Not=A?Brand", version: "24" }
              ],
              mobile: false,
              platform: "macOS"
            };
          }
        };
      }
    });
    delete window.process;
    delete window.require;
    delete window.__electron_contextBridge;
  } catch(e) {}
})();
`

// WebAuthn が要求されたときにパスワード認証にフォールバックさせるスクリプト
const MS_WEBAUTHN_BYPASS_JS = `
(function() {
  try {
    // WebAuthn API を無効化して、Microsoft にパスワード認証へフォールバックさせる
    if (navigator.credentials) {
      navigator.credentials.get = function() {
        return Promise.reject(new DOMException('WebAuthn not supported', 'NotAllowedError'));
      };
      navigator.credentials.create = function() {
        return Promise.reject(new DOMException('WebAuthn not supported', 'NotAllowedError'));
      };
    }
    // PublicKeyCredential を未定義にする
    Object.defineProperty(window, 'PublicKeyCredential', {
      get: function() { return undefined; },
      configurable: true
    });
  } catch(e) {}
})();
`

function applySessionFixes(ses) {
  if (ses._hubchatFixed) return
  ses._hubchatFixed = true

  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = CHROME_UA
    callback({ requestHeaders: details.requestHeaders })
  })

  ses.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders
    if (headers) {
      delete headers['content-security-policy']
      delete headers['Content-Security-Policy']
      delete headers['content-security-policy-report-only']
      delete headers['Content-Security-Policy-Report-Only']
      delete headers['x-frame-options']
      delete headers['X-Frame-Options']
    }
    callback({ responseHeaders: headers })
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: require('path').join(__dirname, 'build', 'icon.png'),
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

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const currentUrl = mainWindow.webContents.getURL()
    // 認証URLはポップアップ許可（Google OAuth等）
    if (isAuthUrl(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500, height: 700,
          webPreferences: { nodeIntegration: false, contextIsolation: false }
        }
      }
    }
    // 同じドメイン → 現在のwebviewでナビゲート指示
    if (isSameDomain(currentUrl, url)) {
      mainWindow.webContents.send('navigate-in-service', url)
      return { action: 'deny' }
    }
    // 追加済みサービスのドメイン → そのタブに切替指示
    if (isAddedServiceDomain(url)) {
      mainWindow.webContents.send('switch-to-service', url)
      return { action: 'deny' }
    }
    // その他 → 外部ブラウザ
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('did-attach-webview', (event, webviewContents) => {
    const ses = webviewContents.session
    applySessionFixes(ses)
    webviewContents.setUserAgent(CHROME_UA)


    // ショートカットキー: webviewフォーカス中でもCmd/Ctrl+Shift+Arrow を捕捉
    webviewContents.on("before-input-event", (event, input) => {
      const modOk = process.platform === "darwin"
        ? (input.meta && input.shift && !input.alt)
        : (input.control && input.shift && !input.alt)
      if (!modOk) return
      if (input.key !== "ArrowUp" && input.key !== "ArrowDown") return
      event.preventDefault()
      mainWindow.webContents.send("cycle-service", input.key === "ArrowDown" ? "down" : "up")
    })
    // webview内のwindow.openを制御
    // リンククリックのデバッグログ
    webviewContents.on('will-navigate', (e, url) => {
      console.log('[HubChat-NAV] will-navigate:', url)
    })

    webviewContents.setWindowOpenHandler(({ url: popupUrl }) => {
      console.log('[HubChat-NAV] setWindowOpenHandler called:', popupUrl)
      if (!popupUrl || popupUrl === 'about:blank') return { action: 'deny' }
      const authDomains = ['accounts.google.com','login.microsoftonline.com','login.live.com','appleid.apple.com','auth.line.me','access.line.me','oauth.line.me']
      try {
        const h = new URL(popupUrl).hostname
        // 認証URL → ポップアップ許可
        if (authDomains.some(d => h === d || h.endsWith('.' + d))) {
          return { action: 'allow', overrideBrowserWindowOptions: { width: 500, height: 700, webPreferences: { nodeIntegration: false, contextIsolation: false } } }
        }
        // 同じドメイン → レンダラーにwebview内ナビゲート指示
        const currentHost = new URL(webviewContents.getURL()).hostname
        const linkBase = h.split('.').slice(-2).join('.')
        const curBase = currentHost.split('.').slice(-2).join('.')
        if (linkBase === curBase) {
          mainWindow.webContents.send('navigate-in-service', popupUrl)
          return { action: 'deny' }
        }
        // 追加済みサービス → タブ切替指示
        console.log('[HubChat-NAV] checking addedServiceDomains:', addedServiceDomains)
        console.log('[HubChat-NAV] h:', h, 'linkBase:', linkBase)
        const matched = addedServiceDomains && addedServiceDomains.some(d => {
          const result = h === d || h.endsWith('.' + d) || linkBase === d.split('.').slice(-2).join('.')
          if (result) console.log('[HubChat-NAV] MATCHED domain:', d)
          return result
        })
        console.log('[HubChat-NAV] matched:', matched)
        if (matched) {
          mainWindow.webContents.send('switch-to-service', popupUrl)
          return { action: 'deny' }
        }
      } catch(e) { console.log('[HubChat-NAV] ERROR in handler:', e) }
      // その他 → 外部ブラウザ
      console.log('[HubChat-NAV] opening externally:', popupUrl)
      shell.openExternal(popupUrl)
      return { action: 'deny' }
    })

    webviewContents.on('did-start-loading', () => {
      webviewContents.executeJavaScript(BROWSER_SPOOF_JS).catch(() => {})
    })

    webviewContents.on('dom-ready', () => {
      webviewContents.executeJavaScript(BROWSER_SPOOF_JS).catch(() => {})
      // Microsoft 認証ページでは WebAuthn を無効化
      const url = webviewContents.getURL()
      if (url.includes('login.microsoftonline.com') || url.includes('login.live.com')) {
        webviewContents.executeJavaScript(MS_WEBAUTHN_BYPASS_JS).catch(() => {})
        console.log('[HubChat] WebAuthn bypass injected for:', url)
      }
    })

    // ナビゲーション時にも注入
    webviewContents.on('did-navigate', (e, url) => {
      if (url.includes('login.microsoftonline.com') || url.includes('login.live.com')) {
        webviewContents.executeJavaScript(MS_WEBAUTHN_BYPASS_JS).catch(() => {})
        console.log('[HubChat] WebAuthn bypass injected on navigate:', url)
      }
    })

    webviewContents.on('did-navigate-in-page', (e, url) => {
      if (url.includes('login.microsoftonline.com') || url.includes('login.live.com')) {
        webviewContents.executeJavaScript(MS_WEBAUTHN_BYPASS_JS).catch(() => {})
      }
    })
  })

    // rendererのconsole.logをターミナルに転送
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log('[Renderer]', message)
  })

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
}


// 追加済みサービスのドメインリストを受信（トップレベル）
ipcMain.on('update-service-domains', (event, domains) => {
  addedServiceDomains = domains || []
  console.log('[HubChat-main] received domains:', addedServiceDomains)
})

app.whenReady().then(() => {
  app.userAgentFallback = CHROME_UA
  applySessionFixes(session.defaultSession)

  createWindow()


  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})


  ipcMain.handle('open-popup', (event, { url, partition }) => {
  const ses = session.fromPartition(partition || 'persist:default')
  applySessionFixes(ses)

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

  popup.webContents.setWindowOpenHandler(({ url: innerUrl }) => {
    const currentUrl = popup.webContents.getURL()
    if (isSameDomain(currentUrl, innerUrl) || isAuthUrl(innerUrl)) {
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
    }
    shell.openExternal(innerUrl)
    return { action: 'deny' }
  })

  popup.loadURL(url)
})

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


ipcMain.handle('verify-license', async (event, key) => {
  try {
    const net = require('electron').net
    return new Promise((resolve) => {
      const postData = JSON.stringify({ action: 'verify', key: key })
      const request = net.request({
        method: 'POST',
        url: 'https://ydk-business.com/hubchat/api/license.php',
      })
      request.setHeader('Content-Type', 'application/json')
      let body = ''
      request.on('response', (response) => {
        response.on('data', (chunk) => { body += chunk.toString() })
        response.on('end', () => {
          try { resolve(JSON.parse(body)) }
          catch(e) { resolve({ status: 'error', message: 'Parse error' }) }
        })
      })
      request.on('error', (err) => {
        resolve({ status: 'error', message: err.message })
      })
      request.write(postData)
      request.end()
    })
  } catch(e) {
    return { status: 'error', message: e.message }
  }
})

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url)
})

// ============================================
// 自動アップデート（electron-updater）
// ============================================
app.on('ready', () => {
  setTimeout(() => {
    autoUpdater.logger = require('electron').app.getPath ? console : console
    autoUpdater.autoDownload = false
    autoUpdater.checkForUpdates().catch(err => console.log('[AutoUpdater] check error:', err))
  }, 5000)
})

autoUpdater.on('update-available', (info) => {
  console.log('[AutoUpdater] update available:', info.version)
  const { dialog } = require('electron')
  dialog.showMessageBox({
    type: 'info',
    title: 'アップデート',
    message: `新しいバージョン v${info.version} が利用可能です。ダウンロードしますか？`,
    buttons: ['ダウンロード', 'あとで']
  }).then(result => {
    if (result.response === 0) autoUpdater.downloadUpdate()
  })
})

autoUpdater.on('update-not-available', () => {
  console.log('[AutoUpdater] no update available')
})

autoUpdater.on('download-progress', (progress) => {
  console.log(`[AutoUpdater] download: ${Math.round(progress.percent)}%`)
})

autoUpdater.on('update-downloaded', () => {
  console.log('[AutoUpdater] download complete')
  const { dialog } = require('electron')
  dialog.showMessageBox({
    type: 'info',
    title: 'アップデート完了',
    message: 'アップデートのダウンロードが完了しました。再起動して適用しますか？',
    buttons: ['再起動', 'あとで']
  }).then(result => {
    if (result.response === 0) autoUpdater.quitAndInstall()
  })
})

autoUpdater.on('error', (err) => {
  console.log('[AutoUpdater] error:', err.message)
})

// Dockバッジ（未読合計数）
ipcMain.on('update-dock-badge', (event, count) => {
  if (process.platform === 'darwin') {
    app.dock.setBadge(count > 0 ? String(count) : '')
  }
  if (process.platform === "win32" && mainWindow) {
    if (count > 0) {
      mainWindow.setOverlayIcon(null, String(count))
      mainWindow.flashFrame(true)
    } else {
      mainWindow.setOverlayIcon(null, "")
    }
  }
})

// OS通知統合
const { Notification } = require('electron')
ipcMain.on('send-notification', (event, { title, body, serviceId }) => {
  if (Notification.isSupported()) {
    const notif = new Notification({ title, body, silent: false })
    notif.on('click', () => {
      if (mainWindow) {
        mainWindow.show()
        mainWindow.focus()
        mainWindow.webContents.send('switch-to-service', serviceId)
      }
    })
    notif.show()
  }
})
