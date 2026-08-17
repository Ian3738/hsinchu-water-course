/* ============================================================
   main — 路由與外殼
   ============================================================ */
import { h, clear, qs, toast, roleLabel } from './ui.js';
import { getLang, setLang, onLang, t, L } from './i18n.js';
import { initSync, state, subscribe, sync, setClass } from './store.js';
import { initAuth, onAuth, auth, signIn, signOut, isStaff, isAdmin, signedIn } from './auth.js';
import { SESSIONS, BY_ID, META } from '../data/course.js';
import { CONFIG } from '../../config.js';
import { bgmButton, restoreBgm } from './bgm.js';

const main = qs('#main');
const topnav = qs('#topnav');

/* ---------- 路由表 ---------- */
const ROUTES = [
  { re: /^\/?$/,               view: () => import('./views/home.js') },
  { re: /^\/s\/([\w-]+)$/,     view: () => import('./views/session.js') },
  { re: /^\/board$/,           view: () => import('./views/board.js') },
  { re: /^\/lab\/([\w-]+)$/,   view: () => import('./views/lab.js') },
  { re: /^\/teacher$/,         view: () => import('./views/teacher.js') },
  { re: /^\/admin$/,           view: () => import('./views/admin.js') },
  { re: /^\/join$/,            view: () => import('./views/join.js') },
  { re: /^\/reflect$/,         view: () => import('./views/reflect.js') },
  { re: /^\/about$/,           view: () => import('./views/about.js') },
];

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, query] = raw.split('?');
  return { path, params: new URLSearchParams(query || '') };
}

/* ---------- 背景圖：一頁一張，讀不到就靜靜略過 ---------- */
const BG_FOR_SESSION = {
  s0: 's0', s1: 's1', s2: 's2', s3: 's3', s4: 's4', s5: 's5',
  s6: 's6', s7: 's7', s8: 's7', s9: 's9', s10: 's9',
};

