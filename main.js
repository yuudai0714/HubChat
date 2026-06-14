// ============================================================
// HubChat - メインプロセス (main.js) v1.9
// ============================================================

const { app, BrowserWindow, ipcMain, shell, session } = require('electron')

// 外部リンクの重複オープン防止
const _recentExternalUrls = new Map()
function openExternalOnce(url) {
  const now = Date.now()
  const lastOpen = _recentExternalUrls.get(url)
  if (lastOpen && now - lastOpen < 3000) {
    console.log('[HubChat] duplicate openExternal blocked:', url)
    return
  }
  _recentExternalUrls.set(url, now)
  if (_recentExternalUrls.size > 50) {
    for (const [k, v] of _recentExternalUrls) {
      if (now - v > 10000) _recentExternalUrls.delete(k)
    }
  }
  shell.openExternal(url)
}
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
const trackedWebviews = new Map()
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
    openExternalOnce(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('did-attach-webview', (event, webviewContents) => {
    // バッジ監視用: webContentsを記録
    webviewContents.on('did-finish-load', () => {
      try {
        const url = webviewContents.getURL()
        if (url && url !== 'about:blank') {
          trackedWebviews.set(webviewContents.id, webviewContents)
        }
      } catch(e) {}
    })
    webviewContents.on('destroyed', () => {
      trackedWebviews.delete(webviewContents.id)
    })
    const ses = webviewContents.session
    applySessionFixes(ses)
    webviewContents.setUserAgent(CHROME_UA)

    // LINE等のセッションCookieを永続化
    webviewContents.on("did-finish-load", () => {
      const wvSes = webviewContents.session
      const wvUrl = webviewContents.getURL()
      if (wvUrl.includes("line.biz") || wvUrl.includes("line.me")) {
        wvSes.cookies.get({ domain: ".line.biz" }).then(cookies => {
          cookies.forEach(c => {
            if (!c.expirationDate) {
              var futureDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
              var cookieObj = { url: "https://" + (c.domain.startsWith(".") ? c.domain.substring(1) : c.domain) + c.path, name: c.name, value: c.value, domain: c.domain, path: c.path, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite || "no_restriction", expirationDate: futureDate }
              wvSes.cookies.set(cookieObj).catch(() => {})
            }
          })
        }).catch(() => {})
        wvSes.cookies.get({ domain: ".line.me" }).then(cookies => {
          cookies.forEach(c => {
            if (!c.expirationDate) {
              var futureDate = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
              var cookieObj = { url: "https://" + (c.domain.startsWith(".") ? c.domain.substring(1) : c.domain) + c.path, name: c.name, value: c.value, domain: c.domain, path: c.path, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite || "no_restriction", expirationDate: futureDate }
              wvSes.cookies.set(cookieObj).catch(() => {})
            }
          })
        }).catch(() => {})
      }
    })


    // ショートカットキー: webviewフォーカス中でもCmd/Ctrl+Shift+[ ] を捕捉
    webviewContents.on("before-input-event", (event, input) => {
      const modOk = process.platform === "darwin"
        ? (input.meta && input.shift && !input.alt)
        : (input.control && input.shift && !input.alt)
      if (!modOk) return
      if (input.key !== "[" && input.key !== "]") return
      event.preventDefault()
      mainWindow.webContents.send("cycle-service", input.key === "]" ? "down" : "up")
    })

    // ショートカットキー: Cmd/Ctrl+1〜9 でサービス番号指定切替
    webviewContents.on("before-input-event", (event, input) => {
      const mod = process.platform === "darwin" ? input.meta : input.control
      if (!mod || input.shift || input.alt) return
      const num = parseInt(input.key, 10)
      if (num >= 1 && num <= 9) {
        event.preventDefault()
        mainWindow.webContents.send("switch-service-by-index", num - 1)
      }
    })

    // ズーム: Cmd/Ctrl + Plus/Minus/0
    webviewContents.on("before-input-event", (event, input) => {
      const mod = process.platform === "darwin" ? input.meta : input.control
      if (!mod || input.alt) return
      if ((input.shift && input.key === "_") || (!input.shift && input.key === "-") || (!input.shift && input.key === "0")) {
        event.preventDefault()
        mainWindow.webContents.send("zoom-service", input.key)
      }
    })
    // webview内のwindow.openを制御
    // リンククリックのデバッグログ
    webviewContents.on('will-navigate', (e, url) => {
      console.log('[HubChat-NAV] will-navigate:', url)
    })

    // ポップアップが作成されたら UA と session fix を適用
    webviewContents.on('did-create-window', (popupWindow) => {
      const popupSes = popupWindow.webContents.session
      applySessionFixes(popupSes)
      popupWindow.webContents.setUserAgent(CHROME_UA)
      // ポップアップ内のさらなるポップアップにも適用
      popupWindow.webContents.on('did-create-window', (innerPopup) => {
        const innerSes = innerPopup.webContents.session
        applySessionFixes(innerSes)
        innerPopup.webContents.setUserAgent(CHROME_UA)
      })
    })

    webviewContents.setWindowOpenHandler(({ url: popupUrl }) => {
      console.log('[HubChat-NAV] setWindowOpenHandler called:', popupUrl)
      if (!popupUrl || popupUrl === 'about:blank') return { action: 'deny' }
      const authDomains = ['notion.so','accounts.google.com','login.microsoftonline.com','login.live.com','appleid.apple.com','auth.line.me','access.line.me','oauth.line.me','facebook.com','www.facebook.com','m.facebook.com','web.facebook.com','account.line.biz']
      try {
        const h = new URL(popupUrl).hostname
        // 認証URL → ポップアップ許可
        if (authDomains.some(d => h === d || h.endsWith('.' + d))) {
          return { action: 'allow', overrideBrowserWindowOptions: { width: 500, height: 700, webPreferences: { nodeIntegration: false, contextIsolation: false } } }
        }
        // Googleリダイレクトリンク → 外部ブラウザ
        if (h === "www.google.com" && popupUrl.includes("/url?")) {
          openExternalOnce(popupUrl)
          return { action: "deny" }
        }
        // Canva OAuth (Google/LINE等) → ポップアップ許可
        if (popupUrl.includes("canva.com/oauth/authorize") || popupUrl.includes("accounts.google.com")) {
          return {
            action: 'allow',
            overrideBrowserWindowOptions: {
              width: 500,
              height: 700,
              webPreferences: {
                nodeIntegration: false,
                contextIsolation: false
              }
            },
            outlivesOpener: true
          }
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
      openExternalOnce(popupUrl)
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

  // macOS: 閉じるボタンで終了せず、非表示にしてバックグラウンド常駐
  // → 次回開く時は起動済みなので一瞬で開く（Slack/Discord方式）
  // Windows: X = 終了（OSの慣習に従う）
  if (process.platform === 'darwin') {
    mainWindow.on('close', (e) => {
      if (!app.isQuitting) {
        e.preventDefault()
        mainWindow.hide()
      }
    })
  }
}


// 追加済みサービスのドメインリストを受信（トップレベル）
ipcMain.on('update-service-domains', (event, domains) => {
  addedServiceDomains = domains || []
  console.log('[HubChat-main] received domains:', addedServiceDomains)
})

// 全てのwebContents（ポップアップ含む）でElectron識別子を除去
app.on('web-contents-created', (_, contents) => {
  const ses = contents.session
  applySessionFixes(ses)
  contents.setUserAgent(CHROME_UA)
})

app.whenReady().then(() => {
  app.userAgentFallback = CHROME_UA
  applySessionFixes(session.defaultSession)

  createWindow()

  // --- バッジ監視用キャッシュ（サービスごと） ---
  // key: url prefix, value: { val, zeroStreak }
  if (!global._badgeCache) global._badgeCache = {}
  function badgeCache(key) {
    if (!global._badgeCache[key]) global._badgeCache[key] = { val: 0, zeroStreak: 0 }
    return global._badgeCache[key]
  }
  function applyCache(key, count, badges, url, label) {
    const c = badgeCache(key)
    if (count > 0) {
      c.val = count; c.zeroStreak = 0
      badges[url] = '(' + count + ') ' + label
    } else {
      c.zeroStreak++
      // 6回連続ゼロ（30秒）まで前回値を保持してチラつき防止
      if (c.zeroStreak < 6 && c.val > 0) badges[url] = '(' + c.val + ') ' + label
      else c.val = 0
    }
  }

  // --- メインプロセスからのバッジ監視（15秒後に開始、5秒ごと） ---
  setTimeout(() => {
    setInterval(() => {
      if (!mainWindow || mainWindow.isDestroyed()) return
      const badges = {}
      const domChecks = []
      trackedWebviews.forEach((wc) => {
        try {
          if (wc.isDestroyed()) return
          const title = wc.getTitle()
          const url = wc.getURL()
          if (!title || !url || url === 'about:blank') return
          badges[url] = title

          // ── ページタイトルから "(N)" を共通抽出 ──
          const titleNum = (title.match(/^\((\d+)\)/) || title.match(/^(\d+)\s/))
          const titleCount = titleNum ? parseInt(titleNum[1], 10) : 0

          // Google Chat: タイトル優先 → DOM(aria-label/data-unread-count)
          if (url.includes('chat.google.com')) {
            if (titleCount > 0) {
              applyCache('gchat', titleCount, badges, url, 'Google Chat')
            } else {
              const p = wc.executeJavaScript(`(function(){
                let t=0;
                document.querySelectorAll('[aria-label]').forEach(el=>{
                  const m=(el.getAttribute('aria-label')||'').match(/(\\d+)\\s*(件の未読|unread)/i);
                  if(m)t+=parseInt(m[1],10);
                });
                if(!t) document.querySelectorAll('[data-unread-count]').forEach(el=>{
                  const c=parseInt(el.getAttribute('data-unread-count'),10);
                  if(c>0)t+=c;
                });
                return t;
              })()`).then(c => applyCache('gchat', c, badges, url, 'Google Chat')).catch(()=>{})
              domChecks.push(p)
            }
          }

          // Slack: タイトル優先 → DOM(data-qa属性ベース＝安定)
          if (url.includes('slack.com')) {
            if (titleCount > 0) {
              applyCache('slack', titleCount, badges, url, 'Slack')
            } else {
              const p = wc.executeJavaScript(`(function(){
                let t=0;
                // data-qa属性は比較的安定
                document.querySelectorAll('[data-qa$="badge"],[data-qa*="unread"]').forEach(el=>{
                  const n=parseInt(el.textContent,10); if(n>0)t+=n;
                });
                if(!t) document.querySelectorAll('[aria-label*="unread"],[aria-label*="未読"]').forEach(el=>{
                  const m=(el.getAttribute('aria-label')||'').match(/(\\d+)/);
                  if(m)t+=parseInt(m[1],10);
                });
                return t;
              })()`).then(c => applyCache('slack', c, badges, url, 'Slack')).catch(()=>{})
              domChecks.push(p)
            }
          }

          // Chatwork: タイトルに "(N)" が出る
          if (url.includes('chatwork.com')) {
            if (titleCount > 0) applyCache('chatwork', titleCount, badges, url, 'Chatwork')
            else applyCache('chatwork', 0, badges, url, 'Chatwork')
          }

          // Gmail: タイトルに "(N)" が出る
          if (url.includes('mail.google.com')) {
            if (titleCount > 0) applyCache('gmail', titleCount, badges, url, 'Gmail')
            else applyCache('gmail', 0, badges, url, 'Gmail')
          }

          // Messenger: タイトル優先 → aria-label DOM
          if (url.includes('messenger.com')) {
            if (titleCount > 0) {
              applyCache('messenger', titleCount, badges, url, 'Messenger')
            } else {
              const p = wc.executeJavaScript(`(function(){
                let t=0;
                document.querySelectorAll('[aria-label]').forEach(el=>{
                  const lbl=el.getAttribute('aria-label')||'';
                  if(/(unread|未読)/i.test(lbl)){
                    const m=lbl.match(/(\\d+)/);
                    if(m){t+=parseInt(m[1],10);}
                    else t=Math.max(t,1);
                  }
                });
                return t;
              })()`).then(c => applyCache('messenger', c, badges, url, 'Messenger')).catch(()=>{})
              domChecks.push(p)
            }
          }

          // X (Twitter): タイトル優先 → aria-label DOM (生成クラス名は使わない)
          if (url.includes('x.com')) {
            if (titleCount > 0) {
              applyCache('x', titleCount, badges, url, 'X')
            } else {
              const p = wc.executeJavaScript(`(function(){
                let t=0;
                document.querySelectorAll('a[href="/notifications"] [aria-label]').forEach(el=>{
                  const m=(el.getAttribute('aria-label')||'').match(/(\\d+)/);
                  if(m)t+=parseInt(m[1],10);
                });
                if(!t){
                  // role="status" などariaベース
                  document.querySelectorAll('[role="status"],[aria-live]').forEach(el=>{
                    const m=el.textContent.match(/(\\d+)\\s*(件|unread|notification)/i);
                    if(m)t+=parseInt(m[1],10);
                  });
                }
                return t;
              })()`).then(c => applyCache('x', c, badges, url, 'X')).catch(()=>{})
              domChecks.push(p)
            }
          }

          // Instagram: タイトル優先 → aria-label DOM
          if (url.includes('instagram.com')) {
            if (titleCount > 0) {
              applyCache('instagram', titleCount, badges, url, 'Instagram')
            } else {
              const p = wc.executeJavaScript(`(function(){
                let t=0;
                document.querySelectorAll('[aria-label]').forEach(el=>{
                  const lbl=el.getAttribute('aria-label')||'';
                  const m=lbl.match(/(\\d+)\\s*(件|unread|notification)/i);
                  if(m)t+=parseInt(m[1],10);
                });
                return t;
              })()`).then(c => applyCache('instagram', c, badges, url, 'Instagram')).catch(()=>{})
              domChecks.push(p)
            }
          }

          // Outlook: タイトル優先 → aria-label DOM
          if (url.includes('outlook.live.com') || url.includes('outlook.office')) {
            if (titleCount > 0) {
              applyCache('outlook', titleCount, badges, url, 'Outlook')
            } else {
              const p = wc.executeJavaScript(`(function(){
                let t=0;
                document.querySelectorAll('[aria-label*="未読"],[aria-label*="unread"]').forEach(el=>{
                  const m=(el.getAttribute('aria-label')||'').match(/(\\d+)/);
                  if(m)t+=parseInt(m[1],10);
                });
                return t;
              })()`).then(c => applyCache('outlook', c, badges, url, 'Outlook')).catch(()=>{})
              domChecks.push(p)
            }
          }

        } catch(e) {}
      })
      // DOM検査の完了を待ってから送信
      Promise.all(domChecks).then(() => {
        try { mainWindow.webContents.send('main-badge-update', badges) } catch(e) {}
      }).catch(() => {
        try { mainWindow.webContents.send('main-badge-update', badges) } catch(e) {}
      })
    }, 5000)
  }, 15000)

  app.on('activate', () => {
    // Dockアイコンクリック時：ウィンドウが非表示なら再表示、無ければ作成
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    } else if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// ⌘Q / メニューからの終了時にフラグを立てる → mainWindow.close が実際に閉じる
app.on('before-quit', () => {
  app.isQuitting = true
})

app.on('window-all-closed', () => {
  // Windowsはウィンドウ閉じたら終了、macOSは常駐
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
    openExternalOnce(innerUrl)
    return { action: 'deny' }
  })

  popup.loadURL(url)
})

ipcMain.handle('store-get', (event, key, defaultValue) => {
  return store.get(key, defaultValue)
})

ipcMain.handle('store-set', (event, key, value) => {
  store.set(key, value)
  console.log("[HubChat-MAIN] store.set called:", key, typeof value === "string" ? value.substring(0,20) : value)
})

ipcMain.handle('store-delete', (event, key) => {
  store.delete(key)
})

ipcMain.handle('store-clear', () => {
  store.clear()
})


// 端末固有ID生成
function getMachineId() {
  const { machineIdSync } = require('node-machine-id')
  try { return machineIdSync(true) } catch(e) {
    // フォールバック: ホスト名+ユーザー名のハッシュ
    const crypto = require('crypto')
    const os = require('os')
    const raw = os.hostname() + os.userInfo().username + os.platform() + os.arch()
    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32)
  }
}

// マシンID取得（管理者チェック用）
ipcMain.handle('get-machine-id', () => getMachineId())

// ライセンスアクティベーション（端末紐付け）
ipcMain.handle('activate-license', async (event, key) => {
  try {
    const machineId = getMachineId()
    const postData = JSON.stringify({ action: 'activate', key: key, machine_id: machineId })
    return await new Promise((resolve) => {
      const request = require('electron').net.request({
        method: 'POST',
        url: 'https://ydk-business.com/hubchat/api/license.php'
      })
      request.setHeader('Content-Type', 'application/json')
      let body = ''
      request.on('response', (response) => {
        response.on('data', (chunk) => { body += chunk.toString() })
        response.on('end', () => {
          try { resolve(JSON.parse(body)) } catch(e) { resolve({ status: 'error', message: 'Parse error' }) }
        })
      })
      request.on('error', (err) => { resolve({ status: 'error', message: err.message }) })
      request.write(postData)
      request.end()
    })
  } catch(e) { return { status: 'error', message: e.message } }
})

ipcMain.handle('verify-license', async (event, key) => {
  try {
    const net = require('electron').net
    return new Promise((resolve) => {
      const machineId = getMachineId()
      const postData = JSON.stringify({ action: 'verify', key: key, machine_id: machineId })
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

ipcMain.handle('get-learning-data', async () => {
  try {
    const { net } = require('electron');
    // キャッシュバスター: nginx・Electronどちらのキャッシュも回避して常に最新を取得
    const url = 'https://ydk-business.com/hubchat/api/data/learning.json?t=' + Date.now();
    const resp = await net.fetch(url, { cache: 'no-store' });
    const data = JSON.parse(await resp.text());
    // YDK Office のカテゴリ上書き/非掲載設定を取得（失敗しても無視）
    try {
      const ro = await net.fetch('https://office.ydk-ai.com/api/hubchat/overrides?t=' + Date.now(), { cache: 'no-store' });
      const oj = JSON.parse(await ro.text());
      data.__overrides = oj.overrides || {};
    } catch(e) { data.__overrides = {}; }
    return data;
  } catch(e) {
    return { error: e.message };
  }
});

ipcMain.handle('get-app-version', async () => {
  const ver = app.getVersion()
  let latest = null
  try {
    const res = await require('electron').net.fetch('https://api.github.com/repos/yuudai0714/HubChat/releases/latest', {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })
    const data = await res.json()
    latest = (data.tag_name || '').replace('v', '')
  } catch(e) { console.log('[HubChat] version fetch error:', e) }
  return { current: ver, latest: latest }
})

ipcMain.handle('open-external', (event, url) => {
  openExternalOnce(url)
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
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-available', { version: info.version })
  }
})

autoUpdater.on('update-not-available', () => {
  console.log('[AutoUpdater] no update available')
})

autoUpdater.on('download-progress', (progress) => {
  console.log(`[AutoUpdater] download: ${Math.round(progress.percent)}%`)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-download-progress', { percent: Math.round(progress.percent) })
  }
})

autoUpdater.on('update-downloaded', () => {
  console.log('[AutoUpdater] download complete')
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-downloaded')
  }
})

autoUpdater.on('error', (err) => {
  console.log('[AutoUpdater] error:', err.message)
})

ipcMain.handle('download-update', () => {
  autoUpdater.downloadUpdate()
})

ipcMain.handle('quit-and-install', () => {
  autoUpdater.quitAndInstall()
})

// --- メインプロセスからのバッジ監視（5秒ごと） ---
setInterval(() => {
  if (!mainWindow || mainWindow.isDestroyed()) return
  const badges = {}
  console.log('[BadgeMonitor] tracked count:', trackedWebviews.size)
  trackedWebviews.forEach((wc, id) => {
    try {
      if (!wc.isDestroyed()) {
        const title = wc.getTitle()
        const url = wc.getURL()
        if (title && url && url !== 'about:blank') {
          badges[url] = title
        }
      }
    } catch(e) {}
  })
  try {
    mainWindow.webContents.send('main-badge-update', badges)
  } catch(e) {}
}, 5000)

// Dockバッジ（未読合計数）
ipcMain.on('update-dock-badge', (event, count) => {
  if (process.platform === 'darwin') {
    app.dock.setBadge(count > 0 ? String(count) : '')
    app.setBadgeCount(count)
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
