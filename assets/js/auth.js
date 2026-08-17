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
  const base = CONFIG.firebase;
  if (!base || !base.apiKey) { auth.ready = true; emit(); return auth; }

  /* authDomain 一律用專案預設的 firebaseapp.com。
     曾經試過在 Firebase Hosting 上改成 web.app 讓它同源（iOS 的儲存分區
     會擋跨網域的轉址），結果 Google 那組 OAuth client 只登記了
     firebaseapp.com 的 redirect URI，改了就整個登不進去（redirect_uri_mismatch）。
     要同源的話，得先到 Google Cloud Console 的憑證頁把
     https://hsinchu-water-course.web.app/__/auth/handler 加進去。
     在那之前維持預設；iOS 走 popup 本來就不受儲存分區影響。 */
  const cfg = base;

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

    /* 這裡以前只 await 一個永遠可能不 resolve 的 Promise。
       只要 onAuthStateChanged 沒觸發，或裡面任何一步丟例外，
       整個啟動流程就停住，學生看到的是一片空白。
       現在：任何錯誤都吞掉，而且設上限時間，時間到就先讓課程跑起來。 */
    let settled = false;
    await new Promise(resolve => {
      const done = () => { if (!settled) { settled = true; resolve(); } };
      const timer = setTimeout(() => {
        if (!settled) console.warn('登入狀態等太久，先讓課程跑起來');
        done();
      }, 6000);

      try {
        authMod.onAuthStateChanged(a, async u => {
          try {
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
          } catch (err) {
            // 讀不到自己的資料就當作沒登入，課還是要能上
            console.warn('讀取帳號資料失敗，改用未登入模式', err);
            auth.error = err.message || String(err);
          }
          auth.ready = true;
          emit();
          clearTimeout(timer);
          done();
        }, err => {
          console.warn('登入狀態監聽失敗', err);
          auth.ready = true; emit(); clearTimeout(timer); done();
        });
      } catch (err) {
        console.warn('登入服務無法啟動', err);
        auth.ready = true; emit(); clearTimeout(timer); done();
      }
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
const ERRORS = {
  'auth/unauthorized-domain': '這個網址沒有被授權登入。請用老師給的網址。',
  'auth/operation-not-allowed': 'Google 登入還沒啟用。請聯絡老師。',
  'auth/popup-blocked': '瀏覽器擋住了登入視窗，正在改用整頁跳轉。',
  'auth/popup-closed-by-user': '登入視窗被關掉了，再試一次。',
  'auth/cancelled-popup-request': '重複點了，再按一次就好。',
  'auth/network-request-failed': '連不上網路，檢查一下 Wi-Fi。',
  'auth/web-storage-unsupported': '這個瀏覽器擋住了儲存空間。請關掉無痕模式再試。',
};

export function explain(e) {
  const code = e?.code || '';
  return ERRORS[code] || (e?.message || String(e));
}

export async function signIn() {
  if (!fb) throw new Error('登入服務沒啟動');
  const { authMod, auth: a } = fb;
  const provider = new authMod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    // 一定要在使用者點擊的當下直接呼叫，中間不能有 await，不然 iOS 會擋
    await authMod.signInWithPopup(a, provider);
  } catch (e) {
    const code = e.code || '';
    if (/popup|blocked|cancelled|closed|web-storage/i.test(code)) {
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
  } else if (!role || role === 'student') {
    /* 白名單上的信箱直接成為老師。
       名單存在 config/teacherEmails，誰都讀不到，只有管理員能寫。
       這裡不先查再寫，而是直接試寫——規則會判斷；
       不在名單上就會被拒絕，那就是學生。 */
    if (!role) {
      await dbMod.set(dbMod.ref(db, `${base}/role`), 'student');
      role = 'student';
    }
    try {
      await dbMod.set(dbMod.ref(db, `${base}/role`), 'teacher');
      role = 'teacher';
    } catch {
      // 不在名單上，維持學生
    }
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

export async function createClass({ name, code, session = 0, open = true }) {
  requireStaff();
  const { dbMod, db } = fb;
  const cid = code.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!/^[a-z0-9_-]{2,20}$/.test(cid)) throw new Error('班級代碼只能用英數字、減號、底線，2 到 20 個字');
  const exists = await dbMod.get(dbMod.ref(db, `classes/${cid}`));
  if (exists.exists()) throw new Error('這個班級代碼已經有人用了');

  const cls = {
    name, code: cid, session, open: !!open,
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
