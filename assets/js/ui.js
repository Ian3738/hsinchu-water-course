/* DOM 小工具 */

/** h('div.card', {onclick}, [children]) */
export function h(spec, props = null, kids = null) {
  // 第二個參數只有「純物件」才當屬性用。
  // 字串、數字、DOM 節點、陣列一律視為內容——
  // 否則 Object.entries('教師') 會變成 setAttribute('0', '教')。
  if (props != null && !isPlainObject(props)) { kids = props; props = null; }
  const m = /^([a-zA-Z0-9-]+)?((?:[.#][\w-]+)*)$/.exec(spec) || [];
  const el = document.createElement(m[1] || 'div');
  (m[2] || '').split(/(?=[.#])/).filter(Boolean).forEach(tok => {
    if (tok[0] === '.') el.classList.add(tok.slice(1));
    else el.id = tok.slice(1);
  });
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'data') for (const [dk, dv] of Object.entries(v)) el.dataset[dk] = dv;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') el.value = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  if (kids != null) append(el, kids);
  return el;
}

/** 只認 {} 或 Object.create(null) 產生的物件，不認 Node、Array、字串 */
function isPlainObject(v) {
  if (typeof v !== 'object' || v === null) return false;
  if (Array.isArray(v)) return false;
  if (typeof Node !== 'undefined' && v instanceof Node) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

export function append(el, kids) {
  (Array.isArray(kids) ? kids : [kids]).forEach(k => {
    if (k == null || k === false) return;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  });
  return el;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

/* ---------- toast ---------- */
let toastEl, toastTimer;
export function toast(msg, ms = 2600) {
  if (!toastEl) {
    toastEl = h('.toast', { role: 'status', 'aria-live': 'polite' });
    document.body.append(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.dataset.show = 'true';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.dataset.show = 'false'; }, ms);
}

/* ---------- 小元件 ---------- */

export function eyebrow(text, mod = '') {
  return h('p.eyebrow' + (mod ? '.' + mod : ''), { text });
}

export function datum(n, l, water = false) {
  return h('.datum' + (water ? '.datum--water' : ''), [
    h('.datum__n', { text: n }),
    h('.datum__l', { text: l }),
  ]);
}

export function pill(text, tone = '') {
  return h('.pill', { data: tone ? { tone } : {} }, [h('span.pill__dot'), text]);
}

export function meter(pct, state = '') {
  return h('.meter', [
    h('.meter__fill', { style: { width: Math.max(0, Math.min(100, pct)) + '%' }, data: state ? { state } : {} }),
  ]);
}

export function field(label, control, hint) {
  return h('.field', [
    h('label.field__label', [label, hint ? h('span.field__hint', { text: hint }) : null]),
    control,
  ]);
}

/** 產生穩定的短 id */
export function uid(prefix = 'x') {
  return prefix + '-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

/** 中英混排的字數：中日韓字元一字算一個，其餘依空白斷詞 */
export function countWords(s) {
  const str = String(s || '').trim();
  if (!str) return 0;
  const cjk = (str.match(/[㐀-鿿豈-﫿぀-ヿ]/g) || []).length;
  const rest = str.replace(/[㐀-鿿豈-﫿぀-ヿ]/g, ' ')
                  .trim().split(/\s+/).filter(Boolean).length;
  return cjk + rest;
}

/** 節流 */
export function throttle(fn, ms = 120) {
  let last = 0, timer;
  return (...a) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...a); }
    else { clearTimeout(timer); timer = setTimeout(() => { last = Date.now(); fn(...a); }, ms - (now - last)); }
  };
}

export function debounce(fn, ms = 400) {
  let timer;
  return (...a) => { clearTimeout(timer); timer = setTimeout(() => fn(...a), ms); };
}

/** 下載檔案 */
export function downloadFile(name, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 時間格式 mm:ss */
export function mmss(sec) {
  const s = Math.max(0, Math.round(sec));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

/** 角色的中英顯示名稱 */
export function roleLabel(role, zh = true) {
  const M = {
    superadmin: ['系統管理員', 'Super admin'],
    admin:      ['管理員', 'Admin'],
    teacher:    ['老師', 'Teacher'],
    student:    ['學生', 'Student'],
  };
  const p = M[role] || ['未指定', 'Unassigned'];
  return zh ? p[0] : p[1];
}