function bgName(path) {
  if (/^\/?$/.test(path)) return 'home';
  if (path === '/board') return 'board';
  if (path === '/about' || path === '/teacher') return 'home';
  const s = /^\/s\/([\w-]+)$/.exec(path);
  if (s) return BG_FOR_SESSION[s[1]] || 'home';
  if (/^\/lab\//.test(path)) return BG_FOR_SESSION['s' + state.cls.session] || 'home';
  return 'home';
}

let bgCurrent = null;
function setBackground(path) {
  const name = bgName(path);
  if (name === bgCurrent) return;
  const img = qs('#pagebgImg');
  if (!img) return;
  bgCurrent = name;

  const srcset = `assets/img/bg/${name}@sm.webp 960w, assets/img/bg/${name}.webp 1920w`;
  const src = `assets/img/bg/${name}.webp`;

  // 先在背景載好再換，避免中途出現半張圖
  const next = new Image();
  next.sizes = '100vw';
  next.srcset = srcset;
  next.onload = () => {
    if (bgCurrent !== name) return;          // 期間又換頁了就放棄
    img.sizes = '100vw';
    img.srcset = srcset;
    img.src = src;
    img.dataset.ready = 'true';
    document.body.classList.add('has-bg');
  };
  next.onerror = () => {
    // 圖還沒放進來也沒關係，底色本來就撐得住
    img.removeAttribute('srcset');
    img.removeAttribute('src');
    img.dataset.ready = 'false';
    document.body.classList.remove('has-bg');
  };
  next.src = src;
}

/* 沒登入不能上課。
   例外：關於頁與入班頁一定要開，不然沒有地方可以登入。
   另一個例外：Firebase 連不上時不擋——網路出問題不該把整班鎖在外面。 */
const OPEN_PATHS = /^\/(about|join)?$/;

function needsSignIn(path) {
  if (!auth.available) return false;      // 沒有帳號系統就不擋
  if (!auth.ready) return false;          // 還在確認登入狀態，先放行
  if (signedIn()) return false;
  return !OPEN_PATHS.test(path);
}

let currentCleanup = null;

async function render() {
  const { path, params } = parseHash();

  if (needsSignIn(path)) {
    location.hash = '#/join';
    return;
  }

  setBackground(path);
  for (const r of ROUTES) {
    const m = r.re.exec(path);
    if (!m) continue;
    try {
      if (typeof currentCleanup === 'function') { currentCleanup(); currentCleanup = null; }
      const mod = await r.view();
      clear(main);
      currentCleanup = await mod.default(main, { arg: m[1], params }) || null;
      main.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
      paintChrome();
      return;
    } catch (e) {
      console.error('頁面載入失敗', e);
      clear(main);
      main.append(h('.wrap.section.stack', [
        h('h1.ask', { text: getLang() === 'zh' ? '這一頁沒載起來' : 'This page failed to load' }),
        h('p.muted', { text: String(e && e.message || e) }),
        h('a.btn', { href: '#/' }, t('back')),
      ]));
      return;
    }
  }
  location.hash = '#/';
}

/* ---------- 頁首 ---------- */
function paintChrome() {
  clear(topnav);

  // 觀點畫布捷徑
  topnav.append(h('a.btn.btn--sm.btn--ghost', { href: '#/board' }, t('boardTitle')));

  // 語言切換
  const seg = h('.seg', { role: 'group', 'aria-label': 'Language' }, [
    h('button.seg__btn', {
      type: 'button', 'aria-pressed': String(getLang() === 'zh'),
      onclick: () => setLang('zh'),
    }, '中文'),
    h('button.seg__btn', {
      type: 'button', 'aria-pressed': String(getLang() === 'en'),
      onclick: () => setLang('en'),
    }, 'EN'),
  ]);
  topnav.append(seg);
  topnav.append(bgmButton());

  // 同步狀態：只在真的連上時顯示。沒連上是常態，不需要一直提醒學生。
  if (sync.mode === 'live') {
    topnav.append(h('.pill', { data: { tone: 'live' }, title: t('connected') }, [
      h('span.pill__dot'), t('liveSync'),
    ]));
  }

  // 登入
  const zh = getLang() === 'zh';
  if (!auth.available) {
    // 沒設定 Firebase 就不顯示登入，整站走本機模式
  } else if (!signedIn()) {
    topnav.append(h('button.btn.btn--sm.btn--primary', {
      type: 'button',
      onclick: async () => {
        try { await signIn(); }
        catch (e) { toast((zh ? '登入失敗：' : 'Sign-in failed: ') + (e.message || e)); }
      },
    }, [googleMark(), zh ? '用 Google 登入' : 'Sign in with Google']));
  } else {
    if (isStaff()) {
      topnav.append(h('a.btn.btn--sm', { href: '#/teacher' }, zh ? '教師' : 'Teacher'));
    }
    if (isAdmin()) {
      topnav.append(h('a.btn.btn--sm', { href: '#/admin' }, zh ? '後台' : 'Admin'));
    }
    topnav.append(h('.row.row--tight', { style: { gap: '6px' } }, [
      auth.user.photo
        ? h('img', {
            src: auth.user.photo, alt: '', width: 26, height: 26,
            referrerpolicy: 'no-referrer',
            style: { borderRadius: '50%', border: '1px solid var(--rule-strong)' },
          })
        : null,
      h('button.btn.btn--sm.btn--ghost', {
        type: 'button',
        title: `${auth.user.email}（${roleLabel(auth.role, zh)}）`,
        onclick: async () => { await signOut(); location.hash = '#/'; },
      }, zh ? '登出' : 'Sign out'),
    ].filter(Boolean)));
  }

  if (auth.disabled) {
    topnav.append(h('.pill', { data: { tone: 'clay' } }, [
      h('span.pill__dot'), zh ? '帳號已停用' : 'Account disabled',
    ]));
  }

  // 進度帶：目前上到第幾節
  const pct = (state.cls.session / 10) * 100;
  qs('#streamFill').style.width = Math.max(3, pct) + '%';

  // 教師控制台只給老師與管理員看到，學生端不該出現入口
  const tLink = qs('#footerTeacher');
  if (tLink) tLink.hidden = !isStaff();

  qs('#brandName').textContent = getLang() === 'zh' ? '探究頭前溪流域' : 'The Touqian Basin';
  document.title = getLang() === 'zh'
    ? '頭前溪借水課｜你家水龍頭的水，是跟誰借的？'
    : 'Borrowed Water | Where is the water in your tap borrowed from?';
}

/* Google 的四色標記，內嵌 SVG，不外連 */
function googleMark() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 48 48');
  svg.setAttribute('width', '15'); svg.setAttribute('height', '15');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.0 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.0 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C37.0 40.2 44 35 44 24c0-1.3-.1-2.4-.4-3.5z"/>`;
  return svg;
}

