/* ============================================================
   關卡的鎖
   ------------------------------------------------------------
   解開才能往下一關。六種型別：
     code  填答案　order 排順序　match 配對
     sim   去模擬器達成條件　note 在畫布貼一則　work 完成某個任務

   通關狀態存在 work 的 'unlock' 一筆裡，跟著帳號走。
   ============================================================ */
import { h, clear, eyebrow, toast, field } from './ui.js';
import { getLang } from './i18n.js';
import { PUZZLES } from '../data/puzzles.js';
import { myWork, saveWork, notesList, state } from './store.js';

/* ---------- 通關狀態 ---------- */
export function unlocked(sid) {
  const u = myWork('unlock') || {};
  return u[sid] === true;
}

export function unlock(sid) {
  const u = { ...(myWork('unlock') || {}) };
  if (u[sid]) return false;
  u[sid] = true;
  u[`${sid}_at`] = Date.now();
  saveWork('unlock', u);
  return true;
}

export function clearedCount() {
  const u = myWork('unlock') || {};
  return Object.keys(PUZZLES).filter(sid => u[sid] === true).length;
}

/* ---------- 檢查 ---------- */
const norm = s => String(s || '').trim().toLowerCase()
  .replace(/[\s%％，,。.、]/g, '');

function checkCode(gate, value) {
  return gate.answer.some(a => norm(a) === norm(value));
}

function checkNote(gate) {
  const mine = notesList().filter(n => n.authorId === state.me.id && n.namesAbsent);
  return mine.length >= (gate.needAbsent || 1);
}

function checkWork(gate) {
  const w = myWork(gate.taskId);
  if (!w) return false;
  try { return !!gate.check(w); } catch { return false; }
}

/* ============================================================
   畫面
   ============================================================ */
