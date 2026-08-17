/* ============================================================
   反思 — 把學生自己走過的路攤開來看
   不是再問一次「你學到什麼」，而是把他留下的東西按時間排好，
   讓他對著自己的軌跡回答：哪裡變了、誰還是沒被算進去。
   ============================================================ */
import { h, clear, eyebrow, field, toast, debounce, downloadFile } from '../ui.js';
import { getLang } from '../i18n.js';
import { SESSIONS } from '../../data/course.js';
import { SLOTS } from '../../data/personas.js';
import { state, myWork, saveWork, notesList, subscribe } from '../store.js';

export default function reflect(root) {
  const zh = getLang() === 'zh';
  const offs = [];

  root.append(h('section.wrap.section--tight.stack.enter', [
    eyebrow(zh ? '回頭看' : 'LOOK BACK'),
    h('h1.ask.ask--wide', { text: zh ? '你這一路留下了什麼' : 'What you left behind along the way' }),
    h('p.lede', { text: zh
      ? '你寫過、畫過、投過的東西都在下面，照順序排好。先看完，再回答最後三題。'
      : 'Everything you wrote, drew and voted, in order. Read it first, then answer the three questions at the bottom.' }),
  ]));

  const trail = h('section.wrap.section--tight.stack');
  root.append(trail);

  const paint = () => {
    clear(trail);

    const mine = notesList().filter(n => n.authorId === state.me.id);
    const t0 = myWork('t0');
    const sim = myWork('sim-flow');
    const one = myWork('t6-1');
    const shift = myWork('t6-3');
    const drafts = myWork('t8');
    const perSession = SESSIONS
      .map(s => ({ s, w: myWork(`reflect-${s.id}`) }))
      .filter(x => x.w && (x.w.changed || x.w.missing || x.w.chase));

    /* ---- 一開始怎麼想 ---- */
    if (t0 && (t0.img || t0.line)) {
      trail.append(
        eyebrow(zh ? '第 0 節・我一開始以為' : 'SESSION 0 · WHAT I THOUGHT AT THE START'),
        h('.paper.stack-sm', [
          t0.img ? h('img', { src: t0.img, alt: '', style: { width: '100%', borderRadius: 'var(--r-md)' } }) : null,
          t0.line ? h('p', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: t0.line }) : null,
        ].filter(Boolean)),
      );
    }

    /* ---- 我把線畫在哪 ---- */
    if (sim && typeof sim.ratio === 'number') {
      trail.append(
        eyebrow(zh ? '模擬・我把線畫在哪裡' : 'SIMULATION · WHERE I DREW THE LINE'),
        h('.card.card--water', [
          h('p.mono', { style: { margin: 0, fontSize: 'var(--t-xl)', color: 'var(--clay-lit)' },
                        text: Math.round(sim.ratio * 100) + '%' }),
          h('p', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: sim.readout || '' }),
          sim.reason ? h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: '「' + sim.reason + '」' }) : null,
        ].filter(Boolean)),
      );
    }

    /* ---- 我在畫布上說過的話 ---- */
    if (mine.length) {
      const absent = mine.filter(n => n.namesAbsent).length;
      trail.append(
        eyebrow(zh ? `畫布・我貼了 ${mine.length} 則` : `CANVAS · ${mine.length} NOTES`),
        h('.card', [
          h('p', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
            ? `其中 ${absent} 則你自己標記為「提到了不在現場的人」。`
            : `You marked ${absent} of them as naming someone not in the room.` }),
        ]),
        h('.stack-sm', mine.map(n => h('.card', { style: { padding: 'var(--s3)' } }, [
          h('.row.row--between', [
            h('span', { style: { fontWeight: 700, fontSize: 'var(--t-xs)', color: 'var(--water-lit)' }, text: n.who }),
            h('span.mono', { style: { fontSize: '10px', color: 'var(--fg-3)' }, text: 'S' + n.session }),
          ]),
          h('p', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: n.body }),
        ]))),
      );
    }

    /* ---- 每節的反思 ---- */
    if (perSession.length) {
      trail.append(
        eyebrow(zh ? '每一節你寫下的' : 'WHAT YOU WROTE EACH SESSION'),
        h('.stack-sm', perSession.map(({ s, w }) => h('.card', [
          h('p.mono', { style: { margin: 0, fontSize: 'var(--t-micro)', letterSpacing: '.18em', color: 'var(--water-lit)' },
                        text: `${String(s.n).padStart(2, '0')}　${s.title[zh ? 'zh' : 'en']}` }),
          w.changed ? h('p', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: w.changed }) : null,
          w.missing ? h('p', { style: { margin: 0, fontSize: 'var(--t-sm)', color: 'var(--clay-lit)' },
                               text: (zh ? '還沒被算進去的：' : 'Not counted: ') + w.missing }) : null,
        ].filter(Boolean)))),
      );
    }

    /* ---- 一句話與轉變 ---- */
    if (one?.sentence || shift?.after || drafts?.d3) {
      trail.append(eyebrow(zh ? '你收尾的方式' : 'HOW YOU CLOSED'));
      if (one?.sentence) trail.append(h('.paper', [h('p.pull', { style: { maxWidth: 'none' }, text: one.sentence })]));
      if (shift?.before || shift?.after) {
        trail.append(h('.bridge', [
          h('.card', [h('p', { style: { margin: 0, fontSize: 'var(--t-sm)', color: 'var(--fg-2)' },
                              text: (zh ? '我以前以為　' : 'I used to think ') + (shift.before || '') })]),
          h('.bridge__arrow', { text: '→' }),
          h('.card.card--clay', [h('p', { style: { margin: 0, fontSize: 'var(--t-sm)' },
                                         text: (zh ? '現在我會說　' : 'Now I would say ') + (shift.after || '') })]),
        ]));
      }
      if (drafts?.d3) trail.append(h('.card', [
        h('p.card__title', { text: zh ? '第三版文案' : 'Draft three' }),
        h('p', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: drafts.d3 }),
      ]));
    }

    if (!mine.length && !t0 && !sim && !perSession.length) {
      trail.append(h('.card.card--clay', [
        h('p.card__title', { text: zh ? '這裡還是空的' : 'Nothing here yet' }),
        h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
          ? '先去上課，在畫布貼幾則，拉一次模擬器。你留下的東西會自己排到這裡。'
          : 'Take a session, post to the canvas, run the simulator. What you leave shows up here.' }),
        h('a.btn.btn--primary', { href: '#/s/s0' }, zh ? '從第 0 節開始' : 'Start at session 0'),
      ]));
    }
  };

  paint();
  offs.push(subscribe(w => { if (['notes', 'work', 'init', 'import'].includes(w)) paint(); }));

  /* ============================================================
     總反思
     ============================================================ */
  const saved = myWork('reflect-final') || {};
  const q1 = h('textarea.textarea.textarea--tall', {
    value: saved.q1 || '',
    placeholder: zh ? '從第一張圖到現在，我最大的改變是……' : 'From my first drawing to now, the biggest change is...',
  });
  const q2 = h('textarea.textarea.textarea--tall', {
    value: saved.q2 || '',
    placeholder: zh ? '整條路走完，還是有一個人（或一種東西）沒被算進去，那是……' : 'One party still was not counted, and that is...',
  });
  const q3 = h('textarea.textarea', {
    value: saved.q3 || '',
    placeholder: zh ? '如果明天真的要決定這件事，我會先問誰？' : 'If this were decided tomorrow, who would I ask first?',
  });

  const save = debounce(() => saveWork('reflect-final', { q1: q1.value, q2: q2.value, q3: q3.value }), 600);
  [q1, q2, q3].forEach(el => el.addEventListener('input', save));

  root.append(h('section.wrap.section--tight', [
    h('.paper.stack', [
      h('p.task__id', { text: zh ? '最後三題' : 'THREE LAST QUESTIONS' }),
      h('h2.task__title', { text: zh ? '對著上面那些東西回答' : 'Answer against what is above' }),
      field(zh ? '一、我最大的改變' : 'One. My biggest change', q1),
      field(zh ? '二、誰還是沒被算進去' : 'Two. Who still was not counted', q2,
            zh ? '不能寫「沒有」——這門課的答案不會是沒有' : 'Not "nobody" — that is never the answer here'),
      field(zh ? '三、真的要決定的話，我先問誰' : 'Three. Who I would ask first', q3),
      h('.row', [
        h('button.btn.btn--primary', { type: 'button', onclick: () => { save(); toast(zh ? '記下來了' : 'Saved'); } },
          zh ? '記下來' : 'Save'),
        h('button.btn', {
          type: 'button',
          onclick: () => {
            const mine = notesList().filter(n => n.authorId === state.me.id);
            const dump = {
              name: state.me.name, group: state.me.group,
              start: myWork('t0'), sim: myWork('sim-flow'),
              notes: mine,
              perSession: SESSIONS.map(s => ({ session: s.n, ...(myWork(`reflect-${s.id}`) || {}) })),
              sentence: myWork('t6-1'), shift: myWork('t6-3'), drafts: myWork('t8'),
              final: { q1: q1.value, q2: q2.value, q3: q3.value },
            };
            downloadFile(`我的軌跡-${state.me.name || 'me'}.json`, JSON.stringify(dump, null, 2));
          },
        }, zh ? '下載我的軌跡' : 'Download my trail'),
      ]),
    ]),
  ]));

  /* 六個未在場者的名單，收尾時再看一次 */
  root.append(h('section.wrap.section--tight.stack', [
    eyebrow(zh ? '這門課請他們說過話' : 'THOSE WHO SPOKE HERE'),
    h('.cols-3', SLOTS.map(s => h('.card', [
      h('p.card__title', { text: s.who[zh ? 'zh' : 'en'] }),
      h('p.muted', { style: { margin: 0, fontSize: 'var(--t-xs)' }, text: s.tag[zh ? 'zh' : 'en'] }),
    ]))),
    h('p.note-line', { text: zh
      ? '他們的話都是 AI 代講的。真正該問的人，還在外面。'
      : 'Every one of them was voiced by an AI. The people who should actually be asked are still outside.' }),
  ]));

  return () => offs.forEach(fn => fn());
}
