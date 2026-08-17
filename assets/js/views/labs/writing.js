/* 第 6 至 8 節的寫作模組：三欄表、三版草稿、一句話、我以前以為 */
import { h, clear, eyebrow, field, toast, debounce, countWords, esc } from '../../ui.js';
import { t, getLang } from '../../i18n.js';
import { BANNED, VAGUE } from '../../../data/ui.js';
import { saveWork, myWork, allWork, notesList, addNote, subscribe, state } from '../../store.js';

/* ============================================================
   Task 7-1 三欄表
   ============================================================ */
export function table3(root) {
  const zh = getLang() === 'zh';
  const saved = myWork('t7-1') || {};
  const ROWS = [
    { id: 'official', zh: '官方介紹', en: 'Official' },
    { id: 'news',     zh: '新聞報導', en: 'News' },
    { id: 'tourism',  zh: '觀光文案', en: 'Tourism' },
  ];
  const COLS = [
    { id: 'know', zh: '它要我知道什麼', en: 'What it wants me to know' },
    { id: 'feel', zh: '它要我覺得怎樣', en: 'What it wants me to feel' },
    { id: 'omit', zh: '它沒有提到誰',   en: 'Who it leaves out' },
  ];

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow('TASK 7-1 · ' + (zh ? '三欄表' : 'THREE-COLUMN TABLE')),
    h('h1.ask.ask--wide', { text: zh ? '同一件事，為什麼可以有三種寫法？' : 'Why can one subject be written three different ways?' }),
    h('p.lede', { text: zh ? '不是誰對，是各自想達成什麼。' : 'Not who is right, but what each is trying to achieve.' }),
  ]));

  const cells = {};
  const tbody = h('tbody', ROWS.map(r => h('tr', [
    h('th', { text: zh ? r.zh : r.en }),
    ...COLS.map(c => {
      const key = `${r.id}_${c.id}`;
      const ta = h('textarea', { value: saved[key] || '', 'aria-label': `${zh ? r.zh : r.en} — ${zh ? c.zh : c.en}` });
      cells[key] = ta;
      ta.addEventListener('input', autosave);
      return h('td', [ta]);
    }),
  ])));

  function autosave() {
    const out = {};
    Object.entries(cells).forEach(([k, el]) => { out[k] = el.value; });
    const filledOmit = ROWS.every(r => (cells[`${r.id}_omit`].value || '').trim());
    out.done = filledOmit;
    saveDebounced(out);
    doneline.dataset.done = String(filledOmit);
  }
  const saveDebounced = debounce(o => saveWork('t7-1', o), 700);

  const doneline = h('.doneline', { data: { done: 'false' } }, [
    h('.doneline__dot'),
    h('span', { text: zh ? '三種文本的第三欄都填了' : 'Column three filled for all three texts' }),
  ]);

  root.append(h('section.wrap--wide.section--tight', [
    h('.paper.stack', [
      h('p.task__id', { text: zh ? '填不出來就再讀一次' : "If you can't fill it, read it again" }),
      h('.tbl-wrap', [h('table.tbl', [
        h('thead', [h('tr', [h('th', { text: '' }), ...COLS.map(c => h('th', { text: zh ? c.zh : c.en }))])]),
        tbody,
      ])]),
      doneline,
      h('.row', [h('button.btn.btn--primary', { type: 'button', onclick: () => { autosave(); toast(t('saved')); } }, t('save'))]),
    ]),
  ]));

  autosave();
}

/* ============================================================
   Task 8 三版草稿
   ============================================================ */
