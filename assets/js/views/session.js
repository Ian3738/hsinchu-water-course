/* 節次頁 — 依課程資料渲染各種區塊 */
import { h, append, eyebrow, field, datum, clear, toast, countWords, debounce } from '../ui.js';
import { L, t, getLang } from '../i18n.js';
import { SESSIONS, BY_ID } from '../../data/course.js';
import { BANNED } from '../../data/ui.js';
import { CONFIG } from '../../../config.js';
import { state, castVote, voteTally, subscribe, setClass, saveWork, myWork, allWork, addTalk, talksFor, removeTalk, addReply, repliesFor } from '../store.js';
import { SLOTS, BY_SLOT } from '../../data/personas.js';
import { countWordsIn, cloudEl } from '../wordcloud.js';
import { PUZZLES } from '../../data/puzzles.js';
import { sceneStep, gateStep, unlocked } from '../gate.js';

export default function session(root, { arg, params }) {
  const s = BY_ID[arg];
  if (!s) { root.append(h('.wrap.section', [h('h1.ask', { text: 'Not found' })])); return; }
  const zh = getLang() === 'zh';
  const i = SESSIONS.findIndex(x => x.id === s.id);
  const offs = [];

  /* ============================================================
     這一節是簡報轉過來的，所以維持簡報的樣子：一頁一張，左右翻。
     不做長捲頁——投影時看不到下面，學生也不知道現在該看哪裡。
     ============================================================ */

  const steps = [];

  const push = el => { if (el) { el.classList.add('deck__step'); steps.push(el); } };

  // 第一張：關卡封面
  push(h('section.wrap--wide.stack', [
    eyebrow(`SESSION ${String(s.n).padStart(2, '0')} · ${L(s.sub)}`),
    h('h1.ask.ask--wide', { text: L(s.title) }),
    h('p.note-line', { text: `${s.mins} ${t('minutes')}` }),
  ]));

  // 第二張：現場。先有事情發生，才有資料要查。
  push(sceneStep(s.id, zh));

  // 中間：證據與任務
  s.blocks.forEach((b, bi) => push(renderBlock(b, s, zh, offs, bi)));

  // 倒數第二張：鎖。沒解開不能往下一關。
  let gateAt = -1;
  const gate = gateStep(s.id, zh, () => { paintDots(); });
  if (gate) { gateAt = steps.length; push(gate); }

  // 最後一張：反思
  push(reflectStep(s, zh));

  const deck = h('.deck', steps);
  root.append(deck);

  /* ---- 翻頁 ---- */
  let at = Math.min(Math.max(0, Number(params?.get('p')) || 0), steps.length - 1);

  const dots = h('.deck__dots', steps.map((_, k) => h('button.deck__dot', {
    type: 'button', 'aria-label': `${k + 1} / ${steps.length}`,
    onclick: () => go(k),
  })));

  const counter = h('span.deck__count');

  /** 鎖之後的點畫成鎖住的樣子 */
  function paintDots() {
    const open = gateAt < 0 || unlocked(s.id);
    [...dots.children].forEach((d, n) => {
      d.toggleAttribute('data-locked', !open && n > gateAt);
      d.toggleAttribute('data-gate', gateAt >= 0 && n === gateAt);
    });
  }
  const prevBtn = h('button.btn.btn--sm', { type: 'button', onclick: () => go(at - 1) }, '←');
  const nextBtn = h('button.btn.btn--sm.btn--primary', { type: 'button', onclick: () => go(at + 1) }, '→');

  function go(k) {
    // 鎖住的關卡：沒解開就過不去
    if (gateAt >= 0 && k > gateAt && !unlocked(s.id)) {
      toast(zh ? '這一關還沒解開。' : 'This one is still locked.');
      k = gateAt;
    }
    // 翻過頭就換節次
    if (k < 0) {
      if (i > 0) location.hash = `#/s/${SESSIONS[i - 1].id}?p=99`;
      return;
    }
    if (k >= steps.length) {
      if (i < SESSIONS.length - 1) location.hash = `#/s/${SESSIONS[i + 1].id}`;
      else location.hash = '#/reflect';
      return;
    }
    at = k;
    steps.forEach((el, n) => el.toggleAttribute('hidden', n !== at));
    [...dots.children].forEach((d, n) => d.setAttribute('aria-current', String(n === at)));
    counter.textContent = `${at + 1} / ${steps.length}`;
    paintDots();
    prevBtn.toggleAttribute('aria-disabled', at === 0 && i === 0);
    deck.scrollTop = 0;
  }

  root.append(h('.toolbar', [
    h('.wrap--wide.toolbar__inner', [
      h('a.btn.btn--sm.btn--ghost', { href: '#/' }, '← ' + t('back')),
      prevBtn,
      h('span.deck__nav', [dots, counter]),
      nextBtn,
      h('button.btn.btn--sm.btn--ghost', {
        type: 'button',
        onclick: () => { setClass({ session: s.n }); toast(zh ? `已標記為目前進度：第 ${s.n} 節` : `Marked as current: session ${s.n}`); },
      }, zh ? '設為進度' : 'Set current'),
    ]),
  ]));

  go(at);

  /* ---- 左右鍵翻頁；交給這裡處理，main.js 就不再換節次 ---- */
  const onKey = e => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(at + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(at - 1); }
  };
  window.addEventListener('keydown', onKey, true);
  offs.push(() => window.removeEventListener('keydown', onKey, true));

  return () => offs.forEach(fn => fn());
}

