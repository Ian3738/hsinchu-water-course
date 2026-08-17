/* ============================================================
   store — 狀態、本機保存、即時同步
   沒有 Firebase 設定時全部走 localStorage，功能不減，只是不跨裝置。
   ============================================================ */
import { CONFIG } from '../../config.js';
import { uid } from './ui.js';
import { fbHandle, auth as authState } from './auth.js';

const LS = 'hwc.v1.';

/* ---------- 狀態 ---------- */
export const state = {
  me:   { id: '', name: '', group: '' },
  cls:  { code: 'demo', session: 0 },
  notes: {},        // 觀點畫布貼文
  votes: {},        // { pollId: { userId: choice } }
  work:  {},        // { taskId: any }  各任務作答
  agent: {},        // { slotId: { turns: [] } }
  peers: {},        // { userId: { name, ts } }
};

const subs = new Set();
export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
function emit(what) { subs.forEach(fn => fn(what, state)); }

/* ---------- 本機保存 ---------- */
function lsKey(part) { return LS + state.cls.code + '.' + part; }

function saveLocal(part) {
  try { localStorage.setItem(lsKey(part), JSON.stringify(state[part])); }
  catch (e) { console.warn('本機儲存失敗', e); }
}

function loadLocal(part) {
  try {
    const raw = localStorage.getItem(lsKey(part));
    if (raw) state[part] = JSON.parse(raw);
  } catch (e) { console.warn('本機讀取失敗', e); }
}

/* ---------- 身分 ---------- */
function loadMe() {
  try {
    const raw = localStorage.getItem(LS + 'me');
    if (raw) Object.assign(state.me, JSON.parse(raw));
  } catch {}
  // 有登入就用 Firebase 的 uid：安全規則要求貼文的 authorId 等於 auth.uid
  if (authState.user) {
    state.me.id = authState.user.uid;
    if (!state.me.name) state.me.name = authState.user.name || '';
  } else if (!state.me.id) {
    state.me.id = uid('u');
  }
  localStorage.setItem(LS + 'me', JSON.stringify(state.me));
}

export function setMe(patch) {
  Object.assign(state.me, patch);
  localStorage.setItem(LS + 'me', JSON.stringify(state.me));
  if (sync.ready) sync.set(`peers/${state.me.id}`, { name: state.me.name, group: state.me.group, ts: Date.now() });
  emit('me');
}

/* ---------- 班級設定 ---------- */
function loadCls() {
  const url = new URL(location.href);
  const p = new URLSearchParams(url.hash.includes('?') ? url.hash.split('?')[1] : url.search);
  try {
    const raw = localStorage.getItem(LS + 'cls');
    if (raw) Object.assign(state.cls, JSON.parse(raw));
  } catch {}
  // 網址參數優先：?class=7a&cond=blank
  if (p.get('class')) state.cls.code = p.get('class').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  persistCls();
}

function persistCls() { localStorage.setItem(LS + 'cls', JSON.stringify(state.cls)); }

export function setClass(patch, { broadcast = true } = {}) {
  Object.assign(state.cls, patch);
  persistCls();
  if (broadcast && sync.ready && sync.setClassDoc) sync.setClassDoc(patch);
  emit('cls');
}

/* ============================================================
   同步 adapter
   ============================================================ */
export const sync = {
  ready: false,
  mode: 'local',      // 'local' | 'live'
  error: null,
  db: null,
  refs: {},
  set() {}, push() {}, remove() {},
};

const SYNCED = ['notes', 'votes', 'agent', 'peers', 'work'];

export async function initSync() {
  loadMe();
  loadCls();
  SYNCED.forEach(loadLocal);
  emit('init');

  // 連線由 auth.js 建立；沒登入就維持本機模式，課照上
  const handle = fbHandle();
  if (!handle || !authState.user) {
    sync.mode = 'local';
    emit('sync');
    return;
  }

  try {
    const { db, dbMod } = handle;
    sync.db = db;
    const root = `data/${state.cls.code}`;

    sync.set = (path, val) => dbMod.set(dbMod.ref(db, `${root}/${path}`), val);
    sync.push = (path, val) => dbMod.push(dbMod.ref(db, `${root}/${path}`), val);
    sync.remove = (path) => dbMod.remove(dbMod.ref(db, `${root}/${path}`));
    sync.setClassDoc = (patch) => dbMod.update(dbMod.ref(db, `classes/${state.cls.code}`), patch);

    // 班級設定由老師在 classes/ 改，全班跟著變
    dbMod.onValue(dbMod.ref(db, `classes/${state.cls.code}`), snap => {
      const v = snap.val();
      if (v) {
        state.cls.session = typeof v.session === 'number' ? v.session : state.cls.session;
        state.cls.name = v.name || '';
        persistCls(); emit('cls');
      }
    });

    // 各集合
    SYNCED.forEach(part => {
      dbMod.onValue(dbMod.ref(db, `${root}/${part}`), snap => {
        state[part] = snap.val() || {};
        saveLocal(part);
        emit(part);
      });
    });

    // 在線狀態
    const meRef = dbMod.ref(db, `${root}/peers/${state.me.id}`);
    dbMod.onDisconnect(meRef).remove();
    dbMod.set(meRef, { name: state.me.name || '', group: state.me.group || '', ts: Date.now() });

    sync.ready = true;
    sync.mode = 'live';
  } catch (e) {
    console.warn('即時同步啟動失敗，改用本機儲存', e);
    sync.error = e.message || String(e);
    sync.mode = 'local';
  }
  emit('sync');
}

/* ============================================================
   寫入 API — 同時寫本機與雲端
   ============================================================ */

function put(part, id, value) {
  if (value === null) delete state[part][id];
  else state[part][id] = value;
  saveLocal(part);
  if (sync.ready) sync.set(`${part}/${id}`, value);
  emit(part);
}

