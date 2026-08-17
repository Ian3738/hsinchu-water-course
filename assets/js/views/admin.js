/* 後台：使用者角色、班級開課、入班 QR */
import { h, clear, eyebrow, field, toast, downloadFile, roleLabel } from '../ui.js';
import { getLang } from '../i18n.js';
import { qrMatrix, qrSvg, qrPng } from '../qr.js';
import {
  auth, isAdmin, isStaff, isSuper, signedIn, signIn,
  listUsers, setUserRole, setUserDisabled,
  listAllClasses, createClass, updateClass, deleteClass,
  listMembers, removeMember,
} from '../auth.js';

const ROLES = ['student', 'teacher', 'admin'];

export default function admin(root) {
  const zh = getLang() === 'zh';

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow('ADMIN'),
    h('h1.ask.ask--wide', { text: zh ? '後台' : 'Admin console' }),
  ]));

  if (!signedIn()) {
    root.append(h('section.wrap--narrow', [h('.paper.stack', [
      h('h2.task__title', { text: zh ? '請先登入' : 'Please sign in' }),
      h('button.btn.btn--primary', { type: 'button', onclick: () => signIn() }, zh ? '用 Google 登入' : 'Sign in with Google'),
    ])]));
    return;
  }
  if (!isStaff()) {
    root.append(h('section.wrap--narrow', [h('.card.card--clay', [
      h('p.card__title', { text: zh ? '你沒有後台權限' : 'No access' }),
      h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
        ? `你目前的身分是「${roleLabel(auth.role, true)}」。要開班請找管理員把你設成老師。`
        : `You are signed in as ${roleLabel(auth.role, false)}. Ask an admin to make you a teacher.` }),
      h('a.btn', { href: '#/' }, zh ? '回課程' : 'Back' ),
    ])]));
    return;
  }

  /* ============ 班級 ============ */
  const classBox = h('section.wrap--wide.section--tight.stack');
  root.append(classBox);

  async function paintClasses() {
    clear(classBox);
    const all = await listAllClasses();
    const mine = Object.entries(all).filter(([, c]) => isAdmin() || c.teacherUid === auth.user.uid);

    classBox.append(eyebrow(zh ? '班級' : 'CLASSES'));

    // 開新班
    const nameIn = h('input.input', { placeholder: zh ? '例：竹光國中 703' : 'e.g. Class 703' });
    const codeIn = h('input.input', { placeholder: zh ? '例：703a（英數字）' : 'e.g. 703a' });
    classBox.append(h('.card.on-ink.stack', [
      h('p.card__title', { text: zh ? '開一個新班' : 'Open a new class' }),
      h('.cols-2', [
        field(zh ? '班級名稱' : 'Class name', nameIn),
        field(zh ? '班級代碼' : 'Class code', codeIn, zh ? '學生用這個代碼進班' : 'students join with this'),
      ]),
      h('.row', [h('button.btn.btn--primary', {
        type: 'button',
        onclick: async () => {
          try {
            await createClass({ name: nameIn.value.trim() || codeIn.value.trim(), code: codeIn.value.trim() });
            toast(zh ? '開好了' : 'Created');
            paintClasses();
          } catch (e) { toast(e.message || String(e)); }
        },
      }, zh ? '開班' : 'Create')]),
    ]));

    if (!mine.length) {
      classBox.append(h('p.muted', { text: zh ? '還沒有班級。' : 'No classes yet.' }));
      return;
    }

    mine.forEach(([cid, c]) => classBox.append(classCard(cid, c, zh, paintClasses)));
  }

  /* ============ 使用者 ============ */
  const userBox = h('section.wrap--wide.section--tight.stack');
  root.append(userBox);

  async function paintUsers() {
    clear(userBox);
    let users = [];
    try { users = await listUsers(); }
    catch (e) { userBox.append(h('p.muted', { text: e.message })); return; }

    userBox.append(
      eyebrow(zh ? '使用者' : 'USERS'),
      h('p.note-line', { text: zh
        ? '系統管理員那一列不能改也不能停用——這條規則寫在資料庫裡，不是只有畫面上藏起來。'
        : 'The super admin row cannot be changed or disabled. That is enforced by the database rules, not just hidden here.' }),
    );

    const rows = users.map(u => {
      const sel = h('select.select', { style: { minWidth: '110px' } },
        ROLES.map(r => h('option', { value: r, selected: u.role === r }, roleLabel(r, zh))));
      sel.disabled = u.protected || !isAdmin();
      sel.addEventListener('change', async () => {
        try { await setUserRole(u.uid, sel.value); toast(zh ? '改好了' : 'Updated'); }
        catch (e) { toast(e.message); paintUsers(); }
      });

      const toggle = h('button.btn.btn--sm' + (u.disabled ? '.btn--primary' : ''), {
        type: 'button',
        onclick: async () => {
          try { await setUserDisabled(u.uid, !u.disabled); paintUsers(); }
          catch (e) { toast(e.message); }
        },
      }, u.disabled ? (zh ? '已停用' : 'Disabled') : (zh ? '停用' : 'Disable'));
      if (u.protected || !isAdmin()) toggle.setAttribute('aria-disabled', 'true');

      return h('tr', [
        h('td', [
          h('.row.row--tight', [
            u.photo ? h('img', { src: u.photo, alt: '', width: 24, height: 24, referrerpolicy: 'no-referrer',
                                 style: { borderRadius: '50%' } }) : null,
            h('div', [
              h('div', { style: { fontWeight: '700' }, text: u.name || '—' }),
              h('div', { style: { fontSize: '11px', color: 'var(--on-paper-2)' }, text: u.email }),
            ]),
          ].filter(Boolean)),
        ]),
        h('td', u.protected
          ? [h('span.tag-absent', { text: zh ? '系統管理員・受保護' : 'SUPER ADMIN · PROTECTED' })]
          : [sel]),
        h('td', [u.protected ? h('span.muted', { text: '—' }) : toggle]),
      ]);
    });

    userBox.append(h('.tbl-wrap', [h('table.tbl', [
      h('thead', [h('tr', [
        h('th', { text: zh ? '帳號' : 'Account' }),
        h('th', { text: zh ? '角色' : 'Role' }),
        h('th', { text: zh ? '狀態' : 'Status' }),
      ])]),
      h('tbody', rows),
    ])]));
  }

  paintClasses();
  if (isAdmin()) paintUsers();
  else userBox.append(h('p.note-line', { text: zh ? '只有管理員看得到使用者清單。' : 'Only admins see the user list.' }));

  return () => {};
}