/* ---------- 快捷鍵 ---------- */
function keys(e) {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  // P：投影模式
  if (e.key === 'p' || e.key === 'P') {
    const on = document.documentElement.dataset.projection === 'on';
    document.documentElement.dataset.projection = on ? 'off' : 'on';
    toast(on ? '投影模式關閉' : '投影模式開啟　字級放大');
  }
  // B：觀點畫布
  if (e.key === 'b' || e.key === 'B') location.hash = '#/board';
  // 左右鍵在節次頁是翻投影片，由 session.js 處理（它會 preventDefault）；
  // 其他頁面才用來換節次
  if (e.defaultPrevented) return;
  const { path } = parseHash();
  const m = /^\/s\/([\w-]+)$/.exec(path);
  if (m) {
    const i = SESSIONS.findIndex(s => s.id === m[1]);
    if (e.key === 'ArrowRight' && i < SESSIONS.length - 1) location.hash = `#/s/${SESSIONS[i + 1].id}`;
    if (e.key === 'ArrowLeft' && i > 0) location.hash = `#/s/${SESSIONS[i - 1].id}`;
  }
}

/* ---------- 版本檢查 ----------
   ES module 的快取很黏，改版之後瀏覽器常常混用新舊檔，
   症狀千奇百怪（按鈕沒反應、狀態對不上）而且很難查。
   index.html 與 config.js 各帶一個版本號，對不上就直接講。 */
function checkBuild() {
  const meta = document.querySelector('meta[name="build"]')?.content;
  if (!meta || !CONFIG.build || meta === CONFIG.build) return;
  const zh = getLang() === 'zh';
  const bar = h('.stalebar', [
    h('span', { text: zh
      ? '你的瀏覽器載到了舊版的程式，畫面可能怪怪的。'
      : 'Your browser loaded a stale build; things may behave oddly.' }),
    h('button.btn.btn--sm.btn--primary', {
      type: 'button',
      onclick: () => {
        const u = new URL(location.href);
        u.searchParams.set('v', CONFIG.build);
        location.replace(u.toString());
      },
    }, zh ? '載入新版' : 'Reload'),
  ]);
  document.body.prepend(bar);
  console.warn('build mismatch: html=' + meta + ' js=' + CONFIG.build);
}

/* ---------- Service worker ----------
   程式走網路優先，改版立刻生效；網路不通時回頭用快取。
   網址加 ?nosw=1 可以整個關掉。 */
async function initSW() {
  if (!('serviceWorker' in navigator)) return;
  const kill = new URLSearchParams(location.search).has('nosw');
  if (kill) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
    if (window.caches) (await caches.keys()).forEach(k => caches.delete(k));
    console.warn('service worker 已關閉並清除快取');
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
    reg.update();
    // 新版接手之後重新整理一次，學生就不會停在舊畫面
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      location.reload();
    });
  } catch (e) {
    console.warn('service worker 註冊失敗', e);
  }
}

/* ---------- 啟動 ---------- */
async function boot() {
  checkBuild();
  initSW();
  restoreBgm();
  // 登入與同步都不是上課的必要條件。任一環節壞掉，課程本身還是要能開。
  try { await initAuth(); } catch (e) { console.warn('登入初始化失敗', e); }
  try { await initSync(); } catch (e) { console.warn('同步初始化失敗', e); }
  onAuth(() => { paintChrome(); render(); });
  subscribe(what => {
    if (what === 'cls' || what === 'sync') paintChrome();
  });
  onLang(() => { paintChrome(); render(); });
  window.addEventListener('hashchange', render);
  window.addEventListener('keydown', keys);
  paintChrome();
  await render();
}

boot();

export { render };
