/* ============================================================
   auth — Google 登入、角色、班級
   ------------------------------------------------------------
   角色四級：
     superadmin  系統管理員，只有 CONFIG.superAdmin 那組信箱
                 規則層保護：不能被改角色、不能被停用、不能被刪
     admin       管理員：管使用者與所有班級
     teacher     老師：開自己的班、管自己班的學生
     student     學生：進自己被加入的班

   前端這一層只負責「畫面上要不要顯示」。真正擋人的是
   database.rules.json，就算有人改前端也拿不到別班的資料。
   ============================================================ */
import { CONFIG } from '../../config.js';

const SUPER = (CONFIG.superAdmin || '').toLowerCase();

export const auth = {
  ready: false,
  available: false,
  user: null,          // { uid, email, name, photo }
  role: null,          // superadmin | admin | teacher | student | null
  disabled: false,
  classes: {},         // 我能進的班 { cid: classObj }
  error: null,
};

let fb = null;         // { app, auth, db, mod: {...} }
const listeners = new Set();
export function onAuth(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { listeners.forEach(fn => fn(auth)); }

/* ---------- 啟動 ---------- */
export async function initAuth() {
  const cfg = CONFIG.firebase;
  if (!cfg || !cfg.apiKey) { auth.ready = true; emit(); return auth; }

  try {
    const [appMod, authMod, dbMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js'),
    ]);
    const app = appMod.initializeApp(cfg);
    const a = authMod.getAuth(app);
    const db = dbMod.getDatabase(app);
    fb = { app, auth: a, db, authMod, dbMod };
    auth.available = true;

    // 從轉址流程回來時把結果收掉（手機上 popup 常被擋，會走 redirect）
    try { await authMod.getRedirectResult(a); } catch (e) { console.warn('redirect result', e); }

    await new Promise(resolve => {
      authMod.onAuthStateChanged(a, async u => {
        if (!u) {
          auth.user = null; auth.role = null; auth.disabled = false; auth.classes = {};
        } else {
          auth.user = {
            uid: u.uid,
            email: (u.email || '').toLowerCase(),
            name: u.displayName || (u.email || '').split('@')[0],
            photo: u.photoURL || '',
          };
          await bootstrapUser();
          await loadMyClasses();
        }
        auth.ready = true;
        emit();
        resolve();
      });
    });
  } catch (e) {
    console.warn('登入服務啟動失敗', e);
    auth.error = e.message || String(e);
    auth.ready = true;
    emit();
  }
  return auth;
}

/* ---------- 登入 / 登出 ---------- */
export async function signIn() {
  if (!fb) throw new Error('登入服務沒啟動');
  const { authMod, auth: a } = fb;
  const provider = new authMod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await authMod.signInWithPopup(a, provider);
  } catch (e) {
    // 手機或被擋 popup 時改用轉址
    if (/popup|blocked|cancelled|closed/i.test(e.code || e.message || '')) {
      await authMod.signInWithRedirect(a, provider);
      return;
    }
    throw e;
  }
}

export async function signOut() {
  if (!fb) return;
  await fb.authMod.signOut(fb.auth);
}

/* ---------- 使用者紀錄 ---------- */
async function bootstrapUser() {
  const { dbMod, db } = fb;
  const u = auth.user;
  const base = `users/${u.uid}`;

  const snap = await dbMod.get(dbMod.ref(db, base));
  const cur = snap.val() || {};

  // 個人資料每次登入更新
  await dbMod.update(dbMod.ref(db, `${base}/profile`), {
    email: u.email,
    name: u.name,
    photo: u.photo,
    createdAt: cur.profile?.createdAt || Date.now(),
    lastSeen: Date.now(),
  });

  // 角色：超管自己認領；其他人第一次進來預設 student
  let role = cur.role || null;
  if (u.email === SUPER) {
    if (role !== 'superadmin') {
      await dbMod.set(dbMod.ref(db, `${base}/role`), 'superadmin');
      role = 'superadmin';
    }
  } else if (!role) {
    await dbMod.set(dbMod.ref(db, `${base}/role`), 'student');
    role = 'student';
  }

  auth.role = role;
  auth.disabled = cur.disabled === true;

  // 角色之後被管理員改動時要即時反映
  dbMod.onValue(dbMod.ref(db, `${base}/role`), s => {
    const v = s.val();
    if (v && v !== auth.role) { auth.role = v; emit(); }
  });
  dbMod.onValue(dbMod.ref(db, `${base}/disabled`), s => {
    const v = s.val() === true;
    if (v !== auth.disabled) { auth.disabled = v; emit(); }
  });
}

/* ---------- 班級 ---------- */
export async function loadMyClasses() {
  if (!fb || !auth.user) return {};
  const { dbMod, db } = fb;
  const all = (await dbMod.get(dbMod.ref(db, 'classes'))).val() || {};
  const mine = {};
  for (const [cid, c] of Object.entries(all)) {
    if (isAdmin()) { mine[cid] = c; continue; }
    if (c.teacherUid === auth.user.uid) { mine[cid] = c; continue; }
    const m = await dbMod.get(dbMod.ref(db, `members/${cid}/${auth.user.uid}`));
    if (m.exists()) mine[cid] = c;
  }
  auth.classes = mine;
  return mine;
}

