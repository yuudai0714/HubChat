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
  { id:"notebooklm", name:"NotebookLM", url:"https://notebooklm.google.com/", category:"ai", color:"#FBBC04", domain:"notebooklm.google.com", icon:"https://notebooklm.google.com/favicon.ico" },
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
const HIBERNATE_TIMEOUT     = 3 * 60 * 1000   // 3分: about:blank退避
const DEEP_HIBERNATE_TIMEOUT = 15 * 60 * 1000 // 15分: DOMごと破棄
const BADGE_POLL_INTERVAL   = 3 * 60 * 1000   // 3分ごとにバッジ巡回ポーリング
let hibernatedServices = new Set()  // ハイバネーション中のサービスID
let badgePollIndex = 0  // バッジポーリングの現在インデックス
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

  // 起動時：前回使っていたサービス（または最初のサービス）だけロード
  // 他は完全オンデマンド（クリック時に初めてwebview生成）
  const addedServices = S.serviceOrder.filter(id => S.services[id]?.added && S.services[id]?.enabled)

  if (addedServices.length > 0) {
    const lastActive = await window.electronAPI.storeGet('lastActiveService', null)
    const initialId = (lastActive && addedServices.includes(lastActive)) ? lastActive : addedServices[0]
    activateService(initialId, false)
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
  attachCrashRecovery(wv, id)
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
  // 次回起動時のために最後に使ったサービスを保存
  try { window.electronAPI.storeSet('lastActiveService', id) } catch(e) {}

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

  // 他サービスの残留エラー/ローディング表示を除去（被り防止）
  document.querySelectorAll('#webview-container .loading-wrap').forEach(el => {
    if (el.dataset.for !== id) el.remove()
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
    attachCrashRecovery(wv, id)

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
  // - 3分経過: about:blank退避（軽量ハイバネーション）
  // - 15分経過: webview DOMごと破棄（完全破棄）
  setInterval(() => {
    const now = Date.now()
    document.querySelectorAll("webview[data-id]").forEach(wv => {
      const id = wv.dataset.id
      if (id === S.activeId) return
      const last = lastActiveTime[id] || 0
      if (last <= 0) return

      // 深層ハイバネーション: DOMごと破棄
      if ((now - last) > DEEP_HIBERNATE_TIMEOUT) {
        console.log("[HubChat] deep hibernating (destroy):", id)
        wv.remove()
        hibernatedServices.delete(id)
        return
      }

      // 軽量ハイバネーション: about:blank退避
      if (!hibernatedServices.has(id) && (now - last) > HIBERNATE_TIMEOUT) {
        console.log("[HubChat] hibernating:", id)
        wv.dataset.origSrc = wv.getAttribute("src") || wv.src
        wv.setAttribute("src", "about:blank")
        hibernatedServices.add(id)
      }
    })
  }, 60000)

  // バッジポーリング: 3分ごとに1サービスずつバックグラウンドで軽く読み込み
  // → バッジが更新されたら再度ハイバネ。起動を邪魔しないよう初回は2分後に開始
  setTimeout(() => {
    setInterval(() => {
      const enabled = S.serviceOrder.filter(id => S.services[id]?.added && S.services[id]?.enabled && id !== S.activeId)
      if (enabled.length === 0) return
      const id = enabled[badgePollIndex % enabled.length]
      badgePollIndex++
      const svc = ALL_SERVICES.find(s => s.id === id)
      if (!svc) return

      // 直近に繰り返しクラッシュした不安定なサービスはバックグラウンド再生成しない
      // （落ちる→再生成→また落ちる、のループとメモリ浪費を防ぐ）
      const cr = crashRecoveryState[id]
      if (cr && cr.count > 2 && (Date.now() - cr.lastTs) < 10 * 60 * 1000) {
        console.log("[HubChat] badge-poll skip unstable:", id)
        return
      }

      let wv = document.querySelector(`webview[data-id="${id}"]`)
      if (!wv) {
        // DOMが無ければ非表示webviewを新規作成してバッジだけ取得
        wv = document.createElement("webview")
        wv.dataset.id = id
        wv.setAttribute("src", S.services[id]?.customUrl || svc.url)
        const isGoogle = svc.domain && svc.domain.endsWith("google.com")
        wv.setAttribute("partition", isGoogle ? "persist:google" : `persist:${id}`)
        wv.setAttribute("allowpopups", "")
        wv.setAttribute("useragent",
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/137.0.0.0 Safari/537.36")
        wv.style.display = "none"
        document.getElementById("webview-container").appendChild(wv)
        setupBadgeWatcher(wv, id)
        attachCrashRecovery(wv, id)
        // バッジ取得後に即ハイバネ対象にするため、lastActiveTimeを過去時刻に
        lastActiveTime[id] = Date.now() - HIBERNATE_TIMEOUT + 30000 // 30秒後にハイバネ対象
        console.log("[HubChat] badge-poll (spawn):", id)
      } else if (hibernatedServices.has(id) && wv.dataset.origSrc) {
        // ハイバネ中 → 一時復帰してバッジ更新
        console.log("[HubChat] badge-poll (wake):", id)
        wv.setAttribute("src", wv.dataset.origSrc)
        delete wv.dataset.origSrc
        hibernatedServices.delete(id)
        lastActiveTime[id] = Date.now() - HIBERNATE_TIMEOUT + 30000
      }
    }, BADGE_POLL_INTERVAL)
  }, 120000) // 起動2分後から開始
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

  // Dock合計バッジ更新 + サイドバーのロゴにも総数表示
  const allBadges = document.querySelectorAll(".svc-icon .badge:not(.dot)")
  let total = 0
  allBadges.forEach(b => { const n = parseInt(b.textContent, 10); if (!isNaN(n)) total += n })
  if (window.electronAPI && window.electronAPI.updateDockBadge) {
    window.electronAPI.updateDockBadge(total)
  }
  // ロゴ（左上）に未読総数バッジ
  const logo = document.getElementById('app-logo')
  if (logo) {
    let lb = logo.querySelector('.logo-total-badge')
    if (total > 0) {
      if (!lb) { lb = document.createElement('div'); lb.className = 'logo-total-badge'; logo.appendChild(lb) }
      lb.textContent = total > 99 ? '99+' : total
    } else if (lb) {
      lb.remove()
    }
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

// ============================================================
// クラッシュ自動復帰: webviewのレンダラープロセスが落ちたら自動リロード
// ============================================================
const crashRecoveryState = {} // { id: { count, lastTs } }
function attachCrashRecovery(wv, id) {
  if (wv.__crashRecoveryAttached) return
  wv.__crashRecoveryAttached = true

  const recover = (reason) => {
    const st = crashRecoveryState[id] || { count: 0, lastTs: 0 }
    const now = Date.now()
    // 直近に復帰していたらカウント加算、しばらく無事ならリセット
    if (now - st.lastTs < 60000) st.count++
    else st.count = 1
    st.lastTs = now
    crashRecoveryState[id] = st

    const svc = ALL_SERVICES.find(s => s.id === id)
    const name = svc ? svc.name : id
    const isActive = (id === S.activeId)
    const url = S.services[id]?.customUrl || svc?.url
    console.log(`[HubChat] crash (${reason}) ${id} active=${isActive} attempt=${st.count}`)

    // --- バックグラウンドのサービスが落ちた場合 ---
    // エラー画面は絶対に出さない（表示中の別サービスに被るため）。静かに処理。
    if (!isActive) {
      if (st.count > 2) {
        // 繰り返し落ちるなら諦めてwebviewを破棄（バッジ巡回で後ほど再生成される）
        console.log(`[HubChat] background ${id} unstable, removing quietly`)
        try { wv.remove() } catch(e) {}
        return
      }
      // 1〜2回なら静かに再読み込みのみ
      setTimeout(() => {
        try { if (url && url !== 'about:blank') wv.setAttribute('src', url) } catch(e) {}
      }, 1000)
      return
    }

    // --- アクティブなサービスが落ちた場合 ---
    // 短時間に3回以上落ちるならループ回避でエラー表示（アクティブ時のみ）
    if (st.count > 3) {
      // 既存のエラー表示があれば重複させない
      const cont = document.getElementById('webview-container')
      if (cont.querySelector(`.loading-wrap[data-for="${id}"]`)) return
      const ld = document.createElement('div')
      ld.className = 'loading-wrap'
      ld.dataset.for = id
      ld.innerHTML = `
        <div style="text-align:center;color:var(--text-sub)">
          <div style="font-size:42px;margin-bottom:12px">😵</div>
          <p style="font-size:16px;font-weight:600;margin-bottom:8px">${name} が繰り返し停止しました</p>
          <button onclick="reloadWV('${id}')"
            style="padding:10px 22px;background:var(--accent);color:#11111b;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">
            手動で再読み込み
          </button>
        </div>`
      cont.appendChild(ld)
      return
    }

    // 自動リロード（指数バックオフ風に少し待つ）
    const delay = Math.min(500 * st.count, 2000)
    setTimeout(() => {
      try {
        const u = url || wv.getAttribute('src')
        if (u && u !== 'about:blank') {
          wv.setAttribute('src', u)
          if (wv.reloadIgnoringCache) { try { wv.reloadIgnoringCache() } catch(e) {} }
        }
      } catch(e) { console.log('[HubChat] recover reload failed:', e) }
    }, delay)
  }

  // Electron 28: render-process-gone（crashed/oom/killed等）
  wv.addEventListener('render-process-gone', (e) => {
    const r = e.reason || (e.details && e.details.reason) || 'unknown'
    if (r === 'clean-exit') return // 正常終了は無視
    recover(r)
  })
  // 旧API互換
  wv.addEventListener('crashed', () => recover('crashed'))
  // 無応答が続いたら一度リロード
  wv.addEventListener('unresponsive', () => {
    console.log('[HubChat] webview unresponsive:', id)
    if (id === S.activeId) recover('unresponsive')
  })
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
// Help / Q&A Modal （FAQ形式）
// ============================================================
const FAQ_DATA = [
  // --- 基本操作 ---
  { cat:'基本操作', q:'サービスを追加するには？', a:'左下の <strong>＋</strong> ボタンをクリックし、追加したいサービスを選びます。上部のカテゴリタブで絞り込めます。' },
  { cat:'基本操作', q:'サービスを切り替えるには？', a:'左サイドバーのアイコンをクリックします。または <strong>⌘K</strong>（Win: Ctrl+K）でクイック検索を開き、名前を打って選ぶと一瞬で移動できます。' },
  { cat:'基本操作', q:'サービスの並び順を変えたい', a:'サイドバーのアイコンを<strong>ドラッグ＆ドロップ</strong>で好きな順に並び替えられます。' },
  { cat:'基本操作', q:'サービスを削除・非表示にしたい', a:'サイドバーのアイコンを<strong>右クリック</strong>するとメニューが出ます。「非表示」で隠す、「削除」で完全に除去できます。' },
  // --- ショートカット ---
  { cat:'ショートカット', q:'クイック検索を開くには？', a:'<strong>⌘K</strong>（Win: Ctrl+K）。サービス名を打つだけで目的のサービスへ即移動できます。' },
  { cat:'ショートカット', q:'前後のサービスへ切り替えたい', a:'<strong>⌘Shift+]</strong> で次、<strong>⌘Shift+[</strong> で前（Win: Ctrl+Shift+）。<strong>⌘1〜9</strong> で番号順に直接切り替えもできます。' },
  { cat:'ショートカット', q:'文字や表示が小さい／大きい（ズーム）', a:'<strong>⌘ +</strong> で拡大、<strong>⌘ -</strong> で縮小、<strong>⌘ 0</strong> でリセット（Win: Ctrl）。ズーム倍率はサービスごとに保存されます。' },
  // --- 画面・操作 ---
  { cat:'画面・操作', q:'戻る・進む・更新ボタンはどこ？', a:'画面上部のバー左側に<strong>常時表示</strong>されています（◀ 戻る／▶ 進む／↻ 更新）。' },
  { cat:'画面・操作', q:'ウィンドウを移動するには？', a:'上部バーの<strong>中央の空いている部分</strong>をドラッグするとウィンドウを動かせます。' },
  { cat:'画面・操作', q:'テーマ（ダーク／ライト）を変えたい', a:'上部バー右の <strong>⚙（設定）</strong>を開き、「テーマ」でダーク／ライトを切り替えられます。' },
  // --- ログイン ---
  { cat:'ログイン', q:'Outlook・Teams にログインできない', a:'HubChat内のMicrosoft認証は<strong>「メールにコードを送信」方式のみ</strong>利用できます。<br>手順：①メールアドレス入力 →②「別の方法でサインインする」→③「○○ にコードを送信」→④届いたコードを入力。<br><span style="color:#f38ba8;">顔/指紋/PIN/パスキー/パスワード入力/アプリ承認は利用不可</span>です。' },
  { cat:'ログイン', q:'Google でログインできない（Canva等）', a:'Googleのセキュリティにより、デスクトップアプリ内のGoogleログインがブロックされる場合があります（HubChat固有ではなく同種アプリ共通）。<strong>各サービスのメールアドレス＋パスワード方式</strong>でログインしてください。Googleで登録したサービスでも、各サービスの「パスワードをお忘れの場合」からパスワードを設定できます。' },
  { cat:'ログイン', q:'Canva のログイン方法', a:'ログイン画面で <strong>「別の方法でログイン」→「メールアドレスでログイン」</strong>を選びます。パスワード未設定なら <a href="https://www.canva.com/ja_jp/help/reset-password/" class="faq-ext-link">Canvaのパスワードリセット</a> から設定できます。' },
  { cat:'ログイン', q:'Slack のワークスペースを追加するには？', a:'Slackを追加するとURL入力欄が出ます。形式は <strong>your-workspace.slack.com</strong>。分からなければブラウザでSlackにログインし、アドレスバーのURLを確認してください。' },
  // --- トラブル ---
  { cat:'トラブル', q:'画面が白い・読み込まれない', a:'上部バーの<strong>更新（↻）</strong>を試してください。直らなければ、そのサービスを一度削除して再追加してください。' },
  { cat:'トラブル', q:'ログインがすぐ切れる', a:'Cookie/セッションの問題で切れることがあります。更新するか、サービスを再追加してください。' },
  { cat:'トラブル', q:'通知が来ない', a:'各サービス側の通知設定が有効か確認してください。HubChatはサイドバーのアイコンに<strong>バッジ（赤い数字）</strong>で未読を表示します。' },
  { cat:'トラブル', q:'アプリが固まった／重い', a:'一度 <strong>⌘Q</strong> で完全終了してから開き直してください。使っていないサービスは自動で休止してメモリを節約します。' },
  // --- 更新 ---
  { cat:'アップデート', q:'最新版に更新するには？', a:'新バージョンが出ると画面右下に通知が出ます。<strong>「今すぐ更新」</strong>→ダウンロード後 <strong>「再起動してインストール」</strong>で自動更新されます（手動DL不要）。' },
  // --- 問い合わせ ---
  { cat:'お問い合わせ', q:'質問・不具合を報告したい', a:'YDK公式LINEからどうぞ。メッセージの最初に「HubChatについて」と書いてお送りください。<br><a href="https://lin.ee/7x6Gosp" class="faq-line-link" style="display:inline-block;margin-top:8px;padding:10px 20px;background:#06C755;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;">LINEで問い合わせる</a>' },
]

function setupFAQ() {
  if (window.__faqWired) return
  window.__faqWired = true
  const input = document.getElementById('faq-search-input')
  const clearBtn = document.getElementById('faq-search-clear')
  const catsEl = document.getElementById('faq-cats')
  const listEl = document.getElementById('faq-list')
  if (!input || !listEl) return

  const cats = []
  FAQ_DATA.forEach(f => { if (!cats.includes(f.cat)) cats.push(f.cat) })
  let activeCat = 'all'
  let q = ''
  const collapsedSet = new Set() // 既定は全展開。閉じたものだけ記録

  function render() {
    // カテゴリチップ（検索中は隠す）
    if (q) {
      catsEl.style.display = 'none'
    } else {
      catsEl.style.display = 'flex'
      catsEl.innerHTML = `<button class="faq-cat${activeCat==='all'?' active':''}" data-c="all">すべて</button>` +
        cats.map(c => `<button class="faq-cat${activeCat===c?' active':''}" data-c="${c}">${c}</button>`).join('')
      catsEl.querySelectorAll('.faq-cat').forEach(b => b.addEventListener('click', () => { activeCat = b.dataset.c; render() }))
    }

    // フィルタ
    let items = FAQ_DATA
    if (q) {
      const lq = q.toLowerCase()
      items = items.filter(f => (f.q + ' ' + f.a + ' ' + f.cat).toLowerCase().includes(lq))
    } else if (activeCat !== 'all') {
      items = items.filter(f => f.cat === activeCat)
    }

    if (items.length === 0) {
      listEl.innerHTML = '<p style="color:var(--text-sub);text-align:center;padding:36px 0;font-size:13px;">該当する項目がありません</p>'
      return
    }

    // 既定は全件展開（検索時も展開）。ユーザーが閉じたものだけ畳む
    listEl.innerHTML = items.map((f) => {
      const key = f.cat + '|' + f.q
      const open = q ? true : !collapsedSet.has(key)
      return `<div class="faq-item${open?' open':''}" data-key="${key.replace(/"/g,'&quot;')}">
        <button class="faq-q"><span class="faq-q-cat">${f.cat}</span><span class="faq-q-text">${f.q}</span><span class="faq-q-arrow">⌄</span></button>
        <div class="faq-a">${f.a}</div>
      </div>`
    }).join('')

    listEl.querySelectorAll('.faq-item').forEach(item => {
      item.querySelector('.faq-q').addEventListener('click', () => {
        const key = item.dataset.key
        if (item.classList.contains('open')) { item.classList.remove('open'); collapsedSet.add(key) }
        else { item.classList.add('open'); collapsedSet.delete(key) }
      })
    })
    // 外部リンク
    listEl.querySelectorAll('.faq-ext-link, .faq-line-link').forEach(a => {
      a.addEventListener('click', (e) => { e.preventDefault(); if (window.electronAPI?.openExternal) window.electronAPI.openExternal(a.href) })
    })
  }

  input.addEventListener('input', () => {
    q = input.value.trim()
    clearBtn.style.display = q ? '' : 'none'
    render()
  })
  clearBtn.addEventListener('click', () => { input.value=''; q=''; clearBtn.style.display='none'; input.focus(); render() })
  render()
}

function openHelp() {
  document.getElementById('help-modal').classList.remove('hidden')
  const si = document.getElementById('faq-search-input')
  if (si) setTimeout(() => si.focus(), 50)
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

  // FAQ（検索＋カテゴリ＋アコーディオン）初期化
  setupFAQ()

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

// 管理者マシンID（このマシンは常にPro・サーバー認証不要）
const ADMIN_MACHINE_IDS = ['d7a84f74-acaf-5d07-9bfa-83d1f9768fad']

async function initLicense() {
  // 管理者マシンチェック（最優先・サーバー不要）
  try {
    if (window.electronAPI.getMachineId) {
      const mid = await window.electronAPI.getMachineId()
      if (ADMIN_MACHINE_IDS.includes(mid)) {
        licenseStatus = { plan: "pro", key: "ADMIN", email: "yudai0714@ydk-ai.com" }
        await window.electronAPI.storeSet("lastKnownPlan", "pro")
        updateLicenseUI()
        startPeriodicLicenseCheck()
        return
      }
    }
  } catch(e) { console.log('[HubChat] admin check error:', e) }

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
    if (licenseStatus.key === "ADMIN") return // 管理者は常にPro・スキップ
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
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.66);backdrop-filter:blur(3px);z-index:10000;display:flex;align-items:center;justify-content:center;'
  const dialog = document.createElement('div')
  dialog.style.cssText = 'background:var(--bg-card,#2a2a3e);border:1px solid rgba(247,147,30,.35);border-radius:18px;padding:30px 30px 26px;width:440px;max-width:92vw;color:var(--text-main,#fff);box-shadow:0 24px 60px rgba(0,0,0,.5);'
  dialog.innerHTML = `
    <div style="text-align:center;font-size:34px;margin-bottom:6px;">⭐️</div>
    <h3 style="margin:0 0 6px;font-size:19px;font-weight:800;text-align:center;">${FREE_PLAN_LIMIT}サービスの上限に到達しました</h3>
    <p style="margin:0 0 18px;font-size:13px;color:var(--text-sub);line-height:1.7;text-align:center;">
      Proにすると<strong style="color:var(--accent,#f7931e);">全サービスを無制限</strong>で追加でき、<br>
      仕事ツールをこの1画面に完全集約できます。
    </p>
    <div style="background:rgba(255,255,255,.04);border-radius:12px;padding:14px 16px;margin-bottom:18px;font-size:13px;line-height:1.9;">
      <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-sub);">無制限のサービス追加</span><span style="color:#06C755;font-weight:700;">Pro ✓</span></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-sub);">全SNS・AI・Googleツール対応</span><span style="color:#06C755;font-weight:700;">Pro ✓</span></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-sub);">今後の新機能もすべて</span><span style="color:#06C755;font-weight:700;">Pro ✓</span></div>
    </div>
    <button id="upgrade-now-btn" style="width:100%;padding:14px;background:linear-gradient(135deg,#f7931e,#ff6b35);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:800;cursor:pointer;margin-bottom:10px;box-shadow:0 6px 18px rgba(247,147,30,.35);">Proにアップグレード（月額550円）</button>
    <button id="upgrade-cancel-btn" style="width:100%;padding:9px;background:transparent;color:var(--text-sub);border:none;font-size:12px;cursor:pointer;">あとで</button>
    <p style="margin:8px 0 0;font-size:11px;color:var(--text-sub);text-align:center;opacity:.7;">いつでも解約可能 · クレジットカード対応</p>
  `
  overlay.appendChild(dialog)
  document.body.appendChild(overlay)
  try { if (window.gtag) window.gtag('event','upsell_shown',{event_category:'conversion'}) } catch(e) {}
  dialog.querySelector('#upgrade-now-btn').addEventListener('click', () => {
    try { if (window.gtag) window.gtag('event','upsell_click',{event_category:'conversion'}) } catch(e) {}
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
// ⌘K / Ctrl+K クイックスイッチャー: 名前を打って即サービス移動
// ============================================================
const QuickSwitcher = (function(){
  let overlay = null, input = null, list = null, items = [], sel = 0

  function build() {
    overlay = document.createElement('div')
    overlay.id = 'qs-overlay'
    overlay.innerHTML = `
      <div id="qs-box">
        <input id="qs-input" type="text" placeholder="サービスを検索…  (↑↓ で選択 · Enter で移動)" autocomplete="off" spellcheck="false">
        <div id="qs-list"></div>
      </div>`
    document.body.appendChild(overlay)
    input = overlay.querySelector('#qs-input')
    list = overlay.querySelector('#qs-list')

    overlay.addEventListener('click', e => { if (e.target === overlay) close() })
    input.addEventListener('input', () => { sel = 0; render() })
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel+1, items.length-1); render() }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel-1, 0); render() }
      else if (e.key === 'Enter') { e.preventDefault(); choose(sel) }
      else if (e.key === 'Escape') { e.preventDefault(); close() }
    })
  }

  function currentList(q) {
    const added = S.serviceOrder.filter(id => S.services[id]?.added && S.services[id]?.enabled)
    let arr = added.map(id => ALL_SERVICES.find(s => s.id === id)).filter(Boolean)
    if (q) {
      const lq = q.toLowerCase()
      arr = arr.filter(s => s.name.toLowerCase().includes(lq) || s.id.toLowerCase().includes(lq))
    }
    return arr
  }

  function badgeFor(id) {
    const b = document.querySelector(`.svc-icon[data-id="${id}"] .badge`)
    if (!b) return ''
    return `<span class="qs-badge">${b.textContent}</span>`
  }

  function render() {
    items = currentList(input.value.trim())
    if (sel >= items.length) sel = Math.max(0, items.length-1)
    if (!items.length) { list.innerHTML = '<div class="qs-empty">該当なし</div>'; return }
    list.innerHTML = items.map((s,i) => `
      <div class="qs-item${i===sel?' sel':''}" data-i="${i}">
        <img src="${s.icon || 'https://www.google.com/s2/favicons?domain='+s.domain+'&sz=64'}" onerror="this.style.visibility='hidden'">
        <span class="qs-name">${s.name}</span>
        ${badgeFor(s.id)}
      </div>`).join('')
    list.querySelectorAll('.qs-item').forEach(el => {
      el.addEventListener('click', () => choose(parseInt(el.dataset.i,10)))
      el.addEventListener('mousemove', () => { sel = parseInt(el.dataset.i,10); paintSel() })
    })
    paintSel()
  }

  function paintSel() {
    list.querySelectorAll('.qs-item').forEach((el,i) => el.classList.toggle('sel', i===sel))
    const cur = list.querySelector('.qs-item.sel')
    if (cur) cur.scrollIntoView({ block: 'nearest' })
  }

  function choose(i) {
    const s = items[i]
    if (s) { activateService(s.id); close() }
  }

  function open() {
    if (!overlay) build()
    sel = 0; input.value = ''
    overlay.classList.add('show')
    render()
    setTimeout(() => input.focus(), 0)
  }
  function close() { if (overlay) overlay.classList.remove('show') }
  function isOpen() { return overlay && overlay.classList.contains('show') }

  return { open, close, isOpen }
})()

document.addEventListener('keydown', (e) => {
  const isMac = /Mac/.test(navigator.platform)
  const mod = isMac ? e.metaKey : e.ctrlKey
  if (mod && !e.shiftKey && !e.altKey && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault()
    QuickSwitcher.isOpen() ? QuickSwitcher.close() : QuickSwitcher.open()
  }
})
// 上部バーの検索ボタン → クイックスイッチャー
document.getElementById('topbar-search')?.addEventListener('click', () => QuickSwitcher.open())
// 上部バーの更新ボタン → ワンクリック更新を開始
document.getElementById('update-btn')?.addEventListener('click', () => {
  if (window.HubUpdate) window.HubUpdate.start()
})

// ============================================================
// ============================================================
// ショートカットキー: Ctrl+↑↓ でサイドバーのサービス切替
// ============================================================
document.addEventListener('keydown', (e) => {
  const isMac = /Mac/.test(navigator.platform)
  const modOk = isMac ? (e.metaKey && e.shiftKey && !e.altKey) : (e.ctrlKey && e.shiftKey && !e.altKey)
  if (!modOk) return
  if (e.key !== '[' && e.key !== ']') return
  e.preventDefault()
  e.stopPropagation()

  const icons = Array.from(document.querySelectorAll('#sidebar .svc-icon'))
  const order = icons.map(el => el.dataset.id).filter(Boolean)
  if (order.length === 0) return

  let current = S.activeId
  let idx = order.indexOf(current)
  if (idx === -1) idx = 0

  if (e.key === ']') {
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


// ============================================================
// ワンクリック自動更新コントローラ（electron-updater連携）
// 裏でDL → 進捗表示 → 完了後「再起動してインストール」で自動入替
// ============================================================
const HubUpdate = (function(){
  let state = 'idle' // idle | downloading | downloaded
  let fallbackUrl = null

  function setToastBody(html) {
    const t = document.getElementById('hc-update-toast')
    if (t) { const slot = t.querySelector('#hc-update-actions'); if (slot) slot.innerHTML = html }
  }
  function setToastMsg(msg) {
    const t = document.getElementById('hc-update-toast')
    if (t) { const m = t.querySelector('#hc-update-msg'); if (m) m.textContent = msg }
  }

  async function start() {
    if (state === 'downloading') return
    if (state === 'downloaded') { reinstall(); return }
    state = 'downloading'
    window.__hubUpdateActive = true
    // クリック直後に「動いている」ことを即座に表示（%が来る前のラグ対策）
    setToastMsg('🔄 更新を開始しています…')
    setToastBody('<span style="display:inline-flex;align-items:center;gap:6px;color:#f90;font-size:12px;font-weight:700;"><span class="hc-spin" style="width:12px;height:12px;border:2px solid #f90;border-top-color:transparent;border-radius:50%;display:inline-block;animation:hcspin 0.7s linear infinite;"></span>更新中…</span><style>@keyframes hcspin{to{transform:rotate(360deg)}}</style>')
    try {
      // main側で「最新チェック→DL」をまとめて実行。失敗時は {ok:false} か update-error が返る
      const r = await window.electronAPI.downloadUpdate()
      if (r && r.ok === false) onError(r.error)
    } catch(e) { onError(String(e)) }
  }

  function reinstall() {
    setToastMsg('再起動しています…')
    setToastBody('<span style="color:#888;font-size:11px;">アプリが閉じて自動で開き直します</span>')
    setTimeout(() => window.electronAPI.quitAndInstall(), 100)
  }

  function onError(detail) {
    if (state === 'downloaded') return // 既に完了していれば無視
    state = 'idle'
    console.log('[HubChat] update error:', detail)
    if (fallbackUrl) {
      setToastMsg('自動更新に失敗。手動DLします')
      setToastBody(`<a href="${fallbackUrl}" target="_blank" rel="noopener" style="padding:6px 12px;background:#f90;color:#fff;border-radius:6px;font-size:12px;font-weight:700;text-decoration:none;">手動ダウンロード</a>`)
    } else {
      setToastMsg('更新に失敗しました')
    }
  }

  function init(ver, dlUrl) {
    fallbackUrl = dlUrl
    if (window.__hubUpdateWired) return
    window.__hubUpdateWired = true
    window.electronAPI.onUpdateDownloadProgress?.((p) => {
      const pct = (p && typeof p.percent === 'number') ? p.percent : 0
      setToastMsg(`ダウンロード中… ${pct}%`)
    })
    window.electronAPI.onUpdateDownloaded?.(() => {
      state = 'downloaded'
      setToastMsg('✅ ダウンロード完了')
      setToastBody('<button onclick="HubUpdate.start()" style="padding:7px 14px;background:#4CAF50;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">再起動してインストール</button><div style="font-size:10px;color:#888;margin-top:5px;line-height:1.4;">※押すとアプリが一度閉じ、<br>自動で新バージョンが開きます</div>')
    })
    window.electronAPI.onUpdateError?.((info) => onError(info && info.message))
  }

  return { init, start }
})()
window.HubUpdate = HubUpdate

// アップデート用トースト（GitHub API検知・electron-updater検知の両方から呼ぶ。重複は無視）
function showUpdateToast(v) {
  if (!v) return
  if (document.getElementById('hc-update-toast')) return
  const updateBtn = document.getElementById('update-btn')
  if (updateBtn) updateBtn.style.display = ''
  const platform = window.electronAPI.platform
  const dlUrl = platform === 'win32'
    ? 'https://github.com/yuudai0714/HubChat/releases/latest/download/HubChat-Setup-' + v + '.exe'
    : 'https://github.com/yuudai0714/HubChat/releases/latest/download/HubChat-' + v + '-arm64.dmg'
  HubUpdate.init(v, dlUrl)

  const toast = document.createElement('div')
  toast.id = 'hc-update-toast'
  toast.style.cssText = [
    'position:fixed','bottom:24px','right:24px','background:#1e1e2e',
    'border:1px solid #f90','border-radius:12px','padding:16px 20px',
    'z-index:99998','display:flex','align-items:center','gap:14px',
    'box-shadow:0 4px 20px rgba(0,0,0,0.5)','max-width:340px',
    'animation:slideInToast 0.3s ease'
  ].join(';')
  toast.innerHTML = `
    <style>@keyframes slideInToast{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}</style>
    <div style="font-size:24px;line-height:1;">🔔</div>
    <div style="flex:1;min-width:0;">
      <div style="color:#f90;font-weight:700;font-size:13px;margin-bottom:4px;">アップデートあり v${v}</div>
      <div id="hc-update-msg" style="color:#aaa;font-size:12px;line-height:1.4;">クリックで自動更新します</div>
    </div>
    <div id="hc-update-actions" style="display:flex;flex-direction:column;gap:6px;">
      <button onclick="HubUpdate.start()" style="padding:6px 12px;background:#f90;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">今すぐ更新</button>
      <button onclick="this.closest('#hc-update-toast').remove()" style="padding:4px 8px;background:transparent;color:#666;border:none;font-size:11px;cursor:pointer;">後で</button>
    </div>`
  document.body.appendChild(toast)
}

// electron-updaterが更新を検知したら（起動中の定期チェック含む）トースト表示
window.electronAPI.onUpdateAvailable?.((info) => {
  showUpdateToast(info && info.version)
})

// バージョン情報表示
async function showVersionInfo() {
  try {
    const info = await window.electronAPI.getAppVersion()
    const el = document.getElementById('current-version')
    if (el) el.textContent = 'v' + info.current

    const statusEl = document.getElementById('version-status')
    if (!info.latest) {
      if (statusEl) { statusEl.textContent = 'バージョン確認に失敗しました'; statusEl.style.color = '#aaa' }
      return
    }

    if (info.latest === info.current) {
      if (statusEl) { statusEl.textContent = '最新バージョンです'; statusEl.style.color = '#4CAF50' }
      return
    }

    // 新バージョンあり → 全UI更新
    if (statusEl) {
      statusEl.textContent = '最新バージョン v' + info.latest + ' が利用可能です'
      statusEl.style.color = '#f90'
    }

    // ① サイドバーのアップデートボタンを表示
    const updateBtn = document.getElementById('update-btn')
    if (updateBtn) updateBtn.style.display = ''

    // ② ヘルプモーダル内のダウンロードエリアを表示
    const updateArea = document.getElementById('version-update-area')
    if (updateArea) updateArea.style.display = ''

    // ③ トースト通知（起動3秒後）— electron-updater検知より先に出る場合の保険
    setTimeout(() => showUpdateToast(info.latest), 3000)

  } catch(e) {
    console.log('[HubChat] version check error:', e)
  }
}
document.addEventListener('DOMContentLoaded', showVersionInfo)
// 起動中も定期的に再チェック（30分ごと）。新版が出たらトーストが出る
setInterval(() => { showVersionInfo() }, 30 * 60 * 1000)


// ============================================
// 学習（スキルアップ）機能
// ============================================
const LEARNING_API = 'https://ydk-business.com/hubchat/api/data/learning.json';

// 記事タイトルから細かいカテゴリを自動判定（サーバーのcategoryに依存しない＝
// note投稿パイプラインが全部「AI活用」で上書きしても正しく分類される）
const LEARN_RULES = [
  { id:'claude',    icon:'🤖', name:'Claude Code',          test: t => /claude\s*code/i.test(t) },
  { id:'aiorg',     icon:'🏢', name:'AI組織論',             test: t => /AI組織論/.test(t) },
  { id:'asi',       icon:'🧑‍💼', name:'ASI秘書',            test: t => /ASI秘書/.test(t) },
  { id:'th-food',   icon:'🍴', name:'飲食店Threads',        test: t => /飲食店.*Threads|Threads.*飲食店/.test(t) },
  { id:'th-beauty', icon:'💇', name:'美容サロンThreads',     test: t => /美容サロン.*Threads|サロン.*Threads/.test(t) },
  { id:'th-care',   icon:'🏥', name:'治療院Threads',        test: t => /治療院.*Threads|整体|鍼灸|接骨/.test(t) },
  { id:'th-school', icon:'🎓', name:'教室Threads',          test: t => /教室.*Threads|スクール|ピアノ|英会話/.test(t) },
  { id:'th-pro',    icon:'💼', name:'士業・コンサルThreads', test: t => /(士業|コンサル|税理士|社労士|行政書士).*Threads|Threads.*(士業|コンサル)/.test(t) },
  { id:'threads',   icon:'🧵', name:'その他Threads',        test: t => /Threads/.test(t) },
  { id:'gmail',     icon:'📧', name:'Google・Gmail',         test: t => /Gmail|Google/.test(t) },
  { id:'canva',     icon:'🎨', name:'Canva・デザイン',       test: t => /Canva/.test(t) },
  { id:'hubchat',   icon:'🚀', name:'HubChat活用',          test: t => /HubChat/.test(t) },
]
const LEARN_OTHER = { id:'other', icon:'⚙️', name:'自動化・その他事例' }
function classifyArticle(title) {
  for (const r of LEARN_RULES) { if (r.test(title || '')) return r }
  return LEARN_OTHER
}
// カテゴリID → カテゴリ定義（YDK Officeの上書き用）
function learnCatById(id) {
  if (id === 'other') return LEARN_OTHER
  return LEARN_RULES.find(r => r.id === id) || null
}

document.getElementById('learn-btn')?.addEventListener('click', async () => {
  const modal = document.getElementById('learn-modal');
  const content = document.getElementById('learn-content');
  modal.classList.remove('hidden');
  content.innerHTML = '<p style="color:var(--text-sub);text-align:center;padding:40px 0;">読み込み中...</p>';

  try {
    const data = await window.electronAPI.getLearningData();
    if (data.error) throw new Error(data.error);

    // 既読URL集合をelectron-storeから取得
    let viewedUrls = await window.electronAPI.storeGet('learnViewedUrls', []);
    if (!Array.isArray(viewedUrls)) viewedUrls = [];
    const viewedSet = new Set(viewedUrls);

    // YDK Office のカテゴリ上書き/非掲載設定（{url: {cat, hidden}}）
    const overrides = data.__overrides || {};
    // 全記事をフラットにし、非掲載を除外、カテゴリは上書き優先→無ければ自動判定
    const allArticles = data.categories.flatMap(c => (c.articles||[]))
      .filter(a => !(overrides[a.url] && overrides[a.url].hidden))
      .map(a => {
        const ov = overrides[a.url];
        const cat = (ov && ov.cat && learnCatById(ov.cat)) || classifyArticle(a.title);
        return { ...a, __cat: cat };
      });

    // 出現したカテゴリを優先順で並べる
    const order = LEARN_RULES.map(r => r.id).concat(['other']);
    const catMap = new Map();
    for (const a of allArticles) {
      if (!catMap.has(a.__cat.id)) catMap.set(a.__cat.id, { meta: a.__cat, items: [] });
      catMap.get(a.__cat.id).items.push(a);
    }
    const groups = order.filter(id => catMap.has(id)).map(id => catMap.get(id));

    let activeCat = 'all';
    let searchQ = '';

    function visibleArticles() {
      let arr = activeCat === 'all' ? allArticles : (catMap.get(activeCat)?.items || []);
      if (searchQ) {
        const q = searchQ.toLowerCase();
        arr = arr.filter(a => (a.title||'').toLowerCase().includes(q) || (a.description||'').toLowerCase().includes(q));
      }
      return arr;
    }

    function renderLearn() {
      // 検索バー
      let html = `
        <div class="learn-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="learn-search-input" type="text" placeholder="記事を検索…" value="${searchQ.replace(/"/g,'&quot;')}" autocomplete="off">
          ${searchQ ? '<button id="learn-search-clear" title="クリア">✕</button>' : ''}
        </div>`;

      // タブ（検索中は隠す）
      if (!searchQ) {
        const allUnread = allArticles.filter(a => !viewedSet.has(a.url)).length;
        html += '<div class="learn-tabs">';
        html += `<button class="learn-tab${activeCat==='all'?' active':''}" data-cat="all">すべて <span class="learn-tab-badge">${allArticles.length}</span>${allUnread ? `<span class="learn-tab-unread">${allUnread}</span>` : ''}</button>`;
        for (const g of groups) {
          const unread = g.items.filter(a => !viewedSet.has(a.url)).length;
          html += `<button class="learn-tab${activeCat===g.meta.id?' active':''}" data-cat="${g.meta.id}">${g.meta.icon} ${g.meta.name} <span class="learn-tab-badge">${g.items.length}</span>${unread ? `<span class="learn-tab-unread">${unread}</span>` : ''}</button>`;
        }
        html += '</div>';
      }

      // 記事グリッド
      const list = visibleArticles();
      if (list.length === 0) {
        html += '<p style="color:var(--text-sub);text-align:center;padding:40px 0;">該当する記事がありません</p>';
      } else {
        html += '<div class="learn-grid">';
        for (const art of list) {
          const isUnread = !viewedSet.has(art.url);
          const thumb = art.thumbnail ? `<div class="learn-card-thumb"><img src="${art.thumbnail}" loading="lazy" alt=""></div>` : '';
          const likeHtml = (typeof art.likeCount === 'number' && art.likeCount > 0) ? `<span class="learn-card-likes" title="スキ">❤ ${art.likeCount}</span>` : '';
          html += `
            <div class="learn-card${isUnread ? ' unread' : ''}" data-url="${art.url}" data-title="${(art.title||'').replace(/"/g,'&quot;')}">
              ${isUnread ? '<span class="learn-card-unread-dot" title="未読"></span>' : ''}
              ${thumb}
              <div class="learn-card-body">
                <div class="learn-card-cat">${art.__cat.icon} ${art.__cat.name}</div>
                <h4 class="learn-card-title">${art.title}</h4>
                <p class="learn-card-desc">${art.description||''}</p>
                <div class="learn-card-meta"><span></span>${likeHtml}</div>
              </div>
            </div>`;
        }
        html += '</div>';
      }

      content.innerHTML = html;

      // 検索入力（フォーカス維持のためカーソル位置を復元）
      const si = content.querySelector('#learn-search-input');
      if (si) {
        si.addEventListener('input', () => {
          const pos = si.selectionStart;
          searchQ = si.value.trim();
          renderLearn();
          const ni = content.querySelector('#learn-search-input');
          if (ni) { ni.focus(); try { ni.setSelectionRange(pos, pos); } catch(e) {} }
        });
      }
      content.querySelector('#learn-search-clear')?.addEventListener('click', () => { searchQ = ''; renderLearn(); content.querySelector('#learn-search-input')?.focus(); });

      content.querySelectorAll('.learn-tab').forEach(btn => {
        btn.addEventListener('click', () => { activeCat = btn.dataset.cat; renderLearn(); });
      });

      content.querySelectorAll('.learn-card').forEach(card => {
        card.addEventListener('click', async () => {
          const url = card.dataset.url;
          if (!viewedSet.has(url)) {
            viewedSet.add(url);
            try { await window.electronAPI.storeSet('learnViewedUrls', Array.from(viewedSet)); } catch(e) {}
          }
          if (window.electronAPI?.openExternal) window.electronAPI.openExternal(url);
          card.classList.remove('unread');
          card.querySelector('.learn-card-unread-dot')?.remove();
        });
      });
    }

    renderLearn();

  } catch(e) {
    content.innerHTML = '<p style="color:#ff6b6b;text-align:center;padding:40px 0;">読み込みに失敗しました</p>';
  }
});

// 学習モーダル閉じる処理（DOMContentLoaded内で実行）
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (e) => {
    if (e.target.id === 'learn-close-btn' || e.target.id === 'learn-overlay') {
      document.getElementById('learn-modal').classList.add('hidden');
    }
    if (e.target.id === 'learn-article-close-btn' || e.target.id === 'learn-article-overlay') {
      document.getElementById('learn-article-modal').classList.add('hidden');
      const wv = document.getElementById('learn-article-webview');
      if (wv) wv.src = 'about:blank';
    }
  });
});