export function drafts(root) {
  const zh = getLang() === 'zh';
  const saved = myWork('t8') || {};
  const banned = zh ? BANNED.zh : BANNED.en;
  const vague = zh ? VAGUE.zh : VAGUE.en;

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow('TASK 8 · ' + (zh ? '三版草稿' : 'THREE DRAFTS')),
    h('h1.ask.ask--wide', { text: zh
      ? '三版都要留著。我看的是它們之間的距離。'
      : 'Keep all three drafts. What I read is the distance between them.' }),
    h('p.note-line', { text: zh ? '最後一版有多好，沒有你想的那麼重要。' : 'How good the last one is matters less than you think.' }),
  ]));

  /* ---- 禁用字表 ---- */
  root.append(h('section.wrap--wide.section--tight.stack', [
    eyebrow(zh ? '這些字不准用' : 'THESE WORDS ARE NOT ALLOWED', 'eyebrow--clay'),
    h('.row', { style: { gap: 'var(--s2)' } }, banned.map(w => h('span', {
      style: {
        fontFamily: 'var(--f-display)', fontSize: 'var(--t-md)', color: 'var(--clay-lit)',
        textDecoration: 'line-through', textDecorationThickness: '2px',
        padding: '2px 10px', border: '1px solid rgba(217,119,66,.3)', borderRadius: 'var(--r-md)',
      }, text: w,
    }))),
    h('p.note-line', { text: zh
      ? '這些字放到哪裡都通，所以它們什麼都沒說。把「美麗的溪」換成「1999 年以前可以直接喝的溪」，差別就出來了。'
      : 'These words fit anywhere, which is why they say nothing.' }),
  ]));

  /* ---- 三版 ---- */
  const specs = [
    { id: 'd1', label: t('draft1'), limit: 100, over: 'under',
      hint: { zh: '想到什麼寫什麼，不要停下來改。寫滿一百字。', en: "Write whatever comes. Don't stop to fix anything." } },
    { id: 'd2', label: t('draft2'), limit: 30, over: 'hard',
      hint: { zh: '刪形容詞、抽象換具體、動詞放前面。三十字是硬上限。', en: 'Delete adjectives, swap abstractions for specifics, verbs before nouns. Thirty is a hard limit.' } },
    { id: 'd3', label: t('draft3'), limit: 40, over: 'soft',
      hint: { zh: '不要把話講完。留一個缺口，讓讀的人想問問題。', en: "Don't finish the thought. Leave a gap so the reader asks." } },
  ];

  const tas = {};
  const grid = h('.stack-lg');

  specs.forEach(sp => {
    const ta = h('textarea.textarea.textarea--tall', { value: saved[sp.id] || '', placeholder: zh ? sp.hint.zh : sp.hint.en });
    tas[sp.id] = ta;
    const counter = h('span.counter');
    const flags = h('.stack-sm');
    const preview = h('div', {
      style: {
        fontSize: 'var(--t-sm)', lineHeight: 1.7, minHeight: '1em',
        padding: 'var(--s3)', background: '#fff', border: '1px solid var(--rule-paper)',
        borderRadius: 'var(--r-md)',
      },
    });

    const check = () => {
      const txt = ta.value;
      const n = countWords(txt);
      counter.textContent = `${n} / ${sp.limit} ${t('wordCount')}`;
      counter.dataset.state =
        sp.over === 'under' ? (n >= sp.limit ? 'ok' : n >= sp.limit * .7 ? 'near' : '')
                            : (n > sp.limit ? 'over' : n > sp.limit * .8 ? 'near' : 'ok');

      const { html, hitsB, hitsV } = markUp(txt, banned, vague);
      preview.innerHTML = html || `<span style="color:var(--on-paper-2)">${zh ? '這裡會顯示標記結果' : 'Marked-up text appears here'}</span>`;

      clear(flags);
      if (hitsB.length) flags.append(h('p', {
        style: { margin: 0, fontSize: 'var(--t-xs)', color: '#B3401C', fontWeight: '700' },
        text: `${t('bannedFound')}：${hitsB.join('、')}`,
      }));
      else if (txt.trim()) flags.append(h('p', {
        style: { margin: 0, fontSize: 'var(--t-xs)', color: '#2E7D5B' }, text: t('bannedClean'),
      }));
      if (hitsV.length) flags.append(h('p', {
        style: { margin: 0, fontSize: 'var(--t-xs)', color: '#A2750C' },
        text: (zh ? '這幾個字太空泛，換成具體的：' : 'Too vague, swap for specifics: ') + hitsV.join('、'),
      }));
      autosave();
    };

    ta.addEventListener('input', check);
    grid.append(h('.paper.stack', [
      h('.row.row--between', [h('p.task__id', { text: sp.label }), counter]),
      h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh ? sp.hint.zh : sp.hint.en }),
      ta, flags, preview,
    ]));
    queueMicrotask(check);
  });

  /* ---- 砍掉什麼 / 希望被問什麼 ---- */
  const cut = h('textarea.textarea', { value: saved.cut || '', placeholder: zh ? '從第一版到第三版，你丟掉了什麼？' : 'From draft one to three, what did you throw away?' });
  const q   = h('textarea.textarea', { value: saved.q || '', placeholder: zh ? '你希望讀的人問什麼？' : 'What question do you hope they ask?' });
  [cut, q].forEach(el => el.addEventListener('input', () => autosave()));

  const doneline = h('.doneline', [h('.doneline__dot'),
    h('span', { text: zh ? '你講得出你希望對方問什麼' : 'You can name the question you want asked' })]);

  const autosave = debounce(() => {
    const out = { cut: cut.value, q: q.value };
    Object.entries(tas).forEach(([k, el]) => { out[k] = el.value; });
    saveWork('t8', out);
    doneline.dataset.done = String(!!q.value.trim());
  }, 700);

  root.append(h('section.wrap--wide.section--tight', [grid]));
  root.append(h('section.wrap--wide.section--tight', [
    h('.paper.stack', [
      h('p.task__id', { text: zh ? '三版並排看一次' : 'LAY THEM SIDE BY SIDE' }),
      field(t('whatYouCut'), cut),
      field(t('hopeTheyAsk'), q, zh ? '這一欄是完成標準' : 'This field is the done-when'),
      doneline,
      h('.row', [h('button.btn.btn--primary', { type: 'button', onclick: () => { autosave(); toast(t('saved')); } }, t('save'))]),
    ]),
  ]));
}

