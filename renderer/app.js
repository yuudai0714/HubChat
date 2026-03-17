// ============================================================
// HubChat - UIロジック (app.js) v1.9
// ============================================================

// ============================================================
// 1. 全サービス定義
// ============================================================
const ALL_SERVICES = [
  // ── メッセージ ──
  { id:'slack',      name:'Slack',           url:'https://street-smart-talk.slack.com/',                  category:'message',     color:'#4A154B', domain:'slack.com' },
  { id:'gmail',      name:'Gmail',           url:'https://mail.google.com',                 category:'message',     color:'#EA4335', domain:'mail.google.com' },
  { id:'outlook',    name:'Outlook',         url:'https://outlook.live.com/mail/',          category:'message',     color:'#0078D4', domain:'outlook.live.com', msAuth: true },
  { id:'discord',    name:'Discord',         url:'https://discord.com/app',                 category:'message',     color:'#5865F2', domain:'discord.com' },
  { id:'chatwork',   name:'Chatwork',        url:'https://www.chatwork.com',                category:'message',     color:'#41C9FF', domain:'chatwork.com' },
  { id:'googlechat', name:'Google Chat',     url:'https://chat.google.com',                 category:'message',     color:'#34A853', domain:'chat.google.com' },
  { id:'lineworks',  name:'LINE WORKS',      url:'https://line.worksmobile.com',            category:'message',     color:'#00C73C', domain:'line.worksmobile.com' },
  { id:'linechat',   name:'LINE公式メッセージ', url:'https://chat.line.biz/',               category:'message',     color:'#00B900', domain:'chat.line.biz', icon:'https://chat.line.biz/favicon.ico' },
  { id:'linebiz',    name:'LINE管理画面',    url:'https://manager.line.biz',                category:'message',     color:'#00C73C', domain:'manager.line.biz' },
  { id:'instagram',  name:'Instagram DM',   url:'https://www.instagram.com/direct/inbox/', category:'message',     color:'#E1306C', domain:'instagram.com' },
  { id:'messenger',  name:'Messenger',       url:'https://www.messenger.com',               category:'message',     color:'#0084FF', domain:'messenger.com' },
  { id:'twitter',    name:'X (Twitter)',     url:'https://twitter.com/messages',            category:'message',     color:'#000000', domain:'x.com' },
  { id:'whatsapp',   name:'WhatsApp',        url:'https://web.whatsapp.com',                category:'message',     color:'#25D366', domain:'whatsapp.com' },
  { id:'telegram',   name:'Telegram',        url:'https://web.telegram.org',                category:'message',     color:'#2CA5E0', domain:'telegram.org' },
  { id:'linkedin',   name:'LinkedIn',        url:'https://www.linkedin.com/messaging/',     category:'message',     color:'#0077B5', domain:'linkedin.com' },
  { id:'yahoo',      name:'Yahoo!メール',    url:'https://mail.yahoo.co.jp',                category:'message',     color:'#FF0033', domain:'yahoo.co.jp' },
  // ── AI ──
  { id:'gemini',     name:'Gemini',          url:'https://gemini.google.com/app',           category:'ai',          color:'#4285F4', domain:'gemini.google.com', icon:'https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png' },
  { id:"chatgpt", name:"ChatGPT", url:"https://chatgpt.com", category:"ai", color:"#10A37F", domain:"chatgpt.com", icon:"https://cdn.oaistatic.com/_next/static/media/apple-touch-icon.59f2e898.png" },
  // ── 生産性 ──
  { id:'gcal',       name:'Googleカレンダー',url:'https://calendar.google.com/calendar/',    category:'google',color:'#4285F4', domain:'calendar.google.com', icon:'https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png' },
  { id:'gtasks',     name:'Googleタスク',    url:'https://tasks.google.com/embed/?origin=https://calendar.google.com&fullWidth=1', category:'google',color:'#34A853', domain:'tasks.google.com', icon:'https://ssl.gstatic.com/tasks/images/icon_2022q4_v2/favicon.ico' },
  { id:'gkeep',      name:'Google Keep',     url:'https://keep.google.com/',                category:'google',color:'#FBBC04', domain:'keep.google.com', icon:'https://ssl.gstatic.com/keep/icon_2020q4v2_128.png' },
  { id:'notion',     name:'Notion',          url:'https://www.notion.so',                   category:'productivity',color:'#ffffff', domain:'notion.so' },
  { id:"gdrive",  name:"Googleドライブ",       url:"https://drive.google.com",        category:'google', color:"#4285F4", domain:"drive.google.com",  icon:"https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" },
  { id:"gsheets", name:"Googleスプレッドシート", url:"https://docs.google.com/spreadsheets", category:'google', color:"#0F9D58", domain:"docs.google.com", icon:"https://ssl.gstatic.com/docs/spreadsheets/favicon3.ico" },
  { id:"gdocs",   name:"Googleドキュメント",    url:"https://docs.google.com/document",    category:'google', color:"#4285F4", domain:"docs.google.com", icon:"https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico" },
  { id:"gslides", name:"Googleスライド",        url:"https://docs.google.com/presentation", category:'google', color:"#F4B400", domain:"docs.google.com", icon:"https://ssl.gstatic.com/docs/presentations/images/favicon5.ico" },
  { id:'canva',   name:'Canva',               url:'https://www.canva.com/',              category:'productivity',color:'#00C4CC', domain:'canva.com' },
  // ── コンテンツ ──
  { id:'note',       name:'note',            url:'https://note.com/dashboard',              category:'content',     color:'#41C9B4', domain:'note.com' },
]

const CAT_LABEL = {
  message:     'メッセージ',
  ai:          'AI アシスタント',
  google:      'Google ツール',
  productivity:'生産性ツール',
  content:     'コンテンツ',
}

// ============================================================
// 2. アプリ状態
// ============================================================
let S = {
  services:     {},   // { id: { added:bool, enabled:bool } }
  serviceOrder: [],   // 表示順（IDの配列）
  activeId:     null,
  theme:        'dark',
  msAuthShown:  {},   // { id: bool } Microsoft認証案内を表示済みかどうか
}
let ctxTarget = null  // 右クリック対象のサービスID
let dragSrc   = null  // ドラッグ中のサービスID

let lastActiveTime = {}  // { id: timestamp } 各サービスの最終アクティブ時刻
const HIBERNATE_TIMEOUT = 5 * 60 * 1000  // 5分
let hibernatedServices = new Set()  // ハイバネーション中のサービスID
// ============================================================
// 3. 起動・初期化
// ============================================================
async function init() {
  if (window.electronAPI.platform === 'darwin') {
    document.body.classList.add('mac')
  }

  S.services     = await window.electronAPI.storeGet('services',     {})
  S.serviceOrder = await window.electronAPI.storeGet('serviceOrder', [])
  var validIds = ALL_SERVICES.map(function(s){ return s.id })
  S.serviceOrder = S.serviceOrder.filter(function(id){ return validIds.includes(id) })
  S.theme        = await window.electronAPI.storeGet('theme',        'dark')
  S.msAuthShown  = await window.electronAPI.storeGet('msAuthShown',  {})

  applyTheme(S.theme)
  renderSidebar()
  setupEvents()

  // 起動時：全サービスのwebviewを一括生成（バッジ取得用）
  const addedServices = S.serviceOrder.filter(id => S.services[id]?.added && S.services[id]?.enabled)

  if (addedServices.length > 0) {
    // 最初のサービスを先にアクティブ表示
    activateService(addedServices[0], false)

    // ローディングオーバーレイを表示
    const overlay = document.createElement('div')
    overlay.id = 'startup-loading-overlay'
    overlay.style.cssText = 'position:fixed;top:0;left:60px;right:0;bottom:0;background:rgba(30,30,46,0.92);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;'
    overlay.innerHTML = `
      <div style="width:40px;height:40px;border:3px solid rgba(166,227,161,0.3);border-top:3px solid #a6e3a1;border-radius:50%;animation:spin 0.8s linear infinite;margin-bottom:20px;"></div>
      <div style="color:#cdd6f4;font-size:15px;font-weight:600;">サービスを読み込んでいます...</div>
      <div id="startup-loading-count" style="color:#a6adc8;font-size:13px;margin-top:8px;">0 / ${addedServices.length}</div>
      <style>@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
    `
    document.body.appendChild(overlay)

    // 残りのサービスをバックグラウンドで一括生成
    let loadedCount = 1
    const countEl = () => document.getElementById('startup-loading-count')
    if (countEl()) countEl().textContent = loadedCount + ' / ' + addedServices.length

    setTimeout(() => {
      const remaining = addedServices.slice(1)
      remaining.forEach((id) => {
        const existing = document.querySelector(`webview[data-id="${id}"]`)
        if (!existing) {
          console.log("[HubChat] preload webview for badge:", id)
          activateService(id, false)
        }
        loadedCount++
        if (countEl()) countEl().textContent = loadedCount + ' / ' + addedServices.length
      })

      // 最初のサービスに戻して表示
      activateService(addedServices[0], false)

      // オーバーレイをフェードアウト
      setTimeout(() => {
        const ol = document.getElementById('startup-loading-overlay')
        if (ol) {
          ol.style.transition = 'opacity 0.5s'
          ol.style.opacity = '0'
          setTimeout(() => ol.remove(), 500)
        }
      }, 1500)
    }, 500)
  }
}

// ============================================================
// 4. テーマ切り替え
// ============================================================
function applyTheme(t) {
  S.theme = t
  document.body.classList.toggle('light', t === 'light')
  window.electronAPI.storeSet('theme', t)
}

// ============================================================
// 5. サイドバー描画
// ============================================================
function renderSidebar() {
  const wrap = document.getElementById('sidebar-services')
  wrap.innerHTML = ''

  const visible = S.serviceOrder.filter(id => S.services[id]?.added && S.services[id]?.enabled)

  if (visible.length === 0) {
    showWelcome(); return
  }

  let prevCat = null
  visible.forEach((id, idx) => {
    const svc = ALL_SERVICES.find(s => s.id === id)
    if (!svc) return

    if (prevCat && prevCat !== svc.category) {
      const sep = document.createElement('div')
      sep.className = 'sidebar-sep'
      wrap.appendChild(sep)
    }
    prevCat = svc.category

    wrap.appendChild(buildIcon(svc))
  })

  if (S.activeId && S.services[S.activeId]?.enabled) {
    activateService(S.activeId, false)
  }
}