export function gateStep(sid, zh, onCleared, onNext) {
  const p = PUZZLES[sid];
  if (!p) return null;
  const g = p.gate;

  const box = h('section.wrap.stack');
  let tries = 0;

  const paint = () => {
    clear(box);

    /* 已通關 */
    if (unlocked(sid)) {
      box.append(
        eyebrow(zh ? `第 ${p.caseNo} 關・已解開` : `CASE ${p.caseNo} · CLEARED`, 'eyebrow--clay'),
        h('.paper.stack', [
          h('.row.row--tight', [
            h('span.gate__seal', { text: '✓' }),
            h('h2.task__title', { style: { margin: 0 }, text: zh ? '這一關過了' : 'Cleared' }),
          ]),
          h('p', { style: { fontSize: 'var(--t-md)', lineHeight: 1.75 }, text: g.after[zh ? 'zh' : 'en'] }),
          // 解開之後要有明顯的出口。只放工具列的箭頭，學生會卡在這裡。
          h('.row', [
            h('button.btn.btn--primary.btn--lg', {
              type: 'button',
              onclick: () => onNext?.(),
            }, zh ? '進下一關 →' : 'Next case →'),
          ]),
        ]),
      );
      return;
    }

    /* 尚未通關 */
    box.append(
      eyebrow(zh ? `第 ${p.caseNo} 關・上鎖中` : `CASE ${p.caseNo} · LOCKED`, 'eyebrow--clay'),
      h('.paper.stack', [
        h('h2.task__title', { text: zh ? '解開才能往下一關' : 'Solve this to go on' }),
        h('p', { style: { fontSize: 'var(--t-sm)' }, text: g.prompt[zh ? 'zh' : 'en'] }),
        body(),
        g.lab ? h('a.btn.btn--water', { href: `#/lab/${g.lab}` },
          zh ? '打開工具' : 'Open the tool') : null,
        h('details.gate__hint', [
          h('summary', { text: zh ? '卡住了，看提示' : 'Stuck? Show a hint' }),
          h('p', { style: { margin: 'var(--s3) 0 0', fontSize: 'var(--t-sm)' }, text: g.hint[zh ? 'zh' : 'en'] }),
        ]),
      ].filter(Boolean)),
    );
  };

  /* ---- 各型別的作答區 ---- */
  function body() {
    const pass = () => {
      if (unlock(sid)) {
        toast(zh ? '解開了' : 'Unlocked');
        onCleared?.();
      }
      paint();
    };
    const fail = () => {
      tries++;
      toast(tries >= 2
        ? (zh ? '再看一次證據，或打開提示。' : 'Look at the evidence again, or open the hint.')
        : (zh ? '不對。再想想。' : 'Not right. Think again.'));
    };

    switch (g.type) {

      /* ---- 填答案 ---- */
      case 'code':
      case 'sim': {
        const input = h('input.input', {
          placeholder: zh ? '填在這裡' : 'Type here',
          style: { maxWidth: '260px', fontFamily: 'var(--f-mono)', fontSize: 'var(--t-lg)' },
        });
        const go = () => (checkCode(g, input.value) ? pass() : fail());
        input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
        return h('.row', [
          input,
          h('button.btn.btn--primary', { type: 'button', onclick: go }, zh ? '解鎖' : 'Unlock'),
        ]);
      }

      /* ---- 排順序 ---- */
      case 'order': {
        let order = [...g.items].sort(() => 0.5 - Math.random()).map(x => x.id);
        const list = h('.stack-sm');
        const draw = () => {
          clear(list);
          order.forEach((id, k) => {
            const it = g.items.find(x => x.id === id);
            list.append(h('.gate__row', [
              h('span.mono', { style: { color: 'var(--water-lit)', minWidth: '22px' }, text: String(k + 1) }),
              h('span.grow', { text: it[zh ? 'zh' : 'en'] }),
              h('button.btn.btn--sm', {
                type: 'button', 'aria-label': 'up', disabled: k === 0,
                onclick: () => { [order[k - 1], order[k]] = [order[k], order[k - 1]]; draw(); },
              }, '↑'),
              h('button.btn.btn--sm', {
                type: 'button', 'aria-label': 'down', disabled: k === order.length - 1,
                onclick: () => { [order[k + 1], order[k]] = [order[k], order[k + 1]]; draw(); },
              }, '↓'),
            ]));
          });
        };
        draw();
        return h('.stack-sm', [
          list,
          h('button.btn.btn--primary', {
            type: 'button',
            onclick: () => (order.join() === g.answer.join() ? pass() : fail()),
          }, zh ? '對答案' : 'Check'),
        ]);
      }

      /* ---- 配對 ---- */
      case 'match': {
        const picked = {};
        const rows = g.pairs.map((pr, i) => {
          const seg = h('.seg', pr.options.map(o => h('button.seg__btn', {
            type: 'button', data: { v: o.id },
            onclick: e => {
              picked[i] = o.id;
              [...seg.children].forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === o.id)));
            },
          }, o[zh ? 'zh' : 'en'])));
          return h('.stack-sm', [
            h('p', { style: { margin: 0, fontSize: 'var(--t-sm)', fontWeight: 600 }, text: pr.q[zh ? 'zh' : 'en'] }),
            seg,
          ]);
        });
        return h('.stack-sm', [
          ...rows,
          h('button.btn.btn--primary', {
            type: 'button',
            onclick: () => (g.pairs.every((pr, i) => picked[i] === pr.answer) ? pass() : fail()),
          }, zh ? '對答案' : 'Check'),
        ]);
      }

      /* ---- 畫布貼文 ---- */
      case 'note':
        return h('.row', [
          h('a.btn', { href: '#/board' }, zh ? '去觀點畫布' : 'Go to the canvas'),
          h('button.btn.btn--primary', {
            type: 'button',
            onclick: () => (checkNote(g) ? pass() : toast(zh
              ? '還沒看到你貼的那一則，記得勾「提到了不在現場的人」。'
              : 'Not seeing it yet. Remember to tick the absent box.')),
          }, zh ? '我貼好了' : 'I posted it'),
        ]);

      /* ---- 完成任務 ---- */
      case 'work':
        return h('.row', [
          h('button.btn.btn--primary', {
            type: 'button',
            onclick: () => (checkWork(g) ? pass() : toast(zh
              ? '還沒符合條件，再回去看一下。'
              : 'Not there yet. Go back and check.')),
          }, zh ? '我做好了' : "I'm done"),
        ]);

      default:
        return h('p.muted', { text: '?' });
    }
  }

  paint();
  return box;
}

/** 情境那一張 */
export function sceneStep(sid, zh) {
  const p = PUZZLES[sid];
  if (!p) return null;
  return h('section.wrap.stack', [
    eyebrow(zh ? `借水事件簿・第 ${p.caseNo} 關` : `THE BORROWED WATER CASE FILE · ${p.caseNo}`),
    h('.paper.paper--ruled.stack', [
      h('p.task__id', { text: zh ? '現場' : 'THE SCENE' }),
      h('p', { style: { fontSize: 'var(--t-md)', lineHeight: 1.85 }, text: p.scene[zh ? 'zh' : 'en'] }),
      h('p.note-line', { text: p.hunt[zh ? 'zh' : 'en'] }),
    ]),
  ]);
}