/* ============================================================
   Task 6-1 一句話綜合
   ============================================================ */
export function synthesis(root) {
  const zh = getLang() === 'zh';
  const saved = myWork('t6-1') || {};
  let picked = saved.picked || [];
  const offs = [];

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow('TASK 6-1 · ' + (zh ? '一句話' : 'ONE SENTENCE')),
    h('h1.ask.ask--wide', { text: zh
      ? '寫一句話，讓兩則互相矛盾的貼文都變成它的例子。'
      : 'Write one sentence that makes two contradictory notes examples of it.' }),
  ]));

  root.append(h('section.wrap--wide.section--tight.stack', [
    h('.cols-3', [
      [zh ? '裝得下對立的兩邊' : 'Hold both sides', zh ? '不是選一邊，是兩邊的理由都放得進去。' : 'Not pick one; both reasons fit inside.'],
      [zh ? '站得比兩邊都高' : 'Stand higher', zh ? '原本那兩句話，變成你這句話的例子。' : 'The two become examples of yours.'],
      [zh ? '還可以被改' : 'Stay open', zh ? '不是句點。別人還能往上加東西。' : 'Not a full stop. Someone can add to it.'],
    ].map(([tt, dd], i) => h('.card', [
      h('p.mono', { style: { margin: 0, color: 'var(--clay)', fontSize: 'var(--t-lg)', lineHeight: 1 }, text: String(i + 1) }),
      h('p.card__title', { text: tt }),
      h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: dd }),
    ]))),
    h('p.note-line', { text: zh
      ? '第三件最難。要留位置給別人回話，不然這句話就死了。'
      : 'The third is hardest. Leave room for a reply, or the sentence dies.' }),
  ]));

  /* ---- 挑兩則矛盾的貼文 ---- */
  const pickBox = h('.cols-2');
  const sentence = h('textarea.textarea.textarea--tall', {
    value: saved.sentence || '',
    placeholder: zh ? '把那兩則都吸收進來的一句話……' : 'One sentence that absorbs both...',
  });
  const doneline = h('.doneline', [h('.doneline__dot'),
    h('span', { text: zh ? '你指得出它吸收了哪兩則' : 'You can point to the two it absorbs' })]);

  const autosave = debounce(() => {
    saveWork('t6-1', { picked, sentence: sentence.value });
    doneline.dataset.done = String(picked.length === 2 && !!sentence.value.trim());
  }, 700);
  sentence.addEventListener('input', autosave);

  const paintPicks = () => {
    clear(pickBox);
    const list = notesList();
    if (!list.length) {
      pickBox.append(h('p.muted', { text: zh ? '畫布上還沒有貼文。先回去貼幾則。' : 'No notes on the canvas yet.' }));
      return;
    }
    list.forEach(n => {
      const on = picked.includes(n.id);
      pickBox.append(h('button.role', {
        type: 'button', 'aria-pressed': String(on),
        onclick: () => {
          if (on) picked = picked.filter(x => x !== n.id);
          else if (picked.length < 2) picked = [...picked, n.id];
          else toast(zh ? '只能挑兩則' : 'Pick two only');
          paintPicks(); autosave();
        },
      }, [
        h('span.role__n', { text: n.who }),
        h('span.role__want', { text: n.body }),
      ]));
    });
  };
  paintPicks();
  offs.push(subscribe(w => { if (w === 'notes') paintPicks(); }));

  root.append(h('section.wrap--wide.section--tight.stack', [
    eyebrow(zh ? '挑出互相矛盾的兩則' : 'PICK TWO THAT CONTRADICT'),
    pickBox,
  ]));

  root.append(h('section.wrap--wide.section--tight', [
    h('.paper.stack', [
      h('p.task__id', { text: zh ? '你的那一句' : 'YOUR SENTENCE' }),
      sentence,
      doneline,
      h('.row', [
        h('button.btn.btn--primary', { type: 'button', onclick: () => { autosave(); toast(t('saved')); } }, t('save')),
        h('button.btn', {
          type: 'button',
          onclick: () => {
            if (!sentence.value.trim()) { toast(t('needBody')); return; }
            addNote({
              who: zh ? '我們這組的一句話' : "Our group's sentence",
              cares: zh ? '綜合' : 'SYNTHESIS',
              body: sentence.value.trim(),
              side: 'absent',
            });
            toast(t('posted'));
          },
        }, t('post')),
      ]),
    ]),
  ]));

  /* ---- 範例 ---- */
  root.append(h('section.wrap--wide.section--tight.stack', [
    eyebrow(zh ? '卡住的話，這裡有個例子' : "IF YOU'RE STUCK"),
    h('.paper', [
      h('p.pull', { style: { maxWidth: 'none' }, text: zh
        ? '借跟拿的差別，不在於有沒有還，而在於對方有沒有機會說話。溪不會講話，被徵地的人不在場，新埔人是事後才知道的。新竹的水，其實是一個關於誰有資格決定的故事。'
        : 'Borrowing differs from taking not in whether it is repaid, but in whether the other side had a say. The river cannot speak, the landowners were not in the room, and Xinpu residents found out afterwards.' }),
    ]),
    h('p.note-line', { text: zh
      ? '這個例子也有漏洞：住在城裡的我們，有被問過嗎？'
      : 'This example has a gap too: were those of us in the city ever asked?' }),
  ]));

  return () => offs.forEach(fn => fn());
}

