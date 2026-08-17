/* 課程總覽：按下「開始上課」之後才會看到的關卡清單 */
import { h, eyebrow } from '../ui.js';
import { L, t, getLang } from '../i18n.js';
import { SESSIONS, RULES } from '../../data/course.js';
import { state, notesList } from '../store.js';
import { unlocked, clearedCount } from '../gate.js';
import { PUZZLES } from '../../data/puzzles.js';

export default function map(root) {
  const zh = getLang() === 'zh';
  const total = Object.keys(PUZZLES).length;
  const done = clearedCount();
  const nextUp = SESSIONS.find(x => !unlocked(x.id)) || SESSIONS[0];

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow(zh ? '借水事件簿' : 'THE BORROWED WATER CASE FILE'),
    h('h1.ask.ask--wide', { text: zh ? '十一關，一關一關解' : 'Eleven cases, one at a time' }),
    h('.row.row--between', [
      h('p.note-line', { style: { margin: 0 }, text: zh
        ? '每一關先有一份文件，再有證據，最後有一道解開才能往下的鎖。'
        : 'Each case opens with a document, then evidence, then a lock you must solve to go on.' }),
      h('span.mono', { style: { fontSize: 'var(--t-sm)', color: 'var(--clay-lit)' }, text: `${done} / ${total}` }),
    ]),
    h('.caseline', SESSIONS.map(s => h('a.caseline__pip', {
      href: `#/s/${s.id}`,
      title: `${PUZZLES[s.id]?.caseNo || ''}　${L(s.title)}`,
      data: { done: String(unlocked(s.id)), at: String(s.id === nextUp.id) },
    }))),
    h('.row', [
      h('a.btn.btn--primary', { href: `#/s/${nextUp.id}` },
        done ? (zh ? `接著解第 ${PUZZLES[nextUp.id]?.caseNo || ''} 關` : 'Continue') : (zh ? '從第 00 關開始' : 'Start at case 00')),
    ]),
  ]));

  root.append(sessionList(zh, nextUp));
}

/** 關卡清單。首頁給老師直接看的時候也用這個。 */
export function sessionList(zh, nextUp) {
  const item = s => {
    const cleared = unlocked(s.id);
    return h('a.map__item', {
      href: `#/s/${s.id}`,
      data: { done: String(cleared), current: String(s.id === nextUp.id) },
    }, [
      h('span.map__n', { text: PUZZLES[s.id]?.caseNo || String(s.n).padStart(2, '0') }),
      h('.map__body', [
        h('span.map__title', { text: L(s.title) }),
        h('span.map__sub', { text: L(s.sub) }),
      ]),
      h('span.map__meta', { text: cleared ? (zh ? '解開了 ✓' : 'cleared ✓') : `${s.mins}′` }),
    ]);
  };

  return h('section.wrap--wide.section--tight.stack', [
    h('.cols-2', [
      h('.stack-sm', [eyebrow(t('partOne')), h('.map', SESSIONS.filter(s => !s.part).map(item))]),
      h('.stack-sm', [eyebrow(t('partTwo'), 'eyebrow--clay'), h('.map', SESSIONS.filter(s => s.part === 2).map(item))]),
    ]),
    h('details.rules', [
      h('summary', { text: t('threeRules') }),
      h('.cols-3', { style: { marginTop: 'var(--s4)' } }, RULES.map(r => h('.card', [
        h('p.mono', { style: { fontSize: 'var(--t-lg)', color: 'var(--clay)', margin: 0, lineHeight: 1 }, text: String(r.n) }),
        h('p.card__title', { text: L(r.t) }),
        h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: L(r.d) }),
      ]))),
    ]),
    h('p.note-line', { text: zh
      ? `班級 ${state.cls.code}・畫布上有 ${notesList().length} 則貼文`
      : `Class ${state.cls.code} · ${notesList().length} notes on the canvas` }),
  ]);
}