export async function listAllClasses() {
  if (!fb) return {};
  const { dbMod, db } = fb;
  return (await dbMod.get(dbMod.ref(db, 'classes'))).val() || {};
}

export async function createClass({ name, code, condition = 'agent', session = 0, open = true }) {
  requireStaff();
  const { dbMod, db } = fb;
  const cid = code.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!/^[a-z0-9_-]{2,20}$/.test(cid)) throw new Error('班級代碼只能用英數字、減號、底線，2 到 20 個字');
  const exists = await dbMod.get(dbMod.ref(db, `classes/${cid}`));
  if (exists.exists()) throw new Error('這個班級代碼已經有人用了');

  const cls = {
    name, code: cid, condition, session, open: !!open,
    teacherUid: auth.user.uid,
    teacherEmail: auth.user.email,
    createdAt: Date.now(),
  };
  await dbMod.set(dbMod.ref(db, `classes/${cid}`), cls);
  await dbMod.set(dbMod.ref(db, `members/${cid}/${auth.user.uid}`), {
    name: auth.user.name, email: auth.user.email, group: '', joinedAt: Date.now(),
  });
  auth.classes[cid] = cls;
  emit();
  return cls;
}

export async function updateClass(cid, patch) {
  requireStaff();
  const { dbMod, db } = fb;
  await dbMod.update(dbMod.ref(db, `classes/${cid}`), patch);
  if (auth.classes[cid]) Object.assign(auth.classes[cid], patch);
  emit();
}

export async function deleteClass(cid) {
  requireAdmin();
  const { dbMod, db } = fb;
  await dbMod.remove(dbMod.ref(db, `classes/${cid}`));
  await dbMod.remove(dbMod.ref(db, `members/${cid}`));
  await dbMod.remove(dbMod.ref(db, `data/${cid}`));
  delete auth.classes[cid];
  emit();
}

/** 學生掃 QR 或輸入代碼進班 */
export async function joinClass(code) {
  if (!auth.user) throw new Error('請先登入');
  const { dbMod, db } = fb;
  const cid = String(code || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const snap = await dbMod.get(dbMod.ref(db, `classes/${cid}`));
  if (!snap.exists()) throw new Error('找不到這個班級');
  const cls = snap.val();
  if (cls.open !== true && !isStaff()) throw new Error('這個班級目前沒有開放加入');

  await dbMod.set(dbMod.ref(db, `members/${cid}/${auth.user.uid}`), {
    name: auth.user.name, email: auth.user.email, group: '', joinedAt: Date.now(),
  });
  auth.classes[cid] = cls;
  emit();
  return cls;
}

export async function listMembers(cid) {
  if (!fb) return {};
  const { dbMod, db } = fb;
  return (await dbMod.get(dbMod.ref(db, `members/${cid}`))).val() || {};
}

export async function removeMember(cid, uid) {
  requireStaff();
  const { dbMod, db } = fb;
  await dbMod.remove(dbMod.ref(db, `members/${cid}/${uid}`));
}

/* ---------- 使用者管理（後台）---------- */
export async function listUsers() {
  requireStaff();
  const { dbMod, db } = fb;
  const raw = (await dbMod.get(dbMod.ref(db, 'users'))).val() || {};
  return Object.entries(raw).map(([uid, u]) => ({
    uid,
    email: u.profile?.email || '',
    name: u.profile?.name || '',
    photo: u.profile?.photo || '',
    role: u.role || 'student',
    disabled: u.disabled === true,
    lastSeen: u.profile?.lastSeen || 0,
    protected: (u.profile?.email || '').toLowerCase() === SUPER,
  })).sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
}

export async function setUserRole(uid, role) {
  requireAdmin();
  const { dbMod, db } = fb;
  const email = (await dbMod.get(dbMod.ref(db, `users/${uid}/profile/email`))).val() || '';
  if (email.toLowerCase() === SUPER) throw new Error('系統管理員的角色不能更動');
  if (role === 'superadmin') throw new Error('不能把別人設成系統管理員');
  await dbMod.set(dbMod.ref(db, `users/${uid}/role`), role);
}

export async function setUserDisabled(uid, disabled) {
  requireAdmin();
  const { dbMod, db } = fb;
  const email = (await dbMod.get(dbMod.ref(db, `users/${uid}/profile/email`))).val() || '';
  if (email.toLowerCase() === SUPER) throw new Error('系統管理員不能被停用');
  await dbMod.set(dbMod.ref(db, `users/${uid}/disabled`), !!disabled);
}

/* ---------- 角色判斷 ---------- */
export const isSuper   = () => auth.role === 'superadmin' || (auth.user?.email === SUPER);
export const isAdmin   = () => isSuper() || auth.role === 'admin';
export const isTeacher = () => auth.role === 'teacher';
export const isStaff   = () => isAdmin() || isTeacher();
export const signedIn  = () => !!auth.user;

function requireAdmin() { if (!isAdmin()) throw new Error('只有管理員可以做這件事'); }
function requireStaff() { if (!isStaff()) throw new Error('只有老師或管理員可以做這件事'); }

/** 給 store 用：拿到已初始化的 database 與模組 */
export function fbHandle() { return fb; }
