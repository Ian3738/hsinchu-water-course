/* 節次頁 — 依課程資料渲染各種區塊 */
import { h, eyebrow, datum, clear, toast, countWords } from '../ui.js';
import { L, t, getLang } from '../i18n.js';
import { SESSIONS, BY_ID } from '../../data/course.js';
import { BANNED } from '../../data/ui.js';
import { CONFIG } from '../../../config.js';
import { state, castVote, voteTally, subscribe, setClass, saveWork, myWork } from '../store.js';
import { SLOTS, BY_SLOT } from '../../data/personas.js';

export default function session(root, { arg }) {
  const s = BY_ID[arg];
  if (!s) { root.append(h('.wrap.section', [h('h1.ask', { text: 'Not found' })])); return; }
  const zh = getLang() === 'zh';
  const i = SESSIONS.findIndex(x => x.id === s.id);
  const offs = [];

  /* ---- 節次抬頭 ---- */
  root.append(h('section.wrap--wide.section.stack.enter', [
    eyebrow(`SESSION ${String(s.n).padStart(2, '0')} · ${L(s.sub)}`),
    h('h1.ask.ask--wide', { text: L(s.title) }),
    h('p.note-line', { text: `${s.mins} ${t('minutes')}` }),
  ]));

  /* ---- 區塊 ---- */
  const body = h('div');
  root.append(body);
  s.blocks.forEach(b => {
    const el = renderBlock(b, s, zh, offs);
    if (el) body.append(el);
  });

  /* ---- 底部導覽 ---- */
  const prev = i > 0 ? SESSIONS[i - 1] : null;
  const next = i < SESSIONS.length - 1 ? SESSIONS[i + 1] : null;
  root.append(h('.toolbar', [
    h('.wrap--wide.toolbar__inner', [
      h('a.btn.btn--sm.btn--ghost', { href: '#/' }, '← ' + t('back')),
      prev ? h('a.btn.btn--sm', { href: `#/s/${prev.id}` }, `← ${String(prev.n).padStart(2, '0')}`) : null,
      h('span.grow'),
      h('button.btn.btn--sm', {
        type: 'button',
        onclick: () => { setClass({ session: s.n }); toast(zh ? `已標記為目前進度：第 ${s.n} 節` : `Marked as current: session ${s.n}`); },
      }, zh ? '設為目前進度' : 'Set as current'),
      next ? h('a.btn.btn--sm.btn--primary', { href: `#/s/${next.id}` }, `${String(next.n).padStart(2, '0')} →`) : null,
    ]),
  ]));

  return () => offs.forEach(fn => fn());
}

/* ============================================================ */