/* ============================================================ */

function classCard(cid, c, zh, refresh) {
  const base = location.href.split('#')[0];
  const joinUrl = `${base}#/join?c=${cid}`;

  const sessSel = h('select.select', { style: { maxWidth: '110px' } },
    Array.from({ length: 11 }, (_, n) => h('option', { value: String(n), selected: n === (c.session ?? 0) },
      String(n).padStart(2, '0'))));
  sessSel.addEventListener('change', async () => {
    try { await updateClass(cid, { session: Number(sessSel.value) }); toast(zh ? '進度更新了' : 'Updated'); }
    catch (e) { toast(e.message); }
  });

  const openBtn = h('button.btn.btn--sm' + (c.open ? '' : '.btn--primary'), {
    type: 'button',
    onclick: async () => {
      try { await updateClass(cid, { open: !c.open }); c.open = !c.open; refresh(); }
      catch (e) { toast(e.message); }
    },
  }, c.open ? (zh ? '關閉加入' : 'Close joining') : (zh ? '開放加入' : 'Open joining'));

  // QR
  const qrWrap = h('div', { style: { background: '#fff', padding: '10px', borderRadius: 'var(--r-md)', width: 'fit-content' } });
  let matrix = null;
  try {
    matrix = qrMatrix(joinUrl);
    qrWrap.append(qrSvg(matrix, { size: 168, title: `${cid} 入班 QR` }));
  } catch (e) {
    qrWrap.append(h('p', { style: { color: '#900', fontSize: '12px' }, text: 'QR 產生失敗：' + e.message }));
  }

  const members = h('.stack-sm');
  listMembers(cid).then(m => {
    const list = Object.entries(m || {});
    clear(members);
    members.append(h('p.mono', {
      style: { fontSize: 'var(--t-micro)', letterSpacing: '.14em', color: 'var(--fg-3)', margin: 0 },
      text: `${list.length} ${zh ? '人已加入' : 'MEMBERS'}`,
    }));
    if (list.length) {
      members.append(h('.row', { style: { gap: '6px' } }, list.slice(0, 40).map(([uid, mm]) =>
        h('span.pill', { title: mm.email || '' }, [mm.name || uid.slice(0, 6)]))));
    }
  }).catch(() => {});

  return h('.card.stack', [
    h('.row.row--between', [
      h('div', [
        h('p.card__title', { text: c.name || cid }),
        h('p.mono', { style: { margin: 0, fontSize: 'var(--t-xs)', color: 'var(--fg-3)' },
                      text: `${cid}　·　${c.teacherEmail || ''}` }),
      ]),
      h('.row.row--tight', [
        h('span.pill', { data: { tone: c.open ? 'live' : 'local' } }, [
          h('span.pill__dot'), c.open ? (zh ? '開放中' : 'open') : (zh ? '已關閉' : 'closed'),
        ]),
      ]),
    ]),

    h('.cols-2', [
      h('.stack-sm', [
        h('p.mono', { style: { fontSize: 'var(--t-micro)', letterSpacing: '.14em', color: 'var(--fg-3)', margin: 0 },
                      text: zh ? '學生掃這個進班' : 'STUDENTS SCAN THIS' }),
        qrWrap,
        h('p.mono', { style: { fontSize: '11px', wordBreak: 'break-all', color: 'var(--fg-2)', margin: 0 }, text: joinUrl }),
        h('.row.row--tight', [
          h('button.btn.btn--sm', {
            type: 'button',
            onclick: async () => {
              try { await navigator.clipboard.writeText(joinUrl); toast(zh ? '連結複製好了' : 'Link copied'); }
              catch { toast(zh ? '複製不了，請手動選取' : 'Copy failed'); }
            },
          }, zh ? '複製連結' : 'Copy link'),
          matrix ? h('button.btn.btn--sm', {
            type: 'button',
            onclick: () => {
              const a = document.createElement('a');
              a.href = qrPng(matrix, { scale: 14 });
              a.download = `join-${cid}.png`;
              document.body.append(a); a.click(); a.remove();
            },
          }, zh ? '下載列印用 PNG' : 'Download PNG') : null,
        ].filter(Boolean)),
      ]),

      h('.stack-sm', [
        h('.row.row--tight', [
          h('span', { class: 'field__label', style: { color: 'var(--fg-2)' }, text: zh ? '目前節次' : 'Session' }),
          sessSel,
        ]),
        h('.row.row--tight', [
          openBtn,
          isSuper() ? h('button.btn.btn--sm.btn--ghost', {
            type: 'button',
            onclick: async () => {
              if (!confirm(zh ? `刪掉「${c.name || cid}」？這會一併刪除該班所有課堂資料，無法復原。` : `Delete ${cid} and all its data?`)) return;
              try { await deleteClass(cid); toast(zh ? '刪掉了' : 'Deleted'); refresh(); }
              catch (e) { toast(e.message); }
            },
          }, zh ? '刪除班級' : 'Delete') : null,
        ].filter(Boolean)),
        members,
      ]),
    ]),
  ]);
}