/* ============================================================ */

function renderBlock(b, s, zh, offs, bi = 0) {
  const qid = `${s.id}-b${bi}`;
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
      // 問了就要有地方回答，不然只是投影片
      kids.push(talkBox(qid, L(b.q), zh, offs));
      return wrap(kids);
    }

    /* ---------- 投票 ---------- */
    case 'vote':
      return wrap([voteWidget(b, zh, offs), talkBox(qid, L(b.q), zh, offs)]);

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
    // 用會過濾 null 的 append，不能用原生的——原生會把 null 印成 "null"
    append(box, [
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
    ]);
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

/* ============================================================
   每節的反思
   問三件事：改了什麼想法、誰還沒被算進去、還想追什麼。
   第二題是這門課的核心，所以每節都問一次。
   ============================================================ */
function reflectStep(s, zh) {
  const id = `reflect-${s.id}`;
  const saved = myWork(id) || {};

  const changed = h('textarea.textarea', {
    value: saved.changed || '',
    placeholder: zh ? '上這節之前我以為……現在我會說……' : 'Before this session I thought... now I would say...',
  });
  const missing = h('textarea.textarea', {
    value: saved.missing || '',
    placeholder: zh ? '今天討論的時候，還有誰沒被算進去？' : "Who still wasn't counted in today's discussion?",
  });
  const chase = h('textarea.textarea', {
    value: saved.chase || '',
    placeholder: zh ? '我還想知道……' : 'I still want to know...',
  });

  const done = h('.doneline', [h('.doneline__dot'),
    h('span', { text: zh ? '第二題有寫，而且不是寫「沒有」' : 'Question two answered, and not with "nobody"' })]);

  const save = debounce(() => {
    saveWork(id, { changed: changed.value, missing: missing.value, chase: chase.value, session: s.n });
    const ok = missing.value.trim().length > 2 && !/^(沒有|無|none|no)$/i.test(missing.value.trim());
    done.dataset.done = String(ok);
  }, 600);
  [changed, missing, chase].forEach(el => el.addEventListener('input', save));

  const box = h('section.wrap--wide.stack', [
    eyebrow(zh ? `第 ${s.n} 節・回頭想一下` : `SESSION ${s.n} · LOOK BACK`),
    h('.paper.stack', [
      h('h2.task__title', { text: zh ? '這一節結束之前' : 'Before this session ends' }),
      field(zh ? '我改變了什麼想法' : 'What changed in my thinking', changed),
      field(zh ? '今天還有誰沒被算進去' : 'Who still was not counted', missing,
            zh ? '這一題是這門課的重點' : 'This is the core question of the course'),
      field(zh ? '我還想追什麼' : 'What I still want to chase', chase),
      done,
      h('.row', [
        h('button.btn.btn--primary', { type: 'button', onclick: () => { save(); toast(zh ? '記下來了' : 'Saved'); } },
          zh ? '記下來' : 'Save'),
        h('a.btn', { href: '#/reflect' }, zh ? '看我整條軌跡' : 'See my whole trail'),
      ]),
    ]),
  ]);
  save();
  return box;
}

/* ============================================================
   留言：掛在提問底下，全班看得到彼此寫了什麼
   ============================================================ */