function renderBlock(b, s, zh, offs) {
  switch (b.type) {

    /* ---------- 影片 ---------- */
    case 'video': {
      const src = CONFIG.media[b.slot];
      return wrap([
        eyebrow(L(b.cap)),
        h('.sim__stage', { style: { aspectRatio: '16/9' } }, [
          src
            ? h('video', { src, controls: true, loop: true, muted: true, playsinline: true,
                           style: { width: '100%', height: '100%', objectFit: 'cover' } })
            : h('.stack-sm', { style: { placeContent: 'center', height: '100%', textAlign: 'center', padding: 'var(--s6)' } }, [
                h('p.muted', { text: zh ? '影片還沒放進來' : 'No video file yet' }),
                h('p.note-line', { style: { marginInline: 'auto' }, text: zh
                  ? `把影片放到 media/ 資料夾，或在 config.js 的 media.${b.slot} 填上網址。`
                  : `Drop the file into media/ or set media.${b.slot} in config.js.` }),
              ]),
        ]),
        h('p.note-line', { text: L(b.note) }),
      ]);
    }

    /* ---------- 三條規則 ---------- */
    case 'rules': {
      return null; // 首頁已有，節次內不重複
    }

    /* ---------- 查資料 ---------- */
    case 'facts':
      return wrap([
        eyebrow(L(b.head), b.tone === 'clay' ? 'eyebrow--clay' : ''),
        h('.datum-grid', b.items.map(it => datum(L(it.n), L(it.l), b.tone !== 'clay'))),
      ]);

    /* ---------- 大提問 ---------- */
    case 'ask': {
      const kids = [h('h2.ask', { text: L(b.q) })];
      if (b.note) kids.push(h('p.note-line', { text: L(b.note) }));
      if (b.sides) kids.push(h('.cols-2', b.sides.map((sd, idx) =>
        h('.card' + (idx === 0 ? '.card--water' : '.card--clay'), [
          h('p.card__title', { text: L(sd.k) }),
          h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: L(sd.v) }),
        ]))));
      return wrap(kids);
    }

    /* ---------- 投票 ---------- */
    case 'vote':
      return wrap([voteWidget(b, zh, offs)]);

    /* ---------- 散文 ---------- */
    case 'prose': {
      if (b.tone === 'big') {
        return wrap([
          h('p.ask.ask--wide', { html: L(b.body) }),
          b.note ? h('p.note-line', { text: L(b.note) }) : null,
        ].filter(Boolean));
      }
      const kids = [];
      if (b.head) kids.push(eyebrow(L(b.head)));
      if (b.pairs) {
        kids.push(h('.stack-sm', b.pairs.map(([a, c]) => h('.bridge', [
          h('p', { style: { margin: 0, fontSize: 'var(--t-sm)', color: 'var(--fg-2)' }, text: L(a) }),
          h('.bridge__arrow', { text: '→' }),
          h('p', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: L(c) }),
        ]))));
      }
      if (b.banned) kids.push(bannedList(zh));
      if (b.body) kids.push(h('p.lede', { text: L(b.body) }));
      return wrap(kids);
    }

    /* ---------- 條列 ---------- */
    case 'list': {
      const kids = [eyebrow(L(b.head))];
      if (b.lead) kids.push(h('p.lede', { text: L(b.lead) }));
      kids.push(h('.cols-3', b.items.map((it, idx) => h('.card', [
        h('p.mono', { style: { fontSize: 'var(--t-lg)', color: 'var(--clay)', margin: 0, lineHeight: 1 }, text: String(idx + 1) }),
        h('p.card__title', { text: L(it.t) }),
        h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: L(it.d) }),
      ]))));
      if (b.note) kids.push(h('p.note-line', { text: L(b.note) }));
      return wrap(kids);
    }

    /* ---------- 任務卡 ---------- */
    case 'task':
      return wrap([taskCard(b, zh)]);

    /* ---------- 承轉 ---------- */
    case 'bridge':
      return wrap([
        h('p.lede', { text: L(b.lead) }),
        h('.bridge', [
          h('.card', [
            h('p.mono', { style: { margin: 0, fontSize: 'var(--t-micro)', letterSpacing: '.18em', color: 'var(--fg-3)' },
                          text: zh ? '你剛剛說的' : 'WHAT YOU JUST SAID' }),
            h('ul.bridge__list', b.said.map(x => h('li', { text: L(x) + '」' }))),
          ]),
          h('.bridge__arrow', { text: '→' }),
          h('.card.card--clay', [
            h('p.mono', { style: { margin: 0, fontSize: 'var(--t-micro)', letterSpacing: '.18em', color: 'var(--clay-lit)' },
                          text: zh ? '所以下一個問題是' : 'SO THE NEXT QUESTION IS' }),
            h('p', { style: { margin: 0, fontFamily: 'var(--f-display)', fontSize: 'var(--t-lg)', lineHeight: 1.4 }, text: L(b.next) }),
          ]),
        ]),
      ]);

    /* ---------- 互動連結 ---------- */
    case 'lab':
      return wrap([
        h('.card.card--water.row.row--between', [
          h('div', [
            h('p.card__title', { text: L(b.title) }),
            h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: L(b.body) }),
          ]),
          h('a.btn.btn--water', { href: `#/lab/${b.lab}` }, t('open')),
        ]),
      ]);

    /* ---------- 畫布導引 ---------- */
    case 'board':
      return wrap([
        eyebrow(t('boardTitle')),
        h('p.lede', { text: L(b.intro) }),
        h('a.btn.btn--primary', { href: '#/board' }, t('openBoard')),
      ]);

    /* ---------- 填空位 ---------- */
    case 'slotfill': {
      const slot = SLOTS.find(x => x.unlock === s.n);
      return wrap([
        h('.card.card--clay.stack-sm', [
          h('p.card__title', { text: L(b.head) }),
          h('p', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: L(b.body) }),
          slot ? h('p.muted', { style: { margin: 0, fontSize: 'var(--t-xs)' },
                                text: (zh ? '這一節打開的空位：' : 'Opens this session: ') + L(slot.who) }) : null,
          h('a.btn.btn--sm', { href: '#/board' }, t('openBoard')),
        ].filter(Boolean)),
      ]);
    }

    /* ---------- 範例 ---------- */
    case 'example':
      return wrap([
        eyebrow(L(b.head)),
        h('.cols-2', b.pair.map(x => h('.card', [
          h('p', { style: { margin: 0, fontSize: 'var(--t-sm)', fontFamily: 'var(--f-display)' }, text: '「' + L(x) + '」' }),
        ]))),
        h('.paper', [h('p.pull', { style: { maxWidth: 'none' }, text: L(b.body) })]),
        h('p.note-line', { text: L(b.gap) }),
      ]);

    default:
      return null;
  }
}

