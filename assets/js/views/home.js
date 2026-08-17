/* 首頁：只有一個畫面。
   關卡清單不在這裡——按下「開始上課」之後才看得到（#/map）。 */
import { h, eyebrow } from '../ui.js';
import { L, t, getLang } from '../i18n.js';
import { META } from '../../data/course.js';
import { auth, signedIn, isStaff } from '../auth.js';
import { SESSIONS } from '../../data/course.js';
import { unlocked } from '../gate.js';
import { clearedCount } from '../gate.js';

export default function home(root) {
  const zh = getLang() === 'zh';
  const needLogin = auth.available && !signedIn();
  const done = clearedCount();

  const headline = zh
    ? h('h1.ask.ask--wide', { html: '你家水龍頭的水，<br>是跟<em>誰借</em>的？' })
    : h('h1.ask.ask--wide', { html: 'Where is the water<br>in your tap <em>borrowed</em> from?' });

  root.append(h('section.wrap--wide.section.stack.enter' + (isStaff() ? '' : '.home-hero'), [
    eyebrow('HSINCHU · TOUQIAN RIVER BASIN'),
    headline,
    h('p.lede', { text: L(META.sub) }),
    h('p.note-line', { text: L(META.tail) }),
    h('.row', [
      h('a.btn.btn--primary.btn--lg', { href: needLogin ? '#/join' : '#/map' },
        needLogin ? (zh ? '登入後開始上課' : 'Sign in to start')
                  : done ? (zh ? '接著上' : 'Continue') : t('enterCourse')),
      needLogin ? null : h('a.btn.btn--lg', { href: '#/board' }, t('openBoard')),
      (!needLogin && done) ? h('a.btn.btn--lg', { href: '#/reflect' }, zh ? '我的軌跡' : 'My trail') : null,
    ].filter(Boolean)),
  ]));

  /* 老師與管理員不用再按一次，清單直接開在下面 */
  if (isStaff()) {
    import('./map.js').then(m => {
      const nextUp = SESSIONS.find(x => !unlocked(x.id)) || SESSIONS[0];
      root.append(m.sessionList(zh, nextUp));
    });
  }
}