function buildIcon(svc) {
  const el = document.createElement('div')
  el.className = 'svc-icon' + (svc.id === S.activeId ? ' active' : '')
  el.dataset.id  = svc.id
  el.dataset.tip = svc.name
  el.draggable   = true

  const img = document.createElement('img')
  // LINE系は最初からフォールバックアイコンで区別
    if (svc.id === 'linechat' || svc.id === 'linebiz') {
      const fb = document.createElement('div')
      fb.className = 'icon-fb'
      fb.style.background = svc.color
      fb.style.fontSize = '18px'
      fb.style.lineHeight = '1.1'
      fb.style.textAlign = 'center'
      fb.style.display = 'flex'
      fb.style.alignItems = 'center'
      fb.style.justifyContent = 'center'
      fb.textContent = svc.id === 'linechat' ? '💬' : '⚙'
      el.appendChild(fb)
      el.addEventListener('click', () => activateService(svc.id))
      el.addEventListener('contextmenu', e => { e.preventDefault(); showCtx(e.clientX, e.clientY, svc.id) })
      el.addEventListener('dragstart', e => { dragSrc = svc.id; e.dataTransfer.effectAllowed = 'move' })
      el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drag-over') })
      el.addEventListener('dragleave', () => el.classList.remove('drag-over'))
      el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('drag-over'); if (dragSrc && dragSrc !== svc.id) reorderService(dragSrc, svc.id); dragSrc = null })
      return el
    }
  img.src = svc.icon || `https://www.google.com/s2/favicons?domain=${svc.domain}&sz=64`
  img.alt = svc.name
  img.onerror = () => {
    img.style.display = 'none'
    const fb = document.createElement('div')
    fb.className = 'icon-fb'
    fb.style.background = svc.color
    fb.textContent = svc.name[0]
    el.appendChild(fb)
  }
  el.appendChild(img)

  el.addEventListener('click', () => activateService(svc.id))

  el.addEventListener('contextmenu', e => {
    e.preventDefault()
    showCtx(e.clientX, e.clientY, svc.id)
  })

  el.addEventListener('dragstart', e => {
    dragSrc = svc.id
    el.classList.add('dragging')
    e.dataTransfer.effectAllowed = 'move'
  })
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging')
    document.querySelectorAll('.svc-icon').forEach(i => i.classList.remove('drag-over'))
  })
  el.addEventListener('dragover', e => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    el.classList.add('drag-over')
  })
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'))
  el.addEventListener('drop', e => {
    e.preventDefault()
    el.classList.remove('drag-over')
    if (dragSrc && dragSrc !== svc.id) reorderSvc(dragSrc, svc.id)
  })

  return el
}

