/* 首頁：課程總覽。關卡與鎖只在進入課程之後才出現，
   刻意壓在兩個畫面內。這是入口不是文章，捲太久會找不到自己上到哪。 */
import { h, eyebrow } from '../ui.js';
import { L, t, getLang } from '../i18n.js';
import { SESSIONS, RULES, META } from '../../data/course.js';
import { state, notesList } from '../store.js';
import { unlocked, clearedCount } from '../gate.js';
import { auth, signedIn } from '../auth.js';

export default function home(root) {
  const zh = getLang() === 'zh';
  root.classList.add('home-tight');
  const done = clearedCount();
  const nextUp = SESSIONS.find(x => !unlocked(x.id)) || SESSIONS[0];
  const needLogin = auth.available && !signedIn();

  /* ---------- 第一屏 ---------- */
  const headline = zh
    ? h('h1.ask.ask--wide', { html: '你家水龍頭的水，<br>是跟<em>誰借</em>的？' })
    : h('h1.ask.ask--wide', { html: 'Where is the water<br>in your tap <em>borrowed</em> from?' });

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow('HSINCHU · TOUQIAN RIVER BASIN'),
    headline,
    h('p.lede', { text: L(META.sub) }),
    h('.row', [
      h('a.btn.btn--primary.btn--lg', { href: needLogin ? '#/join' : `#/s/${nextUp.id}` },
        needLogin ? (zh ? '登入後開始上課' : 'Sign in to start')
                  : done ? (zh ? '接著上' : 'Continue') : t('enterCourse')),
      h('a.btn.btn--lg', { href: needLogin ? '#/join' : '#/board' }, t('openBoard')),
      (!needLogin && done) ? h('a.btn.btn--lg', { href: '#/reflect' }, zh ? '我的軌跡' : 'My trail') : null,
    ].filter(Boolean)),
    h('p.note-line', { text: L(META.tail) }),
  ]));

  /* ---------- 第二屏：關卡清單，兩欄並排 ---------- */
  const item = s => {
    const cleared = unlocked(s.id);
    return h('a.map__item', {
      href: needLogin ? '#/join' : `#/s/${s.id}`,
      data: { done: String(cleared), current: String(s.id === nextUp.id) },
    }, [
      h('span.map__n', { text: String(s.n).padStart(2, '0') }),
      h('.map__body', [
        h('span.map__title', { text: L(s.title) }),
        h('span.map__sub', { text: L(s.sub) }),
      ]),
      h('span.map__meta', { text: cleared ? (zh ? '上過了 ✓' : 'done ✓') : `${s.mins}′` }),
    ]);
  };

  root.append(h('section.wrap--wide.section--tight', [
    h('.cols-2', [
      h('.stack-sm', [eyebrow(t('partOne')), h('.map', SESSIONS.filter(s => !s.part).map(item))]),
      h('.stack-sm', [eyebrow(t('partTwo'), 'eyebrow--clay'), h('.map', SESSIONS.filter(s => s.part === 2).map(item))]),
    ]),
  ]));

  /* ---------- 收尾：三條規則收進摺疊，要看的人再打開 ---------- */
  root.append(h('section.wrap--wide.section--tight', [
    h('details.rules', [
      h('summary', { text: t('threeRules') }),
      h('.cols-3', { style: { marginTop: 'var(--s4)' } }, RULES.map(r => h('.card', [
        h('p.mono', { style: { fontSize: 'var(--t-lg)', color: 'var(--clay)', margin: 0, lineHeight: 1 }, text: String(r.n) }),
        h('p.card__title', { text: L(r.t) }),
        h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: L(r.d) }),
      ]))),
    ]),
    h('p.note-line', { style: { marginTop: 'var(--s4)' }, text: zh
      ? `班級 ${state.cls.code}・畫布上有 ${notesList().length} 則貼文`
      : `Class ${state.cls.code} · ${notesList().length} notes on the canvas` }),
  ]));

  return () => root.classList.remove('home-tight');
}