/* ============================================================
   Task 6-3 我以前以為
   ============================================================ */
export function shift(root) {
  const zh = getLang() === 'zh';
  const saved = myWork('t6-3') || {};
  const before = h('textarea.textarea', { value: saved.before || '', placeholder: zh ? '我以前以為……' : 'I used to think...' });
  const after  = h('textarea.textarea', { value: saved.after || '',  placeholder: zh ? '現在我會說……' : 'Now I would say...' });

  const autosave = debounce(() => saveWork('t6-3', { before: before.value, after: after.value }), 700);
  [before, after].forEach(el => el.addEventListener('input', autosave));

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow('TASK 6-3 · ' + (zh ? '回頭看' : 'LOOK BACK')),
    h('h1.ask.ask--wide', { text: zh ? '回頭看你一開始畫的那張' : 'Look back at your first drawing' }),
    h('p.lede', { text: zh ? '找出你那張「我一開始以為」的圖，然後寫這兩句。' : 'Find your "What I thought at the start" and write these two lines.' }),
  ]));

  root.append(h('section.wrap--wide.section--tight', [
    h('.paper.stack', [
      h('.cols-2', [
        field(zh ? '我以前以為' : 'I used to think', before),
        field(zh ? '現在我會說' : 'Now I would say', after),
      ]),
      h('.doneline', [h('.doneline__dot'), h('span', { text: zh ? '你講得出改變了什麼' : 'You can say what changed' })]),
      h('.row', [
        h('button.btn.btn--primary', { type: 'button', onclick: () => { autosave(); toast(t('saved')); } }, t('save')),
        h('button.btn', {
          type: 'button',
          onclick: () => {
            if (!after.value.trim()) { toast(t('needBody')); return; }
            addNote({
              who: state.me.name || (zh ? '我' : 'me'),
              cares: zh ? '改變' : 'SHIFT',
              body: (zh ? '我以前以為' : 'I used to think ') + before.value.trim() +
                    (zh ? '，現在我會說' : '; now I would say ') + after.value.trim(),
              side: 'absent',
            });
            toast(t('posted'));
          },
        }, t('post')),
      ]),
    ]),
  ]));
}

/* ============================================================
   把禁用字與抽象詞標出來。
   一次掃出所有命中區間，長的優先、重疊時先標禁用字，
   再依區間切段組 HTML，避免在已插入的標籤裡再次比對。
   ============================================================ */
function reEsc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function markUp(txt, banned, vague) {
  const hitsB = [], hitsV = [];
  const spans = [];

  const scan = (words, cls, bucket) => {
    words.forEach(w => {
      const re = new RegExp(reEsc(w), 'gi');
      let m, found = false;
      while ((m = re.exec(txt)) !== null) {
        if (m[0].length === 0) { re.lastIndex++; continue; }
        spans.push({ s: m.index, e: m.index + m[0].length, cls, len: m[0].length });
        found = true;
      }
      if (found) bucket.push(w);
    });
  };
  scan(banned, 'banned', hitsB);
  scan(vague, 'vague', hitsV);

  // 禁用字優先，其次取較長的命中，然後丟掉重疊的
  spans.sort((a, b) =>
    a.s - b.s ||
    (a.cls === 'banned' ? -1 : 1) - (b.cls === 'banned' ? -1 : 1) ||
    b.len - a.len);

  const keep = [];
  let cursor = 0;
  for (const sp of spans) {
    if (sp.s < cursor) continue;
    keep.push(sp);
    cursor = sp.e;
  }

  let html = '', at = 0;
  for (const sp of keep) {
    html += esc(txt.slice(at, sp.s));
    html += `<mark class="${sp.cls}">${esc(txt.slice(sp.s, sp.e))}</mark>`;
    at = sp.e;
  }
  html += esc(txt.slice(at));
  return { html, hitsB, hitsV };
}
