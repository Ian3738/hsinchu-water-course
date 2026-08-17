/* 入班：掃 QR 或輸入班級代碼 */
import { h, clear, eyebrow, field, toast } from '../ui.js';
import { getLang } from '../i18n.js';
import { auth, signIn, joinClass, signedIn } from '../auth.js';
import { setClass } from '../store.js';

export default function join(root, { params }) {
  const zh = getLang() === 'zh';
  const code = (params.get('c') || params.get('class') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');

  const box = h('section.wrap--narrow.section.stack.enter');
  root.append(box);

  const paint = () => {
    clear(box);
    box.append(
      eyebrow(zh ? '加入班級' : 'JOIN A CLASS'),
      h('h1.ask.ask--wide', { text: zh ? '你家水龍頭的水，是跟誰借的？' : 'Where is the water in your tap borrowed from?' }),
    );

    if (!auth.available) {
      box.append(h('.card.card--clay', [
        h('p.card__title', { text: zh ? '這台裝置沒有連上帳號系統' : 'Account system unavailable' }),
        h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
          ? '沒關係，你還是可以直接上課，作答會存在這台裝置裡。'
          : 'You can still take the course; your work stays on this device.' }),
        h('a.btn.btn--primary', { href: '#/' }, zh ? '直接開始' : 'Start anyway'),
      ]));
      return;
    }

    if (!signedIn()) {
      box.append(
        h('.paper.stack', [
          h('p.task__id', { text: zh ? '第一步' : 'STEP ONE' }),
          h('h2.task__title', { text: zh ? '用你的 Google 帳號登入' : 'Sign in with your Google account' }),
          h('p', { style: { fontSize: 'var(--t-sm)' }, text: zh
            ? '登入之後，你在課堂上寫的東西才會跟著你走。換裝置、下一節課，都還在。'
            : 'Signing in keeps your work with you across devices and sessions.' }),
          code ? h('p.mono', { style: { fontSize: 'var(--t-sm)', color: 'var(--water)' },
                                text: (zh ? '你要加入的班級：' : 'Class: ') + code }) : null,
          h('button.btn.btn--primary.btn--lg', {
            type: 'button',
            onclick: async () => {
              try { await signIn(); }
              catch (e) { toast((zh ? '登入失敗：' : 'Sign-in failed: ') + (e.message || e)); }
            },
          }, zh ? '用 Google 登入' : 'Sign in with Google'),
          h('p.note-line', { text: zh
            ? '我們只會拿到你的名字、信箱和大頭貼，不會碰你的信件或雲端硬碟。'
            : 'We only receive your name, email and avatar. Nothing else.' }),
        ].filter(Boolean)),
      );
      return;
    }

    /* 已登入 */
    const inClass = code && auth.classes[code];
    if (inClass) {
      box.append(h('.paper.stack', [
        h('p.task__id', { text: zh ? '已經加入' : 'ALREADY IN' }),
        h('h2.task__title', { text: auth.classes[code].name || code }),
        h('a.btn.btn--primary.btn--lg', {
          href: '#/',
          onclick: () => setClass({ code }, { broadcast: false }),
        }, zh ? '進教室' : 'Enter the classroom'),
      ]));
      return;
    }

    const input = h('input.input', { value: code, placeholder: zh ? '班級代碼' : 'Class code' });
    const go = async () => {
      const c = input.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (!c) { toast(zh ? '請輸入班級代碼' : 'Enter a class code'); return; }
      try {
        const cls = await joinClass(c);
        setClass({ code: c, session: cls.session }, { broadcast: false });
        toast(zh ? `加入「${cls.name || c}」了` : `Joined ${cls.name || c}`);
        location.hash = '#/';
        location.reload();
      } catch (e) {
        toast(e.message || String(e));
      }
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });

    box.append(h('.paper.stack', [
      h('p.task__id', { text: zh ? '你好，' + (auth.user.name || '') : 'Hello, ' + (auth.user.name || '') }),
      h('h2.task__title', { text: zh ? '輸入老師給的班級代碼' : "Enter the class code your teacher gave you" }),
      field(zh ? '班級代碼' : 'Class code', input, zh ? '例：703a' : 'e.g. 703a'),
      h('.row', [
        h('button.btn.btn--primary', { type: 'button', onclick: go }, zh ? '加入' : 'Join'),
        h('a.btn.btn--ghost', { href: '#/' }, zh ? '先看看課程' : 'Just browse'),
      ]),
    ]));

    // 已加入的班
    const mine = Object.entries(auth.classes);
    if (mine.length) {
      box.append(
        eyebrow(zh ? '你已經在的班級' : 'YOUR CLASSES'),
        h('.stack-sm', mine.map(([cid, c]) => h('a.map__item', {
          href: '#/',
          onclick: () => { setClass({ code: cid, session: c.session }, { broadcast: false }); },
        }, [
          h('span.map__n', { text: String(c.session ?? 0).padStart(2, '0') }),
          h('.map__body', [
            h('span.map__title', { text: c.name || cid }),
            h('span.map__sub', { text: cid }),
          ]),
          h('span.map__meta', { text: c.open ? (zh ? '開放中' : 'open') : (zh ? '已關閉' : 'closed') }),
        ]))),
      );
    }
  };

  paint();
  return () => {};
}