// ============================================================
// 6. Microsoft認証案内ダイアログ
// ============================================================
function showMsAuthDialog(serviceName) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div")
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;"

    const dialog = document.createElement("div")
    dialog.style.cssText = "background:var(--bg-card,#2a2a3e);border-radius:16px;padding:32px;width:480px;max-width:90vw;color:var(--text-main,#fff);font-family:inherit;"
    dialog.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="width:40px;height:40px;background:#0078D4;border-radius:10px;display:flex;align-items:center;justify-content:center;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/></svg>
        </div>
        <h3 style="margin:0;font-size:18px;">${serviceName} ログインについて</h3>
      </div>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:var(--text-sub,#bbb);">
        HubChat内では、Microsoftの認証方法に制限があります。<br>
        以下の方法でログインしてください。
      </p>
      <div style="background:var(--bg-hover,#333);border-radius:12px;padding:16px;margin-bottom:16px;">
        <div style="font-size:13px;font-weight:700;color:#a6e3a1;margin-bottom:10px;">✅ 利用できる認証方法</div>
        <div style="font-size:13px;color:var(--text-sub,#bbb);line-height:1.8;">
          ・メールにコードを送信する（確認済み）
        </div>
      </div>
      <div style="background:var(--bg-hover,#333);border-radius:12px;padding:16px;margin-bottom:20px;">
        <div style="font-size:13px;font-weight:700;color:#f38ba8;margin-bottom:10px;">❌ 利用できない認証方法</div>
        <div style="font-size:13px;color:var(--text-sub,#bbb);line-height:1.8;">
          ・顔認証 / 指紋認証（Windows Hello / Touch ID）<br>
          ・PIN コード（Windows Hello PIN）<br>
          ・セキュリティキー（YubiKey等）<br>
          ・パスキー（パスワードレス認証）<br>
          ・パスワード入力<br>
          ・モバイルアプリでの承認
        </div>
      </div>
      <p style="margin:0 0 20px;font-size:12px;color:var(--text-muted,#888);line-height:1.6;">
        ※ サインイン画面で「別の方法でサインインする」を選び、<br>
        　「○○@gmail.com にコードを送信する」を選択してください。
      </p>
      <div style="display:flex;align-items:center;gap:12px;justify-content:space-between;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--text-sub,#aaa);">
          <input type="checkbox" id="ms-auth-noshow" style="width:16px;height:16px;cursor:pointer;">
          次回から表示しない
        </label>
        <button id="ms-auth-ok" style="padding:10px 28px;background:var(--accent,#89b4fa);color:#11111b;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">
          OK
        </button>
      </div>
    `
    overlay.appendChild(dialog)
    document.body.appendChild(overlay)

    dialog.querySelector("#ms-auth-ok").addEventListener("click", () => {
      const noShow = dialog.querySelector("#ms-auth-noshow").checked
      document.body.removeChild(overlay)
      resolve(noShow)
    })

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        const noShow = dialog.querySelector("#ms-auth-noshow").checked
        document.body.removeChild(overlay)
        resolve(noShow)
      }
    })

    document.addEventListener("keydown", function handler(e) {
      if (e.key === "Escape" || e.key === "Enter") {
        const noShow = dialog.querySelector("#ms-auth-noshow").checked
        document.body.removeChild(overlay)
        document.removeEventListener("keydown", handler)
        resolve(noShow)
      }
    })
  })
}
// ============================================================
// 7. WebView管理
// ============================================================
function syncServiceDomains() {
  console.log('[HubChat-DEBUG] syncServiceDomains called')
  console.log('[HubChat-DEBUG] S:', !!S, 'serviceOrder:', S?.serviceOrder)
  if (!S || !S.serviceOrder) {
    console.log('[HubChat-DEBUG] EARLY RETURN: no S or serviceOrder')
    return
  }
  const domains = S.serviceOrder
    .map(id => ALL_SERVICES.find(s => s.id === id))
    .filter(Boolean)
    .map(s => s.domain)
    .filter(Boolean)
  console.log('[HubChat-DEBUG] domains to send:', domains)
  if (window.electronAPI && window.electronAPI.updateServiceDomains) {
    window.electronAPI.updateServiceDomains(domains)
    console.log('[HubChat-DEBUG] SENT domains:', domains)
  } else {
    console.log('[HubChat-DEBUG] FAILED: electronAPI missing')
  }
}

// バッジ取得用：webviewをバックグラウンドで生成（表示はしない）
function preloadWebview(id) {
  const svc = ALL_SERVICES.find(s => s.id === id)
  if (!svc) return
  const existing = document.querySelector(`webview[data-id="${id}"]`)
  if (existing) return

  const wv = document.createElement("webview")
  wv.dataset.id = id
  wv.setAttribute("src", S.services[id]?.customUrl || svc.url)
  const isGoogle = svc.domain && svc.domain.endsWith("google.com")
  wv.setAttribute("partition", isGoogle ? "persist:google" : `persist:${id}`)
  wv.setAttribute("allowpopups", "")
  wv.setAttribute("useragent",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/137.0.0.0 Safari/537.36")
  if (svc.preload) wv.setAttribute("preload", svc.preload)
  wv.style.display = "none"
  document.getElementById("webview-container").appendChild(wv)
  setupBadgeWatcher(wv, id)
  console.log("[HubChat] preloaded webview for:", id)
}

async function activateService(id, scroll = true) {
  const svc = ALL_SERVICES.find(s => s.id === id)
  if (!svc) return

  // Microsoft系サービスで認証案内を表示（初回または「次回から表示しない」未チェック時）
  if (svc.msAuth && !S.msAuthShown[id]) {
    const wvExists = document.querySelector(`webview[data-id="${id}"]`)
    if (!wvExists) {
      const noShowAgain = await showMsAuthDialog(svc.name)
      if (noShowAgain) {
        S.msAuthShown[id] = true
        await window.electronAPI.storeSet('msAuthShown', S.msAuthShown)
      }
    }
  }

  document.getElementById('welcome-screen').style.display = 'none'
  document.getElementById('webview-container').style.display = 'block'

  document.querySelectorAll('webview').forEach(w => w.classList.remove('active'))

  S.activeId = id
  lastActiveTime[id] = Date.now()

  // ハイバネーション中なら復帰
  if (hibernatedServices.has(id)) {
    const wvH = document.querySelector(`webview[data-id="${id}"]`)
    if (wvH && wvH.dataset.origSrc) {
      console.log("[HubChat] restoring hibernated:", id)
      wvH.setAttribute("src", wvH.dataset.origSrc)
      delete wvH.dataset.origSrc
    }
    hibernatedServices.delete(id)
  }

  document.querySelectorAll('.svc-icon').forEach(el => {
    el.classList.toggle('active', el.dataset.id === id)
  })

  let wv = document.querySelector(`webview[data-id="${id}"]`)
  if (!wv) {
    const loading = document.createElement('div')
    loading.className = 'loading-wrap'
    loading.dataset.for = id
    loading.innerHTML = '<div class="spinner"></div>'
    document.getElementById('webview-container').appendChild(loading)

    wv = document.createElement('webview')
    wv.dataset.id = id
    wv.setAttribute('src', S.services[id]?.customUrl || svc.url)
    const isGoogle = svc.domain && svc.domain.endsWith("google.com")
    wv.setAttribute("partition", isGoogle ? "persist:google" : `persist:${id}`)
        wv.setAttribute('allowpopups', '')
    wv.setAttribute('useragent',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/137.0.0.0 Safari/537.36')

    wv.addEventListener('new-window', (e) => {
      e.preventDefault()
      const linkUrl = e.url
      if (!linkUrl || linkUrl === 'about:blank') return
      try {
        const linkHost = new URL(linkUrl).hostname
        // 認証URL → ポップアップ許可（OAuth等で必要）
        const authDomains = ['accounts.google.com','login.microsoftonline.com','login.live.com','appleid.apple.com','auth.line.me','access.line.me','oauth.line.me','facebook.com','www.facebook.com','m.facebook.com','web.facebook.com','account.line.biz']
        if (authDomains.some(d => linkHost === d || linkHost.endsWith('.' + d))) {
          showPopupOverlay(linkUrl, `persist:${id}`)
          return
        }
        // 同じベースドメイン → 現在のwebview内でナビゲート
        const linkBase = linkHost.split('.').slice(-2).join('.')
        const svcBase = (svc.domain || '').split('.').slice(-2).join('.')
        if (svcBase && linkBase === svcBase) {
          wv.src = linkUrl
          return
        }
        // 追加済みサービスのドメインか？ → そのタブに切り替え
        if (S && S.serviceOrder) {
          for (const sid of S.serviceOrder) {
            const sv = ALL_SERVICES.find(s => s.id === sid)
            if (sv && sv.domain) {
              const svBase = sv.domain.split('.').slice(-2).join('.')
              if (linkHost === sv.domain || linkHost.endsWith('.' + sv.domain) || linkBase === svBase) {
                activateService(sid)
                setTimeout(() => {
                  const tw = document.querySelector('webview[data-id="' + sid + '"]')
                  if (tw) tw.src = linkUrl
                }, 300)
                return
              }
            }
          }
        }
        // どれにも該当しない → 外部ブラウザ
        if (window.electronAPI && window.electronAPI.openExternal) {
          window.electronAPI.openExternal(linkUrl)
        }
      } catch(err) {
        if (window.electronAPI && window.electronAPI.openExternal) {
          window.electronAPI.openExternal(linkUrl)
        }
      }
    })

    wv.addEventListener('dom-ready', () => {
      document.querySelector(`.loading-wrap[data-for="${id}"]`)?.remove()
    })
    setupBadgeWatcher(wv, id)

    wv.addEventListener('did-fail-load', e => {
      if (e.errorCode === -3) return
      const ld = document.querySelector(`.loading-wrap[data-for="${id}"]`)
      if (ld) ld.innerHTML = `
        <div style="text-align:center;color:var(--text-sub)">
          <div style="font-size:42px;margin-bottom:12px">😵</div>
          <p style="font-size:16px;font-weight:600;margin-bottom:8px">読み込みに失敗しました</p>
          <p style="font-size:13px;margin-bottom:20px">${svc.name}</p>
          <button onclick="reloadWV('${id}')"
            style="padding:10px 22px;background:var(--accent);color:#11111b;
                   border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">
            再読み込み
          </button>
        </div>`
    })
    document.getElementById('webview-container').appendChild(wv)
  }
  wv.style.display = ""; wv.classList.add('active')
}

function reloadWV(id) {
  document.querySelector(`webview[data-id="${id}"]`)?.reload()
}

function showWelcome() {
  document.getElementById('welcome-screen').style.display = 'flex'
  document.getElementById('webview-container').style.display = 'none'
  S.activeId = null
}

// ============================================================
// 8. サービス追加モーダル
// ============================================================
function openAddModal() {
  document.getElementById('service-modal').classList.remove('hidden')
  renderAddModal()
}
function closeAddModal() {
  document.getElementById('service-modal').classList.add('hidden')
}

function renderAddModal(scrollToCat) {
  const body = document.getElementById('modal-body')
  body.innerHTML = ''

  const tabWrap = document.createElement('div')
  tabWrap.className = 'cat-tabs'
  const cats = ['message','ai','google','productivity','content']
  cats.forEach(cat => {
    const tab = document.createElement('button')
    tab.className = 'cat-tab'
    tab.textContent = CAT_LABEL[cat]
    tab.addEventListener('click', () => {
      const target = body.querySelector('#cat-' + cat)
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    tabWrap.appendChild(tab)
  })
  body.appendChild(tabWrap)

  cats.forEach(cat => {
    const svcs = ALL_SERVICES.filter(s => s.category === cat)
    const sec = document.createElement('div')
    sec.className = 'svc-cat'
    sec.id = 'cat-' + cat
    sec.innerHTML = '<div class="svc-cat-title">' + CAT_LABEL[cat] + '</div>'

    const grid = document.createElement('div')
    grid.className = 'svc-grid'

    svcs.forEach(svc => {
      const isAdded = S.services[svc.id] && S.services[svc.id].added && S.services[svc.id].enabled
      const imgSrc = svc.icon || ('https://www.google.com/s2/favicons?domain=' + svc.domain + '&sz=64')
      const card = document.createElement('div')
      card.className = 'svc-card' + (isAdded ? ' added' : '')

      const cardImg = document.createElement('div')
      cardImg.className = 'svc-card-img'
      const img = document.createElement('img')
      img.src = imgSrc
      img.alt = svc.name
      img.onerror = function() {
        this.style.display = 'none'
        this.nextElementSibling.style.display = 'flex'
      }
      const fb = document.createElement('div')
      fb.className = 'icon-fb'
      fb.style.background = svc.color
      fb.style.display = 'none'
      fb.textContent = svc.name[0]
      cardImg.appendChild(img)
      cardImg.appendChild(fb)
      // LINE系は絵文字フォールバックで統一
      if (svc.id === "linechat" || svc.id === "linebiz") {
        img.style.display = "none"
        fb.style.display = "flex"
        fb.style.fontSize = "18px"
        fb.style.lineHeight = "1.1"
        fb.style.textAlign = "center"
        fb.style.alignItems = "center"
        fb.style.justifyContent = "center"
        fb.textContent = svc.id === "linechat" ? "💬" : "⚙"
      }

      const nameEl = document.createElement('div')
      nameEl.className = 'svc-card-name'
      nameEl.textContent = svc.name

      const tagEl = document.createElement('div')
      tagEl.className = 'svc-card-tag'
      tagEl.textContent = isAdded ? String.fromCharCode(36861,21152,28168,12415) : String.fromCharCode(36861,21152,12377,12427)

      card.appendChild(cardImg)
      card.appendChild(nameEl)
      card.appendChild(tagEl)
      card.addEventListener('click', function() { toggleSvc(svc.id) })
      grid.appendChild(card)
    })

    sec.appendChild(grid)
    body.appendChild(sec)
  })

  if (scrollToCat) {
    setTimeout(function() {
      const target = body.querySelector('#cat-' + scrollToCat)
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }
}

async function toggleSvc(id) {
  const cur = S.services[id]
  if (cur?.added && cur?.enabled) {
    S.services[id] = { added: true, enabled: false }
    S.serviceOrder = S.serviceOrder.filter(i => i !== id)
    removeWV(id)
    if (S.activeId === id) {
      S.serviceOrder[0] ? activateService(S.serviceOrder[0]) : showWelcome()
    }
  } else {
    if (id === 'slack') {
      const wsUrl = await showSlackDialog()
      if (!wsUrl) return
      S.services[id] = { added: true, enabled: true, customUrl: wsUrl }
    } else {
      S.services[id] = { added: true, enabled: true }
    }
    if (!S.serviceOrder.includes(id)) {
      const cats = ['message','ai','google','productivity','content']
      const ci = cats.indexOf(ALL_SERVICES.find(s => s.id === id)?.category)
      let ins = S.serviceOrder.length
      for (let i = S.serviceOrder.length - 1; i >= 0; i--) {
        const ec = cats.indexOf(ALL_SERVICES.find(s => s.id === S.serviceOrder[i])?.category)
        if (ec <= ci) { ins = i + 1; break }
      }
      S.serviceOrder.splice(ins, 0, id)
    }
  }
  save(); renderSidebar(); renderAddModal()
}

function removeWV(id) {
  document.querySelector(`webview[data-id="${id}"]`)?.remove()
  document.querySelector(`.loading-wrap[data-for="${id}"]`)?.remove()
}

// ============================================================
// 9. 設定モーダル
// ============================================================
function openSettings() {
  document.getElementById('settings-modal').classList.remove('hidden')
  renderSettings()
}
function closeSettings() {
  document.getElementById('settings-modal').classList.add('hidden')
}

function renderSettings() {
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('on', b.dataset.theme === S.theme)
  })

  const list = document.getElementById('service-manage-list')
  list.innerHTML = ''

  const items = S.serviceOrder.map(id => ALL_SERVICES.find(s => s.id === id)).filter(Boolean)
  if (items.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);font-size:13px">追加済みサービスはありません</p>'
    return
  }

  items.forEach(svc => {
    const on = S.services[svc.id]?.enabled ?? false
    const row = document.createElement('div')
    row.className = 'manage-item'
    row.innerHTML = `
      <div class="m-icon">
        <img src="${svc.icon || 'https://www.google.com/s2/favicons?domain=' + svc.domain + '&sz=64'}"
             alt="${svc.name}" width="22" height="22">
      </div>
      <div class="m-name">${svc.name}</div>
      <label class="toggle">
        <input type="checkbox" ${on ? 'checked' : ''}>
        <div class="toggle-track"></div>
      </label>
    `
    row.querySelector('input').addEventListener('change', e => {
      S.services[svc.id].enabled = e.target.checked
      if (!e.target.checked) {
        S.serviceOrder = S.serviceOrder.filter(i => i !== svc.id)
        removeWV(svc.id)
        if (S.activeId === svc.id) {
          S.serviceOrder[0] ? activateService(S.serviceOrder[0]) : showWelcome()
        }
      } else if (!S.serviceOrder.includes(svc.id)) {
        S.serviceOrder.push(svc.id)
      }
      save(); renderSidebar(); renderSettings()
    })
    list.appendChild(row)
  })
}

// ============================================================
// 10. コンテキストメニュー（右クリック）
// ============================================================
function showCtx(x, y, id) {
  ctxTarget = id
  const m = document.getElementById('ctx-menu')
  m.classList.remove('hidden')
  const mw = 160, mh = 76
  m.style.left = Math.min(x, window.innerWidth  - mw - 8) + 'px'
  m.style.top  = Math.min(y, window.innerHeight - mh - 8) + 'px'
}
function hideCtx() {
  document.getElementById('ctx-menu').classList.add('hidden')
  ctxTarget = null
}

// ============================================================
// 11. ドラッグ＆ドロップ並び替え
// ============================================================
function reorderSvc(srcId, tgtId) {
  const si = S.serviceOrder.indexOf(srcId)
  const ti = S.serviceOrder.indexOf(tgtId)
  if (si < 0 || ti < 0) return
  S.serviceOrder.splice(si, 1)
  S.serviceOrder.splice(ti, 0, srcId)
  save(); renderSidebar()
  setTimeout(() => {
    document.querySelector(`.svc-icon[data-id="${S.activeId}"]`)?.classList.add('active')
  }, 30)
}

// ============================================================
// 12. 状態保存
// ============================================================
async function save() {
  await window.electronAPI.storeSet('services',     S.services)
  await window.electronAPI.storeSet('serviceOrder', S.serviceOrder)
}

// ============================================================
// 13. イベントリスナー
// ============================================================
function setupEvents() {
  document.getElementById('add-btn').addEventListener('click', openAddModal)

  // ハイバネーション: 60秒ごとに非アクティブサービスをチェック
  setInterval(() => {
    const now = Date.now()
    document.querySelectorAll("webview[data-id]").forEach(wv => {
      const id = wv.dataset.id
      if (id === S.activeId) return
      if (hibernatedServices.has(id)) return
      const last = lastActiveTime[id] || 0
      if (last > 0 && (now - last) > HIBERNATE_TIMEOUT) {
        console.log("[HubChat] hibernating:", id)
        wv.dataset.origSrc = wv.getAttribute("src") || wv.src
        wv.setAttribute("src", "about:blank")
        hibernatedServices.add(id)
      }
    })
  }, 60000)
  document.getElementById('welcome-add-btn').addEventListener('click', openAddModal)

  document.getElementById('settings-btn').addEventListener('click', openSettings)

  // ツールチップ（position: fixedでoverflow影響なし）
  const tooltip = document.createElement("div")
  tooltip.id = "svc-tooltip"
  tooltip.style.cssText = "position:fixed;background:rgba(0,0,0,0.85);color:#fff;padding:5px 12px;border-radius:8px;font-size:12px;font-weight:600;pointer-events:none;opacity:0;transition:opacity 0.15s;z-index:99999;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);"
  document.body.appendChild(tooltip)

  document.addEventListener("mouseover", (e) => {
    const icon = e.target.closest(".svc-icon")
    if (icon && icon.dataset.tip) {
      const rect = icon.getBoundingClientRect()
      tooltip.textContent = icon.dataset.tip
      tooltip.style.left = (rect.right + 10) + "px"
      tooltip.style.top = (rect.top + rect.height / 2) + "px"
      tooltip.style.transform = "translateY(-50%)"
      tooltip.style.opacity = "1"
    }
  })
  document.addEventListener("mouseout", (e) => {
    const icon = e.target.closest(".svc-icon")
    if (icon) tooltip.style.opacity = "0"
  })

  document.getElementById('modal-close').addEventListener('click', closeAddModal)
  document.getElementById('modal-overlay').addEventListener('click', closeAddModal)
  document.getElementById('settings-close').addEventListener('click', closeSettings)
  document.getElementById('settings-overlay').addEventListener('click', closeSettings)

  document.querySelectorAll('.theme-btn').forEach(b => {
    b.addEventListener('click', () => { applyTheme(b.dataset.theme); renderSettings() })
  })

  document.getElementById('reset-btn').addEventListener('click', async () => {
    if (!confirm('全データをリセットします。追加したサービスがすべて削除されます。よろしいですか？')) return
    var savedLicenseKey = await window.electronAPI.storeGet("licenseKey", null)
    await window.electronAPI.storeClear()
    if(savedLicenseKey){ await window.electronAPI.storeSet("licenseKey", savedLicenseKey) }
    S.services = {}; S.serviceOrder = []; S.activeId = null; S.msAuthShown = {}
    document.getElementById('webview-container').innerHTML = ''
    renderSidebar(); closeSettings()
  })

  document.getElementById('ctx-hide').addEventListener('click', () => {
    if (!ctxTarget) return hideCtx()
    S.services[ctxTarget] = { added: true, enabled: false }
    S.serviceOrder = S.serviceOrder.filter(i => i !== ctxTarget)
    removeWV(ctxTarget)
    if (S.activeId === ctxTarget) {
      S.serviceOrder[0] ? activateService(S.serviceOrder[0]) : showWelcome()
    }
    save(); renderSidebar(); hideCtx()
  })

  document.getElementById('ctx-remove').addEventListener('click', () => {
    if (!ctxTarget) return hideCtx()
    const name = ALL_SERVICES.find(s => s.id === ctxTarget)?.name
    if (!confirm(`「${name}」を削除しますか？`)) return hideCtx()
    delete S.services[ctxTarget]
    S.serviceOrder = S.serviceOrder.filter(i => i !== ctxTarget)
    removeWV(ctxTarget)
    if (S.activeId === ctxTarget) {
      S.serviceOrder[0] ? activateService(S.serviceOrder[0]) : showWelcome()
    }
    save(); renderSidebar(); hideCtx()
  })

  document.addEventListener('click', hideCtx)

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeAddModal(); closeSettings(); hideCtx() }
  })
}

// ============================================================
// アプリ起動
// ============================================================

// --- メインプロセスからのIPC受信 ---
if (window.electronAPI) {
  if (window.electronAPI.onNavigateInService) {
    window.electronAPI.onNavigateInService((url) => {
      if (S && S.activeService) {
        const wv = document.querySelector('webview[data-id="' + S.activeService + '"]')
        if (wv) wv.loadURL(url)
      }
    })
  }
  if (window.electronAPI.onSwitchToService) {
    window.electronAPI.onSwitchToService((url) => {
      try {
        const hostname = new URL(url).hostname
        if (S && S.serviceOrder) {
          for (const id of S.serviceOrder) {
            const svc = ALL_SERVICES.find(s => s.id === id)
            if (svc && svc.domain && (hostname === svc.domain || hostname.endsWith('.' + svc.domain))) {
              activateService(id)
              setTimeout(() => {
                const wv = document.querySelector('webview[data-id="' + id + '"]')
                if (wv) wv.loadURL(url)
              }, 500)
              return
            }
          }
        }
        // 該当サービスが見つからなければ外部ブラウザ
        if (window.electronAPI.openExternal) window.electronAPI.openExternal(url)
      } catch(e) {
        if (window.electronAPI.openExternal) window.electronAPI.openExternal(url)
      }
    })
  }
}

document.addEventListener('DOMContentLoaded', () => init())

// ============================================================
// ポップアップオーバーレイ制御
// ============================================================
const CHROME_UA_RENDERER = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'

function showPopupOverlay(url, partition) {
  const overlay  = document.getElementById('popup-overlay')
  const popupWV  = document.getElementById('popup-webview')
  const titleEl  = document.getElementById('popup-title')

  popupWV.setAttribute('partition', partition)
  popupWV.setAttribute('useragent', CHROME_UA_RENDERER)
  
  titleEl.textContent = url

  popupWV.removeEventListener('new-window', popupNewWindowHandler)
  popupWV.addEventListener('new-window', popupNewWindowHandler)

  popupWV.addEventListener('page-title-updated', (e) => {
    titleEl.textContent = e.title || url
  })

  popupWV.src = url
  overlay.classList.add('active')
}

function popupNewWindowHandler(e) {
  e.preventDefault()
  document.getElementById('popup-webview').src = e.url
}

function hidePopupOverlay() {
  const overlay = document.getElementById('popup-overlay')
  const popupWV = document.getElementById('popup-webview')
  overlay.classList.remove('active')
  popupWV.src = 'about:blank'
}


// --- メインプロセスからのIPC受信 ---
if (window.electronAPI) {
  if (window.electronAPI.onNavigateInService) {
    window.electronAPI.onNavigateInService((url) => {
      if (S && S.activeService) {
        const wv = document.querySelector('webview[data-id="' + S.activeService + '"]')
        if (wv) wv.loadURL(url)
      }
    })
  }
  if (window.electronAPI.onSwitchToService) {
    window.electronAPI.onSwitchToService((url) => {
      try {
        const hostname = new URL(url).hostname
        if (S && S.serviceOrder) {
          for (const id of S.serviceOrder) {
            const svc = ALL_SERVICES.find(s => s.id === id)
            if (svc && svc.domain && (hostname === svc.domain || hostname.endsWith('.' + svc.domain))) {
              activateService(id)
              setTimeout(() => {
                const wv = document.querySelector('webview[data-id="' + id + '"]')
                if (wv) wv.loadURL(url)
              }, 500)
              return
            }
          }
        }
        // 該当サービスが見つからなければ外部ブラウザ
        if (window.electronAPI.openExternal) window.electronAPI.openExternal(url)
      } catch(e) {
        if (window.electronAPI.openExternal) window.electronAPI.openExternal(url)
      }
    })
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('popup-back-btn')?.addEventListener('click', hidePopupOverlay)
  document.getElementById('popup-close-btn')?.addEventListener('click', hidePopupOverlay)
})

// ============================================================
// Slack ワークスペースURL入力ダイアログ
// ============================================================
function showSlackDialog() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;'

    const dialog = document.createElement('div')
    dialog.style.cssText = 'background:var(--bg-card,#2a2a3e);border-radius:16px;padding:32px;width:420px;max-width:90vw;color:var(--text-main,#fff);font-family:inherit;'
    dialog.innerHTML = `
      <h3 style="margin:0 0 8px;font-size:18px;">Slack ワークスペースを追加</h3>
      <p style="margin:0 0 20px;font-size:13px;color:var(--text-sub,#aaa);">
        ワークスペースのURLを入力してください。<br>
        例: <strong>your-team</strong>.slack.com
      </p>
      <div style="display:flex;align-items:center;gap:0;margin-bottom:20px;">
        <span style="background:var(--bg-hover,#333);padding:10px 12px;border-radius:10px 0 0 10px;font-size:14px;color:var(--text-sub,#aaa);white-space:nowrap;">https://</span>
        <input id="slack-ws-input" type="text" placeholder="your-team" 
          style="flex:1;padding:10px 12px;border:none;background:var(--bg-hover,#333);font-size:14px;color:var(--text-main,#fff);outline:none;">
        <span style="background:var(--bg-hover,#333);padding:10px 12px;border-radius:0 10px 10px 0;font-size:14px;color:var(--text-sub,#aaa);white-space:nowrap;">.slack.com</span>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button id="slack-cancel" style="padding:10px 20px;background:transparent;color:var(--text-sub,#aaa);border:1px solid var(--text-sub,#555);border-radius:10px;font-size:14px;cursor:pointer;">キャンセル</button>
        <button id="slack-ok" style="padding:10px 20px;background:var(--accent,#89b4fa);color:#11111b;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">追加</button>
      </div>
    `
    overlay.appendChild(dialog)
    document.body.appendChild(overlay)

    const input = dialog.querySelector('#slack-ws-input')
    input.focus()

    dialog.querySelector('#slack-ok').addEventListener('click', () => {
      const val = input.value.trim().replace(/\.slack\.com\/?$/i, '').replace(/^https?:\/\//i, '')
      if (val) {
        document.body.removeChild(overlay)
        resolve('https://' + val + '.slack.com/')
      } else {
        input.style.outline = '2px solid #f38ba8'
        input.focus()
      }
    })

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') dialog.querySelector('#slack-ok').click()
      if (e.key === 'Escape') dialog.querySelector('#slack-cancel').click()
    })

    dialog.querySelector('#slack-cancel').addEventListener('click', () => {
      document.body.removeChild(overlay)
      resolve(null)
    })

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay)
        resolve(null)
      }
    })
  })
}

// ============================================================
// 通知バッジ検出
// ============================================================

function extractUnreadCount(title) {
  if (!title) return 0
  // (1,101) or (26) 形式（Gmail, Slack等）カンマ区切りにも対応
  let match = title.match(/\(([\d,]+)\+?\)/)
  if (match) {
    const num = parseInt(match[1].replace(/,/g, ''), 10)
    return isNaN(num) ? 0 : Math.min(num, 9999)
  }
  // [1] 形式（Chatwork等）
  match = title.match(/\[([\d,]+)\]/)
  if (match) {
    const num = parseInt(match[1].replace(/,/g, ''), 10)
    return isNaN(num) ? 0 : Math.min(num, 9999)
  }
  return 0
}

function updateBadge(id, count) {
  const iconEl = document.querySelector(`.svc-icon[data-id="${id}"]`)
  if (!iconEl) return

  const existing = iconEl.querySelector('.badge')
  if (existing) existing.remove()

  if (count > 0) {
    const badge = document.createElement('div')
    badge.className = 'badge'
    badge.textContent = count > 99 ? '99+' : count
    iconEl.appendChild(badge)
  }

  // Dock合計バッジ更新
  const allBadges = document.querySelectorAll(".svc-icon .badge:not(.dot)")
  let total = 0
  allBadges.forEach(b => { const n = parseInt(b.textContent, 10); if (!isNaN(n)) total += n })
  if (window.electronAPI && window.electronAPI.updateDockBadge) {
    window.electronAPI.updateDockBadge(total)
  }
}

function checkFaviconForNotification(id, favicons) {
  if (!favicons || favicons.length === 0) return
  const hasNotif = favicons.some(url =>
    url.includes('unread') || url.includes('notification') || url.includes('alert')
  )
  if (hasNotif) {
    const iconEl = document.querySelector(`.svc-icon[data-id="${id}"]`)
    if (!iconEl) return
    if (!iconEl.querySelector('.badge')) {
      const badge = document.createElement('div')
      badge.className = 'badge dot'
      iconEl.appendChild(badge)
    }
  }
}

function setupBadgeWatcher(wv, id) {
  wv.addEventListener('page-title-updated', (e) => {
    const count = extractUnreadCount(e.title)
    updateBadge(id, count)
    // OS通知（未読数が増えた時＆非アクティブサービスの場合）
    if (count > 0 && id !== S.activeId) {
      const svc = ALL_SERVICES.find(s => s.id === id)
      const name = svc ? svc.name : id
      if (window.electronAPI && window.electronAPI.sendNotification) {
        window.electronAPI.sendNotification(name, `${count}件の未読メッセージ`, id)
      }
    }
  })

  wv.addEventListener('page-favicon-updated', (e) => {
    checkFaviconForNotification(id, e.favicons)
  })


  // 起動時の初回バッジチェック（webview読み込み完了後）
  wv.addEventListener("dom-ready", () => {
    try {
      const title = wv.getTitle()
      const count = extractUnreadCount(title)
      updateBadge(id, count)
    } catch(e) {}
  })
  setInterval(() => {
    try {
      const title = wv.getTitle()
      const count = extractUnreadCount(title)
      updateBadge(id, count)
    } catch(e) {}
  }, 15000)

  // --- カスタムDOM監視（タイトルに未読数が出ないサービス用） ---
  const domCheckServices = {
    googlechat: `(function(){
      let t = 0;
      const els = document.querySelectorAll('[aria-label]');
      els.forEach(el => {
        const label = el.getAttribute('aria-label') || '';
        const m = label.match(/(\\d+)\\s*件の未読/);
        if (m) t += parseInt(m[1], 10);
      });
      return t;
    })()`,
    instagram: `(function(){
      const dmLink = document.querySelector('a[href="/direct/inbox/"]');
      if (dmLink) {
        const dot = dmLink.querySelector('[aria-label]');
        if (dot && dot.textContent && /\\d+/.test(dot.textContent)) return parseInt(dot.textContent,10);
        const redDot = dmLink.querySelector('div[style*="background-color: rgb(255, 48, 64)"], div[style*="background-color:rgb(255,48,64)"], span[data-visualcompletion="css-img"]');
        if (redDot) return -1;
      }
      const notifDot = document.querySelector('img[alt="Instagram"] + div, nav span[aria-label*="notification"], nav div[aria-label*="notification"]');
      if (notifDot) return -1;
      return 0;
    })()`,
    messenger: `(function(){
      const rows = document.querySelectorAll('div[role="row"]');
      let unread = 0;
      for(let i=0; i<rows.length; i++){
        const spans = rows[i].querySelectorAll('span');
        let maxFW = 0;
        for(let j=0; j<spans.length; j++){
          const fw = parseInt(getComputedStyle(spans[j]).fontWeight);
          if(fw > maxFW && spans[j].textContent.trim().length > 0) maxFW = fw;
        }
        if(maxFW >= 700) unread++;
      }
      return unread;
    })()`,
    outlook: `(function(){
      const unread = document.querySelectorAll('[aria-label*="未読"]');
      return unread.length;
    })()`,
    linechat: `(function(){
      var navBadges = document.querySelectorAll(".nav-btn .badge-pill.badge-primary");
      var t = 0;
      navBadges.forEach(function(b){ var n = parseInt(b.textContent.trim(),10); if(!isNaN(n) && n > 0) t += n; });
      if(t > 0) return t;
      var dots = document.querySelectorAll(".nav-btn .badge-pill");
      var hasUnread = false;
      dots.forEach(function(d){ var bg = window.getComputedStyle(d).backgroundColor; if(bg.includes("0, 185, 0") || bg.includes("0, 195") || bg.includes("76, 217")) hasUnread = true; });
      if(hasUnread) return -1;
      return 0;
    })()`
    ,slack: `(function(){
      var srEls = document.querySelectorAll(".sr-only, [aria-label]");
      var totalMentions = 0;
      srEls.forEach(function(el){
        var text = el.textContent || el.getAttribute("aria-label") || "";
        var jpMatch = text.match(/(\\d+)\\s*件の未読/);
        var enMatch = text.match(/(\\d+)\\s*unread\\s*message/);
        var m = jpMatch || enMatch;
        if(m){ totalMentions += parseInt(m[1]); }
      });
      if(totalMentions > 0) return totalMentions;
      var unreadChs = document.querySelectorAll(".p-channel_sidebar__channel--unread");
      if(unreadChs.length > 0) return -1;
      var dots = document.querySelectorAll(".p-team_sidebar__unread_dot, .p-unread_dot");
      if(dots.length > 0) return -1;
      return 0;
    })()`
  }

  if (domCheckServices[id]) {
    const domCheck = () => {
      try {
        wv.executeJavaScript(domCheckServices[id]).then(result => {
          if (result === -1) {
            // ドット表示（数字なし通知）
            const iconEl = document.querySelector('.svc-icon[data-id="' + id + '"]')
            if (iconEl && !iconEl.querySelector('.badge')) {
              const badge = document.createElement('div')
              badge.className = 'badge dot'
              iconEl.appendChild(badge)
            }
          } else if (typeof result === 'number' && result > 0) {
            updateBadge(id, result)
          }
        }).catch(() => {})
      } catch(e) {}
    }
    wv.addEventListener('dom-ready', () => { setTimeout(domCheck, 8000); setTimeout(domCheck, 15000) })
    setInterval(domCheck, 15000)
  }
}

// ============================================================
// ナビゲーションツールバー制御
// ============================================================
function getActiveWebview() {
  if (!S.activeId) return null
  return document.querySelector(`webview[data-id="${S.activeId}"].active`)
}

function updateNavButtons() {
  const wv = getActiveWebview()
  const backBtn = document.getElementById('nav-back')
  const fwdBtn = document.getElementById('nav-forward')
  const urlEl = document.getElementById('nav-url')

  if (!wv) {
    if (backBtn) backBtn.disabled = true
    if (fwdBtn) fwdBtn.disabled = true
    if (urlEl) urlEl.textContent = ''
    return
  }

  try {
    if (backBtn) backBtn.disabled = !wv.canGoBack()
    if (fwdBtn) fwdBtn.disabled = !wv.canGoForward()
    if (urlEl) {
      const url = wv.getURL()
      try {
        const u = new URL(url)
        urlEl.textContent = u.hostname + u.pathname
      } catch(e) {
        urlEl.textContent = url
      }
    }
  } catch(e) {}
}


// --- メインプロセスからのIPC受信 ---
if (window.electronAPI) {
  if (window.electronAPI.onNavigateInService) {
    window.electronAPI.onNavigateInService((url) => {
      if (S && S.activeService) {
        const wv = document.querySelector('webview[data-id="' + S.activeService + '"]')
        if (wv) wv.loadURL(url)
      }
    })
  }
  if (window.electronAPI.onSwitchToService) {
    window.electronAPI.onSwitchToService((url) => {
      try {
        const hostname = new URL(url).hostname
        if (S && S.serviceOrder) {
          for (const id of S.serviceOrder) {
            const svc = ALL_SERVICES.find(s => s.id === id)
            if (svc && svc.domain && (hostname === svc.domain || hostname.endsWith('.' + svc.domain))) {
              activateService(id)
              setTimeout(() => {
                const wv = document.querySelector('webview[data-id="' + id + '"]')
                if (wv) wv.loadURL(url)
              }, 500)
              return
            }
          }
        }
        // 該当サービスが見つからなければ外部ブラウザ
        if (window.electronAPI.openExternal) window.electronAPI.openExternal(url)
      } catch(e) {
        if (window.electronAPI.openExternal) window.electronAPI.openExternal(url)
      }
    })
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('nav-back')?.addEventListener('click', () => {
    const wv = getActiveWebview()
    if (wv && wv.canGoBack()) wv.goBack()
  })

  document.getElementById('nav-forward')?.addEventListener('click', () => {
    const wv = getActiveWebview()
    if (wv && wv.canGoForward()) wv.goForward()
  })

  document.getElementById('nav-reload')?.addEventListener('click', () => {
    const wv = getActiveWebview()
    if (wv) wv.reload()
  })

  // 定期的にボタン状態を更新
  setInterval(updateNavButtons, 1000)
})

// activateServiceの後にも更新をかける
const _origActivate = activateService
activateService = async function(id, scroll) {
  await _origActivate(id, scroll)
  // WebView のナビゲーションイベントを監視
  const wv = document.querySelector(`webview[data-id="${id}"]`)
  if (wv && !wv._navSetup) {
    wv._navSetup = true
    wv.addEventListener('did-navigate', updateNavButtons)
    wv.addEventListener('did-navigate-in-page', updateNavButtons)
    wv.addEventListener('dom-ready', updateNavButtons)
  }
  setTimeout(updateNavButtons, 300)
}

// ============================================================
// ナビツールバー ホバー表示制御
// ============================================================

// --- メインプロセスからのIPC受信 ---
if (window.electronAPI) {
  if (window.electronAPI.onNavigateInService) {
    window.electronAPI.onNavigateInService((url) => {
      if (S && S.activeService) {
        const wv = document.querySelector('webview[data-id="' + S.activeService + '"]')
        if (wv) wv.loadURL(url)
      }
    })
  }
  if (window.electronAPI.onSwitchToService) {
    window.electronAPI.onSwitchToService((url) => {
      try {
        const hostname = new URL(url).hostname
        if (S && S.serviceOrder) {
          for (const id of S.serviceOrder) {
            const svc = ALL_SERVICES.find(s => s.id === id)
            if (svc && svc.domain && (hostname === svc.domain || hostname.endsWith('.' + svc.domain))) {
              activateService(id)
              setTimeout(() => {
                const wv = document.querySelector('webview[data-id="' + id + '"]')
                if (wv) wv.loadURL(url)
              }, 500)
              return
            }
          }
        }
        // 該当サービスが見つからなければ外部ブラウザ
        if (window.electronAPI.openExternal) window.electronAPI.openExternal(url)
      } catch(e) {
        if (window.electronAPI.openExternal) window.electronAPI.openExternal(url)
      }
    })
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const trigger = document.getElementById('nav-trigger')
  const toolbar = document.getElementById('nav-toolbar')
  if (!trigger || !toolbar) return

  let hideTimer = null

  trigger.addEventListener('mouseenter', () => {
    clearTimeout(hideTimer)
    toolbar.classList.add('show')
  })

  toolbar.addEventListener('mouseenter', () => {
    clearTimeout(hideTimer)
    toolbar.classList.add('show')
  })

  toolbar.addEventListener('mouseleave', () => {
    hideTimer = setTimeout(() => {
      toolbar.classList.remove('show')
    }, 400)
  })

  trigger.addEventListener('mouseleave', () => {
    hideTimer = setTimeout(() => {
      toolbar.classList.remove('show')
    }, 400)
  })
})

// ============================================================
// Help / Q&A Modal
// ============================================================
function openHelp() {
  document.getElementById('help-modal').classList.remove('hidden')
}
function closeHelp() {
  document.getElementById('help-modal').classList.add('hidden')
}


// --- メインプロセスからのIPC受信 ---
if (window.electronAPI) {
  if (window.electronAPI.onNavigateInService) {
    window.electronAPI.onNavigateInService((url) => {
      if (S && S.activeService) {
        const wv = document.querySelector('webview[data-id="' + S.activeService + '"]')
        if (wv) wv.loadURL(url)
      }
    })
  }
  if (window.electronAPI.onSwitchToService) {
    window.electronAPI.onSwitchToService((url) => {
      try {
        const hostname = new URL(url).hostname
        if (S && S.serviceOrder) {
          for (const id of S.serviceOrder) {
            const svc = ALL_SERVICES.find(s => s.id === id)
            if (svc && svc.domain && (hostname === svc.domain || hostname.endsWith('.' + svc.domain))) {
              activateService(id)
              setTimeout(() => {
                const wv = document.querySelector('webview[data-id="' + id + '"]')
                if (wv) wv.loadURL(url)
              }, 500)
              return
            }
          }
        }
        // 該当サービスが見つからなければ外部ブラウザ
        if (window.electronAPI.openExternal) window.electronAPI.openExternal(url)
      } catch(e) {
        if (window.electronAPI.openExternal) window.electronAPI.openExternal(url)
      }
    })
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const helpBtn = document.getElementById('help-btn')
  const helpCloseBtn = document.getElementById('help-close-btn')
  const helpModal = document.getElementById('help-modal')

  // プランモーダル
  const planBtn = document.getElementById('plan-btn')
  const planModal = document.getElementById('plan-modal')
  const planClose = document.getElementById('plan-close')
  const planOverlay = document.getElementById('plan-overlay')
  const planVerify = document.getElementById('plan-verify-btn')
  const planUpgrade = document.getElementById('plan-upgrade-btn')
  const planKeyInput = document.getElementById('plan-key-input')
  const planStatus = document.getElementById('plan-status')
  function openPlanModal() {
    planModal.classList.remove('hidden')
    // 設定内と同期
    const lk = document.getElementById('license-key-input')
    if (lk && lk.value) planKeyInput.value = lk.value
    updatePlanStatus()
  }
  function closePlanModal() { planModal.classList.add('hidden') }
  function updatePlanStatus() {
    if (!planStatus) return
    const key = localStorage.getItem('hc_license_key')
    if (key) {
      planStatus.innerHTML = '現在のプラン：<strong style="color:#06C755">プロ</strong>（無制限）'
      if (planUpgrade) planUpgrade.style.display = 'none'
    } else {
      planStatus.innerHTML = '現在のプラン：<strong>フリー</strong>（3サービスまで）'
      if (planUpgrade) planUpgrade.style.display = ''
    }
  }
  if (planBtn) planBtn.addEventListener('click', openPlanModal)
  if (planClose) planClose.addEventListener('click', closePlanModal)
  if (planOverlay) planOverlay.addEventListener('click', closePlanModal)
  if (planVerify) planVerify.addEventListener('click', async () => {
    const key = planKeyInput.value.trim()
    if (!key) return alert('ライセンスキーを入力してください')
    try {
      const res = await window.electronAPI.verifyLicense(key)
      if (res.status === 'device_mismatch') {
        alert('このライセンスキーは別の端末で使用されています')
        return
      }
      if (res.status === 'active') {
        // 端末紐付け
        const actRes = await window.electronAPI.activateLicense(key)
        if (actRes.status === 'device_mismatch') {
          alert('このライセンスキーは別の端末で使用されています')
          return
        }
        localStorage.setItem('hc_license_key', key)
        await window.electronAPI.storeSet("licenseKey", key)
        licenseStatus = { plan: "pro", key: key, email: res.email }
        alert('プロプランが有効になりました！')
        updatePlanStatus()
        updateLicenseUI()
      } else {
        alert(res.message || '無効なライセンスキーです')
      }
    } catch(e) { alert('認証エラー: ' + e.message) }
  })
  if (planUpgrade) planUpgrade.addEventListener('click', () => {
    const overlay = document.createElement('div')
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:10001;display:flex;align-items:center;justify-content:center;'
    const box = document.createElement('div')
    box.style.cssText = 'background:var(--bg-card,#2a2a3e);border-radius:16px;padding:32px;width:400px;max-width:90vw;color:var(--text-main,#fff);text-align:center;'
    box.innerHTML = `
      <h3 style="margin:0 0 12px;font-size:18px;">メールアドレスを入力</h3>
      <p style="margin:0 0 16px;font-size:13px;color:var(--text-sub);">ライセンスキーの送付先になります</p>
      <input id="upgrade-email-input" type="email" placeholder="example@mail.com" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid #444;background:var(--bg-main,#1a1a2e);color:#fff;font-size:14px;margin-bottom:16px;outline:none;">
      <button id="upgrade-email-ok" style="width:100%;padding:12px;background:#06C755;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px;">決済ページへ進む</button>
      <button id="upgrade-email-cancel" style="width:100%;padding:10px;background:var(--bg-hover);color:var(--text-sub);border:none;border-radius:8px;font-size:13px;cursor:pointer;">キャンセル</button>
    `
    overlay.appendChild(box)
    document.body.appendChild(overlay)
    box.querySelector('#upgrade-email-ok').addEventListener('click', () => {
      const email = box.querySelector('#upgrade-email-input').value.trim()
      if (!email) { box.querySelector('#upgrade-email-input').style.borderColor = '#f44'; return }
      window.electronAPI.openExternal('https://buy.stripe.com/7sY5kD3rz56ic5G54H9oc05?client_reference_id=' + encodeURIComponent(email) + '&prefilled_email=' + encodeURIComponent(email) )
      document.body.removeChild(overlay)
    })
    box.querySelector('#upgrade-email-cancel').addEventListener('click', () => { document.body.removeChild(overlay) })
    overlay.addEventListener('click', (e) => { if (e.target === overlay) document.body.removeChild(overlay) })
    setTimeout(() => box.querySelector('#upgrade-email-input').focus(), 100)
  })
  if (helpBtn) helpBtn.addEventListener('click', openHelp)
  if (helpCloseBtn) helpCloseBtn.addEventListener('click', closeHelp)
  if (helpModal) helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) closeHelp()
  })

  // Tab navigation
  document.querySelectorAll('.help-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.help-nav-btn').forEach(b => b.classList.remove('active'))
      document.querySelectorAll('.help-section').forEach(s => s.classList.remove('active'))
      btn.classList.add('active')
      const section = document.getElementById('help-' + btn.dataset.section)
      if (section) section.classList.add('active')
    })
  })

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !helpModal.classList.contains('hidden')) closeHelp()
  })
})

// LINE link -> open in external browser
document.addEventListener('click', (e) => {
  const link = e.target.closest('#help-line-link')
  if (link) {
    e.preventDefault()
    window.electronAPI.openExternal(link.href)
  }
})

// ============================================================
// License Management
// ============================================================
const HC_API = 'https://ydk-business.com/hubchat/api/'
const HC_PAYMENT_URL = 'https://buy.stripe.com/7sY5kD3rz56ic5G54H9oc05'
const FREE_PLAN_LIMIT = 3

let licenseStatus = { plan: 'free', key: null, email: null }

async function initLicense() {
  const previousPlan = await window.electronAPI.storeGet('lastKnownPlan', 'free')
  const savedKey = await window.electronAPI.storeGet('licenseKey', null)
  var keyToCheck = savedKey || localStorage.getItem("hc_license_key")
  if (keyToCheck) {
    const result = await window.electronAPI.verifyLicense(keyToCheck)
    if (result && result.status === 'active') {
      licenseStatus = { plan: "pro", key: keyToCheck, email: result.email }
      if(!savedKey){ await window.electronAPI.storeSet("licenseKey", keyToCheck) }
      await window.electronAPI.storeSet("lastKnownPlan", "pro")
    } else {
      licenseStatus = { plan: "free", key: null, email: null }
      await window.electronAPI.storeDelete("licenseKey")
      localStorage.removeItem("hc_license_key")
      await window.electronAPI.storeSet("lastKnownPlan", "free")
      if (previousPlan === "pro") {
        showDowngradeNotice()
      }
    }
  }
  if (!keyToCheck && previousPlan === "pro") {
    licenseStatus = { plan: "free", key: null, email: null }
    await window.electronAPI.storeSet("lastKnownPlan", "free")
    showDowngradeNotice()
  }
  updateLicenseUI()
  startPeriodicLicenseCheck()
}

function showDowngradeNotice() {
  if (S.serviceOrder.length <= FREE_PLAN_LIMIT) {
    var msg = document.createElement("div")
    msg.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999"
    msg.innerHTML = '<div style="background:var(--bg-main,#1e1e1e);border-radius:12px;padding:30px;max-width:420px;text-align:center;color:var(--text-main,#fff)">' +
      '<h3 style="margin:0 0 15px;font-size:18px">プランが変更されました</h3>' +
      '<p style="margin:0 0 20px;font-size:14px;color:var(--text-sub,#aaa);line-height:1.7">ライセンスの有効期限が切れたため、フリープランに変更されました。<br>フリープランでは' + FREE_PLAN_LIMIT + 'サービスまでご利用いただけます。</p>' +
      '<button id="downgrade-ok-btn" style="background:#f90;color:#fff;border:none;border-radius:8px;padding:10px 30px;font-size:14px;cursor:pointer">OK</button></div>'
    document.body.appendChild(msg)
    document.getElementById("downgrade-ok-btn").onclick = function() { msg.remove() }
    return
  }
  showServiceSelectDialog()
}

function showServiceSelectDialog() {
  var overlay = document.createElement("div")
  overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999"
  var serviceListHtml = ""
  S.serviceOrder.forEach(function(id, idx) {
    var svc = S.services[id]
    var name = svc ? (svc.name || id) : id
    var checked = idx < FREE_PLAN_LIMIT ? "checked" : ""
    serviceListHtml += '<label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:14px;cursor:pointer"><input type="checkbox" class="downgrade-svc-cb" value="' + id + '" ' + checked + '> ' + name + '</label>'
  })
  overlay.innerHTML = '<div style="background:var(--bg-main,#1e1e1e);border-radius:12px;padding:30px;max-width:420px;color:var(--text-main,#fff)">' +
    '<h3 style="margin:0 0 10px;font-size:18px">プランが変更されました</h3>' +
    '<p style="margin:0 0 15px;font-size:14px;color:var(--text-sub,#aaa);line-height:1.7">ライセンスの有効期限が切れたため、フリープランに変更されました。<br>残す' + FREE_PLAN_LIMIT + 'つのサービスを選んでください：</p>' +
    '<div id="downgrade-svc-list" style="max-height:300px;overflow-y:auto;margin:0 0 15px">' + serviceListHtml + '</div>' +
    '<p id="downgrade-count" style="margin:0 0 15px;font-size:13px;color:var(--text-sub,#aaa)"></p>' +
    '<button id="downgrade-confirm-btn" style="background:#f90;color:#fff;border:none;border-radius:8px;padding:10px 30px;font-size:14px;cursor:pointer;width:100%">確定</button></div>'
  document.body.appendChild(overlay)
  function updateCount() {
    var checked = overlay.querySelectorAll(".downgrade-svc-cb:checked").length
    var countEl = document.getElementById("downgrade-count")
    countEl.textContent = checked + " / " + FREE_PLAN_LIMIT + " 選択中"
    countEl.style.color = checked === FREE_PLAN_LIMIT ? "#4caf50" : (checked > FREE_PLAN_LIMIT ? "#f44336" : "var(--text-sub,#aaa)")
    document.getElementById("downgrade-confirm-btn").disabled = checked !== FREE_PLAN_LIMIT
  }
  overlay.querySelectorAll(".downgrade-svc-cb").forEach(function(cb) {
    cb.addEventListener("change", updateCount)
  })
  updateCount()
  document.getElementById("downgrade-confirm-btn").onclick = function() {
    var checked = Array.from(overlay.querySelectorAll(".downgrade-svc-cb:checked")).map(function(cb) { return cb.value })
    if (checked.length !== FREE_PLAN_LIMIT) return
    var removed = S.serviceOrder.filter(function(id) { return checked.indexOf(id) === -1 })
    removed.forEach(function(id) { if(S.services[id]) S.services[id].added = false })
    S.serviceOrder = checked
    renderSidebar()
    if (S.serviceOrder.length > 0) activateService(S.serviceOrder[0])
    overlay.remove()
  }
}

var _licenseCheckTimer = null
function startPeriodicLicenseCheck() {
  if (_licenseCheckTimer) clearInterval(_licenseCheckTimer)
  _licenseCheckTimer = setInterval(async function() {
    if (licenseStatus.plan !== "pro" || !licenseStatus.key) return
    try {
      var result = await window.electronAPI.verifyLicense(licenseStatus.key)
      if (!result || result.status !== "active") {
        console.log("[HubChat] Periodic check: license no longer active")
        licenseStatus = { plan: "free", key: null, email: null }
        await window.electronAPI.storeDelete("licenseKey")
        localStorage.removeItem("hc_license_key")
        await window.electronAPI.storeSet("lastKnownPlan", "free")
        updateLicenseUI()
        if (S.serviceOrder.length > FREE_PLAN_LIMIT) {
          showServiceSelectDialog()
        } else {
          showDowngradeNotice()
        }
      }
    } catch(e) {
      console.log("[HubChat] Periodic license check error:", e)
    }
  }, 60 * 60 * 1000)
}

function updateLicenseUI() {
  const statusEl = document.getElementById('license-status')
  const inputEl = document.getElementById('license-key-input')
  const verifyBtn = document.getElementById('license-verify-btn')
  const upgradeBtn = document.getElementById('license-upgrade-btn')
  if (!statusEl) return

  if (licenseStatus.plan === 'pro') {
    statusEl.innerHTML = '現在のプラン: <strong style="color:#a6e3a1;">プロ</strong>'
    if (inputEl) inputEl.style.display = 'none'
    if (verifyBtn) verifyBtn.style.display = 'none'
    if (upgradeBtn) upgradeBtn.style.display = 'none'
  } else {
    const activeCount = S.serviceOrder.length
    statusEl.innerHTML = `現在のプラン: <strong>フリー</strong>（${activeCount}/${FREE_PLAN_LIMIT}サービス）`
    if (inputEl) inputEl.style.display = ''
    if (verifyBtn) verifyBtn.style.display = ''
    if (upgradeBtn) upgradeBtn.style.display = ''
  }
}

function isOverFreeLimit() {
  return licenseStatus.plan === 'free' && S.serviceOrder.length >= FREE_PLAN_LIMIT
}

function showUpgradeDialog() {
  const overlay = document.createElement('div')
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;'
  const dialog = document.createElement('div')
  dialog.style.cssText = 'background:var(--bg-card,#2a2a3e);border-radius:16px;padding:32px;width:420px;max-width:90vw;color:var(--text-main,#fff);text-align:center;'
  dialog.innerHTML = `
    <h3 style="margin:0 0 12px;font-size:18px;">サービス上限に達しました</h3>
    <p style="margin:0 0 20px;font-size:14px;color:var(--text-sub);line-height:1.7;">フリープランでは${FREE_PLAN_LIMIT}サービスまでご利用いただけます。<br>プロプランにアップグレードすると無制限で利用できます。</p>
    <button id="upgrade-now-btn" style="width:100%;padding:12px;background:#06C755;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:10px;">プロプランにアップグレード（月額550円）</button>
    <button id="upgrade-cancel-btn" style="width:100%;padding:10px;background:var(--bg-hover);color:var(--text-sub);border:none;border-radius:8px;font-size:13px;cursor:pointer;">閉じる</button>
  `
  overlay.appendChild(dialog)
  document.body.appendChild(overlay)
  dialog.querySelector('#upgrade-now-btn').addEventListener('click', () => {
    window.electronAPI.openExternal(HC_PAYMENT_URL)
    document.body.removeChild(overlay)
  })
  dialog.querySelector('#upgrade-cancel-btn').addEventListener('click', () => {
    document.body.removeChild(overlay)
  })
  overlay.addEventListener('click', (e) => { if (e.target === overlay) document.body.removeChild(overlay) })
}

// 設定画面のライセンスボタン

// --- メインプロセスからのIPC受信 ---
if (window.electronAPI) {
  if (window.electronAPI.onNavigateInService) {
    window.electronAPI.onNavigateInService((url) => {
      if (S && S.activeService) {
        const wv = document.querySelector('webview[data-id="' + S.activeService + '"]')
        if (wv) wv.loadURL(url)
      }
    })
  }
  if (window.electronAPI.onSwitchToService) {
    window.electronAPI.onSwitchToService((url) => {
      try {
        const hostname = new URL(url).hostname
        if (S && S.serviceOrder) {
          for (const id of S.serviceOrder) {
            const svc = ALL_SERVICES.find(s => s.id === id)
            if (svc && svc.domain && (hostname === svc.domain || hostname.endsWith('.' + svc.domain))) {
              activateService(id)
              setTimeout(() => {
                const wv = document.querySelector('webview[data-id="' + id + '"]')
                if (wv) wv.loadURL(url)
              }, 500)
              return
            }
          }
        }
        // 該当サービスが見つからなければ外部ブラウザ
        if (window.electronAPI.openExternal) window.electronAPI.openExternal(url)
      } catch(e) {
        if (window.electronAPI.openExternal) window.electronAPI.openExternal(url)
      }
    })
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', async (e) => {
    if (e.target.id === 'license-verify-btn') {
      const input = document.getElementById('license-key-input')
      const key = input ? input.value.trim() : ''
      if (!key) return
      e.target.textContent = '確認中...'
      e.target.disabled = true
      const result = await window.electronAPI.verifyLicense(key)
      if (result && result.status === 'device_mismatch') {
        alert('このライセンスキーは別の端末で使用されています')
        e.target.textContent = '認証'
        e.target.disabled = false
        return
      }
      if (result && result.status === 'active') {
        const actRes = await window.electronAPI.activateLicense(key)
        if (actRes && actRes.status === 'device_mismatch') {
          alert('このライセンスキーは別の端末で使用されています')
          e.target.textContent = '認証'
          e.target.disabled = false
          return
        }
        licenseStatus = { plan: 'pro', key: key, email: result.email }
        await window.electronAPI.storeSet('licenseKey', key)
        console.log("[HubChat-DEBUG] storeSet licenseKey called with:", key)
        updateLicenseUI()
        renderSidebar()
      } else {
        alert(result?.message || '無効なライセンスキーです')
      }
      e.target.textContent = '認証'
      e.target.disabled = false
    }
    if (e.target.id === 'license-upgrade-btn') {
      window.electronAPI.openExternal(HC_PAYMENT_URL)
    }
  })
})

// toggleSvcをオーバーライドしてフリープラン制限を追加
const _origToggleSvc = toggleSvc
toggleSvc = async function(id) {
  const svc = S.services[id]
  if (!svc || !svc.added) {
    // 新規追加時にフリープラン制限チェック
    if (isOverFreeLimit()) {
      showUpgradeDialog()
      return
    }
  }
  return _origToggleSvc(id)
}


// ============================================================
// ============================================================
// ショートカットキー: Ctrl+↑↓ でサイドバーのサービス切替
// ============================================================
document.addEventListener('keydown', (e) => {
  const isMac = /Mac/.test(navigator.platform)
  const modOk = isMac ? (e.metaKey && e.shiftKey && !e.altKey) : (e.ctrlKey && e.shiftKey && !e.altKey)
  if (!modOk) return
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
  e.preventDefault()
  e.stopPropagation()

  const icons = Array.from(document.querySelectorAll('#sidebar .svc-icon'))
  const order = icons.map(el => el.dataset.id).filter(Boolean)
  if (order.length === 0) return

  let current = S.activeId
  let idx = order.indexOf(current)
  if (idx === -1) idx = 0

  if (e.key === 'ArrowDown') {
    idx = (idx + 1) % order.length
  } else {
    idx = (idx - 1 + order.length) % order.length
  }
  console.log('[HubChat] shortcut:', e.key, 'from', current, 'to', order[idx])
  activateService(order[idx])
})


// ショートカットキー: Cmd/Ctrl+1〜9 でサービス番号指定切替
document.addEventListener("keydown", (e) => {
  const isMac = /Mac/.test(navigator.platform)
  const mod = isMac ? e.metaKey : e.ctrlKey
  if (!mod || e.shiftKey || e.altKey) return
  const num = parseInt(e.key, 10)
  if (num >= 1 && num <= 9) {
    e.preventDefault()
    const icons = Array.from(document.querySelectorAll("#sidebar .svc-icon"))
    const order = icons.map(el => el.dataset.id).filter(Boolean)
    const idx = num - 1
    if (idx < order.length) {
      console.log("[HubChat] switch by number:", num, "->", order[idx])
      activateService(order[idx])
    }
  }
})


// ズーム機能: Cmd/Ctrl + Plus で拡大、Cmd/Ctrl + Minus で縮小、Cmd/Ctrl + 0 でリセット
var serviceZoomLevels = {}
document.addEventListener("keydown", (e) => {
  var isMac = /Mac/.test(navigator.platform)
  var mod = isMac ? e.metaKey : e.ctrlKey
  if (!mod || e.altKey) return
  var zoomChange = 0
  var isReset = false
  if (e.shiftKey && (e.key === "_" || e.code === "Minus")) { zoomChange = 0.1 }
  else if (!e.shiftKey && (e.key === "-" || e.code === "Minus")) { zoomChange = -0.1 }
  else if (!e.shiftKey && (e.key === "0" || e.code === "Digit0")) { isReset = true }
  else return
  e.preventDefault()
  if (!S.activeId) return
  var wv = document.querySelector("webview[data-id='" + S.activeId + "']")
  if (!wv) return
  if (isReset) {
    serviceZoomLevels[S.activeId] = 0
    wv.setZoomLevel(0)
  } else {
    var current = serviceZoomLevels[S.activeId] || 0
    var newLevel = Math.max(-5, Math.min(5, current + zoomChange))
    serviceZoomLevels[S.activeId] = newLevel
    wv.setZoomLevel(newLevel)
  }
})

// IPC経由のズーム（webviewフォーカス中のCmd+/-/0）
if (window.electronAPI && window.electronAPI.onZoomService) {
  window.electronAPI.onZoomService((key) => {
    if (!S.activeId) return
    var wv = document.querySelector("webview[data-id='" + S.activeId + "']")
    if (!wv) return
    if (key === "0") {
      serviceZoomLevels[S.activeId] = 0
      wv.setZoomLevel(0)
    } else {
      var change = (key === "_") ? 0.1 : -0.1
      var current = serviceZoomLevels[S.activeId] || 0
      var newLevel = Math.max(-5, Math.min(5, current + change))
      serviceZoomLevels[S.activeId] = newLevel
      wv.setZoomLevel(newLevel)
    }
  })
}
// IPC経由のサービス切替（webviewフォーカス中のショートカット）
if (window.electronAPI && window.electronAPI.onCycleService) {
  window.electronAPI.onCycleService((direction) => {
    const icons = Array.from(document.querySelectorAll("#sidebar .svc-icon"))
    const order = icons.map(el => el.dataset.id).filter(Boolean)
    if (order.length === 0) return
    let current = S.activeId
    let idx = order.indexOf(current)
    if (idx === -1) idx = 0
    if (direction === "down") {
      idx = (idx + 1) % order.length
    } else {
      idx = (idx - 1 + order.length) % order.length
    }
    console.log("[HubChat] cycle-service:", direction, "from", current, "to", order[idx])
    activateService(order[idx])
  })
}

// 通知クリック時のサービス切替
if (window.electronAPI && window.electronAPI.onSwitchToService) {
  window.electronAPI.onSwitchToService((id) => {
    console.log("[HubChat] notification click -> switch to:", id)
    activateService(id)
  })
}

// Cmd/Ctrl+1〜9 でサービス番号指定切替
if (window.electronAPI && window.electronAPI.onSwitchServiceByIndex) {
  window.electronAPI.onSwitchServiceByIndex((idx) => {
    const icons = Array.from(document.querySelectorAll("#sidebar .svc-icon"))
    const order = icons.map(el => el.dataset.id).filter(Boolean)
    if (idx < order.length) {
      console.log("[HubChat] switch by index:", idx, "->", order[idx])
      activateService(order[idx])
    }
  })
}
// アプリ起動時にライセンス確認
const _origInit = init
init = async function() {
  console.log('[HubChat-DEBUG] init() started')
  try {
    await _origInit()
    console.log('[HubChat-DEBUG] _origInit() completed')
  } catch(e) {
    console.error('[HubChat-DEBUG] _origInit() FAILED:', e)
  }
  try {
    await initLicense()
    console.log('[HubChat-DEBUG] initLicense() completed')
    if(licenseStatus.plan === "free" && S.serviceOrder.length > FREE_PLAN_LIMIT){
      console.log("[HubChat] Free plan: services exceed limit, showing selection dialog")
      showServiceSelectDialog()
    }
  } catch(e) {
    console.error('[HubChat-DEBUG] initLicense() FAILED:', e)
  }
  try {
    syncServiceDomains()
    console.log('[HubChat-DEBUG] syncServiceDomains() completed')
  } catch(e) {
    console.error('[HubChat-DEBUG] syncServiceDomains() FAILED:', e)
  }
}


// バージョン情報表示
async function showVersionInfo() {
  try {
    const info = await window.electronAPI.getAppVersion()
    const el = document.getElementById('current-version')
    if (el) el.textContent = 'v' + info.current

    const statusEl = document.getElementById('version-status')
    if (statusEl && info.latest) {
      if (info.latest === info.current) {
        statusEl.textContent = '最新バージョンです'
        statusEl.style.color = '#4CAF50'
      } else {
        statusEl.textContent = '最新バージョン v' + info.latest + ' が利用可能です'
        statusEl.style.color = '#f90'
      }
    } else if (statusEl) {
      statusEl.textContent = 'バージョン確認に失敗しました'
      statusEl.style.color = '#aaa'
    }
  } catch(e) {
    console.log('[HubChat] version check error:', e)
  }
}
document.addEventListener('DOMContentLoaded', showVersionInfo)