/* ============================================================ */

function wrap(kids) {
  return h('section.wrap--wide.section--tight.stack', kids.filter(Boolean));
}

/* ---------- 投票 ---------- */
function voteWidget(b, zh, offs) {
  const box = h('.stack');
  const paint = () => {
    clear(box);
    const { tally, total, mine } = voteTally(b.id);
    box.append(
      h('h2.ask', { text: L(b.q) }),
      b.note ? h('p.note-line', { text: L(b.note) }) : null,
      h('.row', b.options.map(o => h('button.btn' + (mine === o.id ? '.btn--primary' : ''), {
        type: 'button',
        onclick: () => { castVote(b.id, o.id); paint(); },
      }, L(o.l)))),
      total ? h('.stack-sm', b.options.map(o => {
        const n = tally[o.id] || 0;
        const pct = total ? Math.round(n / total * 100) : 0;
        return h('div', [
          h('.row.row--between', { style: { fontSize: 'var(--t-xs)' } }, [
            h('span', { text: L(o.l) }),
            h('span.mono', { text: `${n}　${pct}%` }),
          ]),
          h('.meter', [h('.meter__fill', { style: { width: pct + '%' } })]),
        ]);
      })) : null,
      total ? h('p.muted', { style: { fontSize: 'var(--t-xs)' }, text: (zh ? '共 ' : '') + total + (zh ? ' 票' : ' votes') }) : null,
    );
  };
  paint();
  offs.push(subscribe(w => { if (w === 'votes') paint(); }));
  return box;
}

/* ---------- 任務卡 ---------- */
function taskCard(b, zh) {
  const card = h('.paper.task', [
    h('.task__head', [
      h('div', [
        h('p.task__id', { text: b.tid }),
        h('h2.task__title', { text: L(b.title) }),
      ]),
      h('dl.task__meta', [
        h('div', [h('dt', { text: t('time') }), h('dd', { text: `${b.mins} ${t('minutes')}` })]),
        h('div', [h('dt', { text: t('handin') }), h('dd', { text: L(b.hand) })]),
        h('div', [h('dt', { text: t('done') }), h('dd', { text: L(b.done) })]),
      ]),
    ]),
    h('ol.steps', b.steps.map(x => h('li', { text: L(x) }))),
  ]);

  if (b.lab) {
    card.append(h('.row', [
      h('a.btn.btn--primary', { href: `#/lab/${b.lab}` }, zh ? '打開工具做這題' : 'Open the tool'),
    ]));
  }

  if (b.alt) {
    const alt = h('details', { style: { borderTop: '1px dashed var(--rule-paper)', paddingTop: 'var(--s4)' } }, [
      h('summary', { style: { cursor: 'pointer', fontWeight: 700, fontSize: 'var(--t-sm)' }, text: L(b.alt.head) }),
      h('.stack-sm', { style: { marginTop: 'var(--s3)' } }, [
        h('ol.steps', b.alt.steps.map(x => h('li', { text: L(x) }))),
        h('p.note-line', { text: L(b.alt.note) }),
      ]),
    ]);
    card.append(alt);
  }

  return card;
}

/* ---------- 禁用字 ---------- */
function bannedList(zh) {
  const words = zh ? BANNED.zh : BANNED.en;
  return h('.row', { style: { gap: 'var(--s2)' } }, words.map(w =>
    h('span', {
      style: {
        fontFamily: 'var(--f-display)', fontSize: 'var(--t-lg)',
        color: 'var(--clay-lit)', textDecoration: 'line-through',
        textDecorationThickness: '2px', opacity: '.85',
        padding: '2px 10px', border: '1px solid rgba(217,119,66,.3)',
        borderRadius: 'var(--r-md)',
      },
      text: w,
    })));
}