function talkBox(qid, question, zh, offs) {
  const box = h('.talk');

  const ta = h('textarea.textarea', {
    placeholder: zh ? '寫下你的想法。不用完整，先寫再說。' : 'Your thought. It does not have to be finished.',
  });

  const post = () => {
    const v = ta.value.trim();
    if (!v) { toast(zh ? '還沒寫東西' : 'Nothing written'); ta.focus(); return; }
    addTalk(qid, v);
    ta.value = '';
    toast(zh ? '留上去了' : 'Posted');
  };
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); post(); }
  });

  const list = h('.talk__list');
  const count = h('span.mono', { style: { fontSize: 'var(--t-micro)', color: 'var(--fg-3)' } });
  const cloudWrap = h('.talk__cloud');

  const paintCloud = rows => {
    clear(cloudWrap);
    cloudWrap.append(
      h('.row.row--between', [
        h('span.mono', {
          style: { fontSize: 'var(--t-micro)', letterSpacing: '.18em', color: 'var(--clay-lit)' },
          text: zh ? '全班在講什麼' : 'WHAT THE CLASS IS SAYING',
        }),
        h('span.mono', { style: { fontSize: 'var(--t-micro)', color: 'var(--fg-3)' },
                         text: `${new Set(rows.map(r => r.by)).size} ${zh ? '人' : ''}` }),
      ]),
      cloudEl(h, countWordsIn(rows.map(r => r.text), 26), { max: 40, min: 12 }),
    );
    if (rows.length < 3) {
      cloudWrap.append(h('p.talk__empty', { text: zh
        ? '留的人多一點，這裡才看得出重心。'
        : 'A few more thoughts and the weight will show.' }));
    }
  };

  const paint = () => {
    const rows = talksFor(qid);
    count.textContent = rows.length
      ? `${rows.length} ${zh ? '則想法' : 'thoughts'}`
      : (zh ? '還沒有人留' : 'none yet');
    paintCloud(rows);
    clear(list);
    if (!rows.length) {
      list.append(h('p.talk__empty', { text: zh
        ? '第一個留的人最勇敢。想法還沒想好也可以先丟上來。'
        : 'The first one takes the most nerve. Unfinished thoughts are welcome.' }));
      return;
    }
    rows.forEach(r => {
      const mine = r.by === state.me.id;
      const reps = repliesFor(qid, r.ts);
      const repBox = h('.talk__reps', reps.map(x => h('.talk__rep', [
        h('span.talk__who', { text: (x.name || (zh ? '匿名' : 'anon')) + (x.group ? '・' + x.group : '') }),
        h('span', { text: x.text }),
      ])));

      const repIn = h('input.input', {
        placeholder: zh ? '給他一句回饋……' : 'Reply to this...',
        style: { fontSize: 'var(--t-xs)', padding: 'var(--s2)' },
      });
      const sendRep = () => {
        const v = repIn.value.trim();
        if (!v) return;
        addReply(qid, r.ts, v);
        repIn.value = '';
      };
      repIn.addEventListener('keydown', e => { if (e.key === 'Enter') sendRep(); });

      const repForm = h('.talk__repform.hide', [
        repIn,
        h('button.btn.btn--sm', { type: 'button', onclick: sendRep }, zh ? '送出' : 'Send'),
      ]);

      list.append(h('.talk__item', { data: { mine: String(mine) } }, [
        h('.talk__who', [
          h('span', { text: r.name || (zh ? '匿名' : 'anon') }),
          r.group ? h('span', { text: '・' + r.group }) : null,
          h('span.grow'),
          h('button.btn.btn--sm.btn--ghost', {
            type: 'button',
            style: { minHeight: '18px', padding: '0 5px', fontSize: '10px' },
            onclick: () => repForm.classList.toggle('hide'),
          }, reps.length ? `${zh ? '回饋' : 'replies'} ${reps.length}` : (zh ? '回饋' : 'Reply')),
          mine ? h('button.btn.btn--sm.btn--ghost', {
            type: 'button',
            style: { minHeight: '18px', padding: '0 4px', fontSize: '10px' },
            onclick: () => removeTalk(qid, r.ts),
          }, zh ? '收回' : 'Remove') : null,
        ].filter(Boolean)),
        h('.talk__body', { text: r.text }),
        reps.length ? repBox : null,
        repForm,
      ].filter(Boolean)));
    });
    list.scrollTop = list.scrollHeight;
  };

  box.append(h('.talk__split', [
    /* 左：寫與看 */
    h('.talk__side', [
      h('.talk__head', [
        h('span.mono', {
          style: { fontSize: 'var(--t-micro)', letterSpacing: '.18em', color: 'var(--water-lit)' },
          text: zh ? '留下你的想法' : 'LEAVE A THOUGHT',
        }),
        count,
      ]),
      h('.talk__form', [
        ta,
        h('.row.row--tight', [
          h('button.btn.btn--sm.btn--primary', { type: 'button', onclick: post }, zh ? '留言' : 'Post'),
          h('span.muted', { style: { fontSize: 'var(--t-micro)' }, text: zh ? '⌘／Ctrl + Enter 也可以送出' : '⌘/Ctrl + Enter also posts' }),
        ]),
      ]),
      list,
    ]),
    /* 右：這一題的文字雲，有人留就跟著長 */
    cloudWrap,
  ]));

  paint();
  offs.push(subscribe(w => { if (w === 'work') paint(); }));
  return box;
}