/* ---- 觀點畫布 ---- */
export function addNote(n) {
  const id = n.id || uid('n');
  const note = {
    id,
    who:   (n.who || '').trim(),
    cares: (n.cares || '').trim(),
    body:  (n.body || '').trim(),
    side:  n.side || 'for',
    slot:  n.slot || null,
    session: n.session ?? state.cls.session,
    author: state.me.name || '',
    authorId: state.me.id,
    group: state.me.group || '',
    namesAbsent: !!n.namesAbsent,
    ts: n.ts || Date.now(),
  };
  put('notes', id, note);
  return note;
}

export function updateNote(id, patch) {
  const cur = state.notes[id];
  if (!cur) return;
  put('notes', id, { ...cur, ...patch, ts: cur.ts });
}

export function removeNote(id) { put('notes', id, null); }

export function notesList() {
  return Object.values(state.notes).sort((a, b) => a.ts - b.ts);
}

/* ---- 投票 ---- */
export function castVote(pollId, choice) {
  const cur = state.votes[pollId] || {};
  cur[state.me.id] = choice;
  put('votes', pollId, cur);
}

export function voteTally(pollId) {
  const v = state.votes[pollId] || {};
  const out = {};
  Object.values(v).forEach(c => { out[c] = (out[c] || 0) + 1; });
  return { tally: out, total: Object.keys(v).length, mine: v[state.me.id] || null };
}

/* ---- 任務作答 ---- */
export function saveWork(taskId, value) {
  const cur = state.work[taskId] || {};
  const next = { ...cur, ...value, by: state.me.id, name: state.me.name || '', group: state.me.group || '', ts: Date.now() };
  // 每個學生一份：以 taskId/userId 存放，老師才看得到全班
  const key = `${taskId}__${state.me.id}`;
  put('work', key, next);
  return next;
}

export function myWork(taskId) {
  return state.work[`${taskId}__${state.me.id}`] || null;
}

export function allWork(taskId) {
  return Object.entries(state.work)
    .filter(([k]) => k.startsWith(taskId + '__'))
    .map(([, v]) => v)
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));
}

/* ---- agent 對話 ---- */
export function agentTurns(slotId) {
  return (state.agent[slotId] && state.agent[slotId].turns) || [];
}

export function pushAgentTurn(slotId, turn) {
  const cur = state.agent[slotId] || { turns: [] };
  cur.turns = [...(cur.turns || []), { ...turn, ts: Date.now() }].slice(-40);
  put('agent', slotId, cur);
  return cur.turns;
}

export function resetAgent(slotId) { put('agent', slotId, null); }

/* ---- 匯出 ---- */
export function snapshot() {
  return {
    exportedAt: new Date().toISOString(),
    class: { ...state.cls },
    notes: notesList(),
    votes: state.votes,
    work: state.work,
    agent: state.agent,
    peers: state.peers,
  };
}

export function importSnapshot(data, { merge = true } = {}) {
  if (!data || typeof data !== 'object') throw new Error('格式不對');
  SYNCED.forEach(part => {
    if (!data[part]) return;
    const incoming = Array.isArray(data[part])
      ? Object.fromEntries(data[part].map(o => [o.id || uid('i'), o]))
      : data[part];
    state[part] = merge ? { ...state[part], ...incoming } : incoming;
    saveLocal(part);
    if (sync.ready) Object.entries(incoming).forEach(([k, v]) => sync.set(`${part}/${k}`, v));
  });
  emit('import');
}

export function wipeLocal() {
  SYNCED.forEach(part => { state[part] = {}; localStorage.removeItem(lsKey(part)); });
  emit('wipe');
}

/* ============================================================
   留言 — 掛在某個提問底下的想法
   存在 work 裡，key 是 talk-<問題>__<使用者>-<時間>，
   所以同一個人可以留多則，而且安全規則不用另外開路徑。
   ============================================================ */
export function addTalk(qid, text) {
  const body = String(text || '').trim();
  if (!body) return null;
  const key = `talk-${qid}__${state.me.id}-${Date.now().toString(36)}`;
  const row = {
    qid, text: body.slice(0, 1000),
    by: state.me.id,
    name: state.me.name || '',
    group: state.me.group || '',
    ts: Date.now(),
  };
  put('work', key, row);
  return row;
}

export function talksFor(qid) {
  return Object.entries(state.work)
    .filter(([k]) => k.startsWith(`talk-${qid}__`))
    .map(([, v]) => v)
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));
}

export function removeTalk(qid, ts) {
  const key = Object.keys(state.work).find(k =>
    k.startsWith(`talk-${qid}__`) && state.work[k].ts === ts && state.work[k].by === state.me.id);
  if (key) put('work', key, null);
}

/* ---------- 對別人的想法給回饋 ---------- */
export function addReply(qid, targetTs, text) {
  const body = String(text || '').trim();
  if (!body) return null;
  const key = `rep-${qid}-${targetTs}__${state.me.id}-${Date.now().toString(36)}`;
  const row = {
    qid, target: targetTs, text: body.slice(0, 500),
    by: state.me.id, name: state.me.name || '', group: state.me.group || '',
    ts: Date.now(),
  };
  put('work', key, row);
  return row;
}

export function repliesFor(qid, targetTs) {
  return Object.entries(state.work)
    .filter(([k]) => k.startsWith(`rep-${qid}-${targetTs}__`))
    .map(([, v]) => v)
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));
}

/** 全班所有留言，老師端用 */
export function allTalks() {
  return Object.entries(state.work)
    .filter(([k]) => k.startsWith('talk-'))
    .map(([, v]) => v)
    .filter(v => v && v.text)
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));
}
