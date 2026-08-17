/* 首頁：課程總覽 */
import { h, eyebrow } from '../ui.js';
import { L, t, getLang } from '../i18n.js';
import { SESSIONS, RULES, META, ROUTE } from '../../data/course.js';
import { state, notesList } from '../store.js';

export default function home(root) {
  const zh = getLang() === 'zh';

  /* ---- hero ---- */
  const headline = zh
    ? h('h1.ask.ask--wide', { html: '你家水龍頭的水，<br>是跟<em>誰借</em>的？' })
    : h('h1.ask.ask--wide', { html: 'Where is the water<br>in your tap <em>borrowed</em> from?' });

  const hero = h('section.wrap--wide.section.stack.enter', [
    eyebrow('HSINCHU · TOUQIAN RIVER BASIN'),
    headline,
    h('p.lede', { text: L(META.sub) }),
    h('p.note-line', { text: L(META.tail) }),
    h('.row', [
      h('a.btn.btn--primary.btn--lg', { href: `#/s/${SESSIONS[0].id}` }, t('enterCourse')),
      h('a.btn.btn--lg', { href: '#/board' }, t('openBoard')),
    ]),
  ]);

  /* ---- 借水路線 ---- */
  const routeStrip = h('section.wrap--wide.section--tight.stack', [
    eyebrow(zh ? '水怎麼到你家' : 'How the water reaches you'),
    h('.row.route-strip', { style: { gap: '0', alignItems: 'stretch', flexWrap: 'wrap' } },
      ROUTE.flatMap((n, i) => {
        const node = h('.stack-sm', { style: { flex: '1 1 130px', minWidth: '112px', paddingRight: '12px' } }, [
          h('p', { class: 'mono', style: { fontSize: 'var(--t-micro)', color: 'var(--water-lit)', letterSpacing: '.16em', margin: 0 }, text: String(i + 1).padStart(2, '0') }),
          h('p', { style: { fontFamily: 'var(--f-display)', fontSize: 'var(--t-md)', margin: 0 }, text: L(n.name) }),
          h('p', { class: 'muted', style: { fontSize: 'var(--t-xs)', margin: 0 }, text: L(n.role) }),
        ]);
        const arrow = i < ROUTE.length - 1
          ? h('div.route-arrow', { style: { color: 'var(--rule-strong)', alignSelf: 'center', paddingRight: '12px' }, text: '→' })
          : null;
        return [node, arrow].filter(Boolean);
      })),
    h('a.btn.btn--sm', { href: '#/lab/flow' }, zh ? '打開引水模擬' : 'Open the diversion simulator'),
  ]);

  /* ---- 三條規則 ---- */
  const rules = h('section.wrap--wide.section.stack', [
    eyebrow(t('threeRules'), 'eyebrow--clay'),
    h('.cols-3', RULES.map(r => h('.card', [
      h('p.mono', { style: { fontSize: 'var(--t-xl)', color: 'var(--clay)', margin: 0, lineHeight: '1' }, text: String(r.n) }),
      h('p.card__title', { text: L(r.t) }),
      h('p.muted', { style: { fontSize: 'var(--t-sm)', margin: 0 }, text: L(r.d) }),
    ]))),
  ]);

  /* ---- 節次地圖 ---- */
  const notes = notesList().length;
  const partOne = SESSIONS.filter(s => !s.part);
  const partTwo = SESSIONS.filter(s => s.part === 2);

  const mapItem = s => h('a.map__item', {
    href: `#/s/${s.id}`,
    data: {
      current: String(s.n === state.cls.session),
      done: String(s.n < state.cls.session),
    },
  }, [
    h('span.map__n', { text: String(s.n).padStart(2, '0') }),
    h('.map__body', [
      h('span.map__title', { text: L(s.title) }),
      h('span.map__sub', { text: L(s.sub) }),
    ]),
    h('span.map__meta', { text: `${s.mins} ${t('minutes')}` }),
  ]);

  const map = h('section.wrap--wide.section.stack-lg', [
    h('.stack', [
      eyebrow(t('partOne')),
      h('.map', partOne.map(mapItem)),
    ]),
    h('.stack', [
      eyebrow(t('partTwo'), 'eyebrow--clay'),
      h('.map', partTwo.map(mapItem)),
    ]),
  ]);

  /* ---- 目前狀態 ---- */
  const status = h('section.wrap--wide.section--tight', [
    h('.card.card--water.row.row--between', [
      h('div', [
        h('p', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
          ? `目前上到第 ${state.cls.session} 節・畫布上有 ${notes} 則貼文`
          : `Currently at session ${state.cls.session} · ${notes} notes on the canvas` }),
        h('p.muted', { style: { margin: 0, fontSize: 'var(--t-xs)' }, text: zh
          ? `班級 ${state.cls.code}・${state.cls.condition === 'agent' ? '實驗組（AI 代言）' : '對照組（空位留白）'}`
          : `Class ${state.cls.code} · ${state.cls.condition === 'agent' ? 'experimental' : 'control'}` }),
      ]),
      h('a.btn.btn--sm', { href: '#/teacher' }, t('teacher')),
    ]),
  ]);

  root.append(hero, routeStrip, rules, map, status);
}
