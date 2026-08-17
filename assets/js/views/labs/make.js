/* Task 0 畫路線　／　Task 9 做東西　／　Task 10 交換測試與投票 */
import { h, clear, eyebrow, field, toast, debounce, uid } from '../../ui.js';
import { t, getLang } from '../../i18n.js';
import { saveWork, myWork, allWork, castVote, voteTally, subscribe, state } from '../../store.js';

/* ============================================================
   Task 0 — 畫一條線，寫下你現在的想法
   ============================================================ */
export function route(root) {
  const zh = getLang() === 'zh';
  const saved = myWork('t0') || {};
  const offs = [];

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow('TASK 0 · ' + (zh ? '我一開始以為' : 'WHAT I THOUGHT AT THE START')),
    h('h1.ask.ask--wide', { text: zh
      ? '水從哪裡開始，怎麼跑到你家水龍頭？'
      : 'Where does the water start, and how does it reach your tap?' }),
    h('p.lede', { text: zh
      ? '不准查手機。用你現在腦袋裡有的東西畫。畫錯沒關係——第六節我們會回頭看這張。'
      : 'No phones. Draw from what you know right now. Being wrong is fine; we come back to this in session six.' }),
  ]));

  /* ---------- 白畫布 ---------- */
  const W = 1600, H = 1000;
  const cv = h('canvas.draw__paper', { width: W, height: H });
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const white = () => { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H); };
  white();

  const strokes = [];      // 每一筆：{ c, w, pts }
  let redo = [];
  let cur = null;
  let ink = '#14313F';
  let size = 5;

  const redraw = () => {
    white();
    strokes.forEach(st => {
      ctx.strokeStyle = st.c;
      ctx.lineWidth = st.w;
      ctx.globalCompositeOperation = st.c === 'erase' ? 'destination-out' : 'source-over';
      if (st.c === 'erase') ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.beginPath();
      st.pts.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
      if (st.pts.length === 1) ctx.lineTo(st.pts[0].x + .1, st.pts[0].y);
      ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';
  };

  const pos = e => {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  };

  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId);
    cur = { c: ink, w: size * (ink === 'erase' ? 4 : 1), pts: [pos(e)] };
    strokes.push(cur); redo = [];
    redraw();
  });
  cv.addEventListener('pointermove', e => {
    if (!cur) return;
    cur.pts.push(pos(e));
    redraw();
  });
  const endStroke = () => { if (cur) { cur = null; autosave(); } };
  cv.addEventListener('pointerup', endStroke);
  cv.addEventListener('pointercancel', endStroke);
  cv.addEventListener('pointerleave', endStroke);

  /* ---------- 工具 ---------- */
  const INKS = [
    { c: '#14313F', zh: '水路', en: 'Water' },
    { c: '#D97742', zh: '人蓋的', en: 'Built' },
    { c: '#1B6B80', zh: '不確定', en: 'Unsure' },
    { c: '#2E8B6F', zh: '田地', en: 'Fields' },
    { c: 'erase',   zh: '橡皮擦', en: 'Eraser' },
  ];
  const inkBtns = INKS.map(i => h('button.draw__ink', {
    type: 'button',
    'aria-pressed': String(i.c === ink),
    title: zh ? i.zh : i.en,
    style: i.c === 'erase'
      ? { background: 'repeating-conic-gradient(#eee 0 25%, #fff 0 50%) 0/10px 10px' }
      : { background: i.c },
    onclick: () => {
      ink = i.c;
      inkBtns.forEach(b => b.setAttribute('aria-pressed', String(b.title === (zh ? i.zh : i.en))));
    },
  }));

  const sizeBtns = [3, 5, 10, 18].map(n => h('button.btn.btn--sm', {
    type: 'button', 'aria-pressed': String(n === size),
    onclick: e => {
      size = n;
      [...e.target.parentElement.children].forEach(b => b.setAttribute('aria-pressed', String(b === e.target)));
    },
  }, String(n)));

  const tools = h('.draw__tools', [
    ...inkBtns,
    h('span', { style: { width: '1px', height: '24px', background: 'var(--rule-paper)' } }),
    h('.draw__size', sizeBtns),
    h('span.grow'),
    h('button.btn.btn--sm', {
      type: 'button',
      onclick: () => { if (strokes.length) { redo.push(strokes.pop()); redraw(); autosave(); } },
    }, zh ? '退一步' : 'Undo'),
    h('button.btn.btn--sm', {
      type: 'button',
      onclick: () => { if (redo.length) { strokes.push(redo.pop()); redraw(); autosave(); } },
    }, zh ? '再做一次' : 'Redo'),
    h('button.btn.btn--sm.btn--ghost', {
      type: 'button',
      onclick: () => {
        if (!confirm(zh ? '整張清掉？' : 'Clear the whole thing?')) return;
        strokes.length = 0; redo = []; redraw(); autosave();
      },
    }, zh ? '清空' : 'Clear'),
  ]);

  /* ---------- 上傳照片（畫在紙上的人）---------- */
  const file = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
  file.addEventListener('change', () => {
    const f = file.files[0]; if (!f) return;
    const img = new Image();
    img.onload = () => {
      strokes.length = 0; redo = [];
      white();
      const sc = Math.min(W / img.width, H / img.height);
      ctx.drawImage(img, (W - img.width * sc) / 2, (H - img.height * sc) / 2, img.width * sc, img.height * sc);
      // 照片直接當底圖，之後的筆畫疊在上面
      baseImage = cv.toDataURL('image/jpeg', 0.82);
      autosave();
      toast(zh ? '照片放上去了，可以直接在上面畫' : 'Photo added; draw on top of it');
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(f);
    file.value = '';
  });
  let baseImage = saved.base || null;

  if (baseImage) {
    const im = new Image();
    im.onload = () => { ctx.drawImage(im, 0, 0, W, H); redrawWithBase(); };
    im.src = baseImage;
  }
  function redrawWithBase() {
    if (!baseImage) { redraw(); return; }
    const im = new Image();
    im.onload = () => {
      white();
      ctx.drawImage(im, 0, 0, W, H);
      strokes.forEach(st => {
        ctx.strokeStyle = st.c === 'erase' ? 'rgba(0,0,0,1)' : st.c;
        ctx.lineWidth = st.w;
        ctx.globalCompositeOperation = st.c === 'erase' ? 'destination-out' : 'source-over';
        ctx.beginPath();
        st.pts.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
        ctx.stroke();
      });
      ctx.globalCompositeOperation = 'source-over';
    };
    im.src = baseImage;
  }

  /* ---------- 存與繳交 ---------- */
  const line = h('textarea.textarea', {
    value: saved.line || '',
    placeholder: zh ? '加一句話說明你畫的東西' : 'One sentence about what you drew',
  });
  const status = h('span.mono', { style: { fontSize: 'var(--t-micro)', color: 'var(--on-paper-2)' } });

  const png = () => cv.toDataURL('image/jpeg', 0.75);

  const autosave = debounce(() => {
    saveWork('t0', { img: png(), line: line.value, base: baseImage, submitted: !!saved.submitted });
    status.textContent = zh ? '草稿已存' : 'Draft saved';
  }, 900);
  line.addEventListener('input', autosave);

  const submit = () => {
    if (!strokes.length && !baseImage) { toast(zh ? '還沒畫東西' : 'Nothing drawn yet'); return; }
    if (!state.me.name) { toast(zh ? '先在觀點畫布填你的名字' : 'Set your name on the canvas first'); return; }
    saved.submitted = true;
    saveWork('t0', { img: png(), line: line.value, base: baseImage, submitted: true, submittedAt: Date.now() });
    status.textContent = zh ? '已繳交' : 'Handed in';
    toast(zh ? '交出去了，全班看得到' : 'Handed in; the class can see it');
    paintGallery();
  };

  root.append(h('section.wrap--wide.section--tight', [
    h('.paper.stack', [
      h('.row.row--between', [
        h('p.task__id', { text: zh ? '在這張白紙上畫' : 'DRAW ON THIS SHEET' }),
        h('.row.row--tight', [
          status,
          h('button.btn.btn--sm', { type: 'button', onclick: () => file.click() },
            zh ? '改上傳照片' : 'Upload a photo'),
          file,
        ]),
      ]),
      tools,
      cv,
      field(zh ? '你的一句話' : 'Your sentence', line),
      h('.doneline', { data: { done: String(!!saved.submitted) } }, [
        h('.doneline__dot'),
        h('span', { text: zh ? '畫出了一個起點，不能只寫「水庫」' : 'A starting point is drawn, not just "a reservoir"' }),
      ]),
      h('.row', [
        h('button.btn.btn--primary', { type: 'button', onclick: submit }, zh ? '繳交' : 'Hand in'),
        h('button.btn', {
          type: 'button',
          onclick: () => {
            const a = document.createElement('a');
            a.href = cv.toDataURL('image/png');
            a.download = `我畫的水路-${state.me.name || 'me'}.png`;
            document.body.append(a); a.click(); a.remove();
          },
        }, zh ? '下載我的圖' : 'Download'),
      ]),
    ]),
  ]));

  /* ---------- 全班交了什麼 ---------- */
  const gallery = h('section.wrap--wide.section--tight.stack');
  root.append(gallery);

  function paintGallery() {
    clear(gallery);
    const rows = allWork('t0').filter(w => w.submitted && w.img);
    gallery.append(eyebrow(zh ? `全班交上來的　${rows.length}` : `HANDED IN · ${rows.length}`));
    if (!rows.length) {
      gallery.append(h('p.note-line', { text: zh
        ? '還沒有人交。第一張交上來的，之後回頭看會最有感覺。'
        : 'Nothing handed in yet.' }));
      return;
    }
    gallery.append(h('.draw__gallery', rows.map(w => h('.draw__card', [
      h('img', { src: w.img, alt: '', loading: 'lazy' }),
      h('p.mono', { style: { margin: 0, fontSize: 'var(--t-micro)', color: 'var(--fg-3)' },
                    text: `${w.name || (zh ? '匿名' : 'anon')}${w.group ? '・' + w.group : ''}` }),
      w.line ? h('p', { style: { margin: 0, fontSize: 'var(--t-xs)', lineHeight: 1.5 }, text: w.line }) : null,
    ].filter(Boolean)))));
    gallery.append(h('p.note-line', { text: zh
      ? '每個人畫的都不一樣。等到第六節，你會知道自己漏掉了哪一段。'
      : 'Everyone drew it differently. By session six you will know which stretch you left out.' }));
  }

  paintGallery();
  offs.push(subscribe(w => { if (w === 'work') paintGallery(); }));

  // 還原先前的畫
  if (saved.img && !baseImage) {
    const im = new Image();
    im.onload = () => { white(); ctx.drawImage(im, 0, 0, W, H); baseImage = saved.img; };
    im.src = saved.img;
  }
  if (saved.submitted) status.textContent = zh ? '已繳交' : 'Handed in';

  return () => offs.forEach(fn => fn());
}

/* ============================================================
   Task 9 — 做一個東西出來
   ============================================================ */
const SUBJECTS = [
  { id: 'social',  zh: '社會', en: 'Social studies', eg: { zh: '流域圖、集水區界線、行政區、水的歷史', en: 'basin maps, catchment boundaries, district lines, water history' } },
  { id: 'science', zh: '自然', en: 'Science',        eg: { zh: '水質等級、水循環、處理方式、材料會不會分解', en: 'water quality grades, the water cycle, treatment, whether a material breaks down' } },
  { id: 'math',    zh: '數學', en: 'Mathematics',    eg: { zh: '比例尺、單位換算、蓄水量圖表、成本與定價', en: 'map scale, unit conversion, storage graphs, costing and pricing' } },
  { id: 'art',     zh: '美術', en: 'Art',            eg: { zh: '顏色、構圖、字體、版面', en: 'colour, composition, type, layout' } },
  { id: 'tech',    zh: '科技', en: 'Technology',     eg: { zh: '選材、怎麼做出來、包裝結構', en: 'material choice, how it is made, packaging structure' } },
  { id: 'lang',    zh: '國文', en: 'Language',       eg: { zh: '名字、文案、說明卡', en: 'the name, the copy, the card' } },
];

const IDEAS = [
  { zh: '借據明信片', en: 'Loan-note postcard', d: { zh: '正面是攔河堰，背面是一張空白借據，讓收到的人自己填。', en: 'The weir on the front. On the back, a blank loan note.' } },
  { zh: '一套六張',   en: 'A set of six',       d: { zh: '一次借水一張。第六張是空白的。', en: 'One for each borrowing. The sixth is blank.' } },
  { zh: '年份杯墊',   en: 'Year coaster',       d: { zh: '一個年份，一個數字。不解釋。', en: 'A single year and a single number. No explanation.' } },
  { zh: '空白徽章',   en: 'Blank badge',        d: { zh: '完全沒有圖。卡片上寫：還沒有人替他說話。', en: 'No image. The card reads: nobody speaks for this one yet.' } },
];

export function make(root) {
  const zh = getLang() === 'zh';
  const saved = myWork('t9') || {};
  let used = saved.used || {};

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow('TASK 9 · ' + (zh ? '做東西' : 'MAKE SOMETHING')),
    h('h1.ask.ask--wide', { text: zh
      ? '拿到它的人要問出一個問題，而不是覺得新竹好漂亮。'
      : 'It should make whoever holds it ask a question, not think Hsinchu looks nice.' }),
    h('p.note-line', { text: zh ? '好看是附加的，不是重點。' : 'Looking good is a bonus, not the point.' }),
  ]));

  /* ---- 跨科檢核 ---- */
  const subjBox = h('.stack-sm');
  const count = h('span.pill');
  const paintSubjects = () => {
    clear(subjBox);
    SUBJECTS.forEach(s => {
      const on = !!(used[s.id] && used[s.id].trim());
      const ta = h('input.input', {
        value: used[s.id] || '',
        placeholder: zh ? `我把${s.zh}用在……` : `I used ${s.en} for...`,
      });
      ta.addEventListener('input', () => { used[s.id] = ta.value; autosave(); refreshCount(); });
      subjBox.append(h('.row', { style: { gap: 'var(--s3)', alignItems: 'flex-start' } }, [
        h('div', { style: { minWidth: '104px' } }, [
          h('p', { style: { margin: 0, fontWeight: '700', fontSize: 'var(--t-sm)', color: on ? 'var(--water)' : 'var(--on-paper)' },
                   text: zh ? s.zh : s.en }),
          h('p', { style: { margin: 0, fontSize: '11px', color: 'var(--on-paper-2)', lineHeight: 1.4 }, text: zh ? s.eg.zh : s.eg.en }),
        ]),
        h('span.grow', [ta]),
      ]));
    });
  };
  const refreshCount = () => {
    const n = SUBJECTS.filter(s => (used[s.id] || '').trim()).length;
    count.textContent = `${n} / 3`;
    count.dataset.tone = n >= 3 ? 'live' : 'clay';
    doneline.dataset.done = String(n >= 3);
  };

  const card = h('textarea.textarea.textarea--tall', { value: saved.card || '', placeholder: zh ? '一百字，說明這個東西在講什麼。' : 'A hundred words on what this object is about.' });
  const omits = h('textarea.textarea', { value: saved.omits || '', placeholder: zh ? '這個東西把誰留在外面？' : 'Who does this object leave out?' });
  const doneline = h('.doneline', [h('.doneline__dot'),
    h('span', { text: zh ? '三個科目都指得出用在哪' : 'All three subjects located' })]);

  const autosave = debounce(() => saveWork('t9', { used, card: card.value, omits: omits.value }), 700);
  [card, omits].forEach(el => el.addEventListener('input', autosave));

  paintSubjects();

  root.append(h('section.wrap--wide.section--tight', [
    h('.paper.stack', [
      h('.row.row--between', [
        h('p.task__id', { text: zh ? '至少用到三個科目，寫下用在哪裡' : 'AT LEAST THREE SUBJECTS' }),
        count,
      ]),
      subjBox,
      doneline,
    ]),
  ]));

  root.append(h('section.wrap--wide.section--tight', [
    h('.paper.stack', [
      h('p.task__id', { text: 'TASK 9-2 · ' + (zh ? '說明卡' : 'THE CARD') }),
      field(zh ? '這個東西在講什麼（一百字）' : 'What this object is about', card),
      field(zh ? '它把誰留在外面' : 'Who it leaves out', omits, zh ? '這一欄是完成標準' : 'Done-when'),
      h('.row', [h('button.btn.btn--primary', { type: 'button', onclick: () => { autosave(); toast(t('saved')); } }, t('save'))]),
    ]),
  ]));

  root.append(h('section.wrap--wide.section--tight.stack', [
    eyebrow(zh ? '沒靈感的話' : "IF YOU'RE SHORT OF IDEAS"),
    h('.cols-2', IDEAS.map(i => h('.card', [
      h('p.card__title', { text: zh ? i.zh : i.en }),
      h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh ? i.d.zh : i.d.en }),
    ]))),
    h('p.note-line', { text: zh
      ? '最後一個吵最兇，也最看得出誰真的懂了這門課。'
      : 'The last one starts the most arguments, and shows most clearly who understood the course.' }),
  ]));

  refreshCount();
}

/* ============================================================
   Task 10-1／10-2 交換測試
   ============================================================ */
export function testing(root) {
  const zh = getLang() === 'zh';
  const saved = myWork('t10') || {};
  let tests = saved.tests || [{ id: uid('t'), who: '', said: '' }];

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow('TASK 10 · ' + (zh ? '交換測試' : 'EXCHANGE TEST')),
    h('h1.ask.ask--wide', { text: zh ? '沒上過這門課的人，看得懂嗎？' : 'Can someone who never took this course understand it?' }),
    h('p.note-line', { text: zh ? '看不懂就是還沒做完。那不是他的問題。' : "If they can't, it isn't finished. That is not their fault." }),
  ]));

  const list = h('.stack');
  const paint = () => {
    clear(list);
    tests.forEach((tst, i) => {
      const who = h('input.input', { value: tst.who, placeholder: zh ? '誰（別班、家人、老師）' : 'Who (another class, family, teacher)' });
      const said = h('textarea.textarea', { value: tst.said, placeholder: zh ? '他一字不改說了什麼' : 'Their exact words' });
      who.addEventListener('input', () => { tst.who = who.value; autosave(); });
      said.addEventListener('input', () => { tst.said = said.value; autosave(); });
      list.append(h('.card', { style: { background: '#fff', borderColor: 'var(--rule-paper)' } }, [
        h('.row.row--between', [
          h('p.task__id', { text: `${zh ? '測試' : 'TEST'} ${i + 1}` }),
          tests.length > 1 ? h('button.btn.btn--sm.btn--ghost', {
            type: 'button', onclick: () => { tests = tests.filter(x => x.id !== tst.id); paint(); autosave(); },
          }, t('delete')) : null,
        ].filter(Boolean)),
        who, said,
      ]));
    });
    list.append(h('button.btn.btn--sm', {
      type: 'button', onclick: () => { tests = [...tests, { id: uid('t'), who: '', said: '' }]; paint(); },
    }, zh ? '再加一位測試者' : 'Add another tester'));
    doneline.dataset.done = String(tests.filter(x => x.said.trim()).length >= 3);
  };

  const misread = h('textarea.textarea', { value: saved.misread || '', placeholder: zh ? '他們誤讀了什麼？' : 'What did they misread?' });
  const whose = h('textarea.textarea', { value: saved.whose || '', placeholder: zh ? '那是東西的問題，還是文案的問題？' : "Is that the object's problem or the copy's?" });
  const revised = h('textarea.textarea', { value: saved.revised || '', placeholder: zh ? '改完之後變成什麼樣' : 'What it became after revising' });

  const doneline = h('.doneline', [h('.doneline__dot'),
    h('span', { text: zh ? '三個人的原話都記下來了' : "Three people's exact words" })]);

  const autosave = debounce(() => saveWork('t10', {
    tests, misread: misread.value, whose: whose.value, revised: revised.value,
  }), 700);
  [misread, whose, revised].forEach(el => el.addEventListener('input', autosave));

  paint();

  root.append(h('section.wrap--wide.section--tight', [
    h('.paper.stack', [
      h('p.task__id', { text: 'TASK 10-1 · ' + (zh ? '不要解釋，只問一句：你覺得這在講什麼？' : 'Ask one question only') }),
      list,
      doneline,
    ]),
  ]));

  root.append(h('section.wrap--wide.section--tight', [
    h('.paper.stack', [
      h('p.task__id', { text: 'TASK 10-2 · ' + (zh ? '回去改' : 'GO BACK AND REVISE') }),
      field(zh ? '被誤讀的是什麼' : 'What was misread', misread),
      field(zh ? '是東西的問題還是文案的問題' : "Object's problem or copy's", whose),
      field(zh ? '改完之後' : 'After revising', revised),
      h('.row', [h('button.btn.btn--primary', { type: 'button', onclick: () => { autosave(); toast(t('saved')); } }, t('save'))]),
    ]),
  ]));
}

/* ============================================================
   Task 10-3 如果只能留一個
   ============================================================ */
export function ballot(root) {
  const zh = getLang() === 'zh';
  const saved = myWork('t10-3') || {};
  const offs = [];

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow('TASK 10-3 · ' + (zh ? '投票' : 'BALLOT')),
    h('h1.ask.ask--wide', { text: zh ? '如果只能留一個代表新竹，你留誰的？' : 'If one had to represent Hsinchu, whose would you keep?' }),
    h('p.note-line', { text: zh ? '「比較好看」不算理由。' : '"It looks best" is not a reason.' }),
  ]));

  const box = h('section.wrap--wide.section--tight.stack');
  const reason = h('textarea.textarea', { value: saved.reason || '', placeholder: zh ? '我投它，是因為……（不能講外觀）' : 'I voted for it because... (not appearance)' });
  reason.addEventListener('input', debounce(() => saveWork('t10-3', { reason: reason.value }), 700));

  const paint = () => {
    clear(box);
    // 候選＝所有交了說明卡的人
    const makers = allWork('t9').filter(w => (w.card || '').trim());
    const { tally, total, mine } = voteTally('keep-one');

    if (!makers.length) {
      box.append(h('p.muted', { text: zh ? '還沒有人交說明卡。' : 'No cards handed in yet.' }));
      return;
    }

    box.append(eyebrow(zh ? '候選' : 'CANDIDATES'), h('.cols-2', makers.map(w => {
      const key = w.by;
      const n = tally[key] || 0;
      const pct = total ? Math.round(n / total * 100) : 0;
      return h('button.role', {
        type: 'button', 'aria-pressed': String(mine === key),
        onclick: () => castVote('keep-one', key),
      }, [
        h('span.role__n', { text: `${w.name || (zh ? '匿名' : 'anon')}${w.group ? '・' + w.group : ''}` }),
        h('span.role__want', { text: (w.card || '').slice(0, 90) }),
        h('.meter', [h('.meter__fill', { style: { width: pct + '%' } })]),
        h('span.role__n', { style: { color: 'var(--clay-lit)' }, text: `${n} ${zh ? '票' : 'votes'}　${pct}%` }),
      ]);
    })));

    if (total) {
      const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
      const w = makers.find(m => m.by === top[0]);
      box.append(h('.card.card--clay', [
        h('p.card__title', { text: zh ? '得票最高的那組要回答' : 'The group with the most votes answers' }),
        h('p', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
          ? `${w ? (w.name || '該組') : '該組'}：你的東西把誰留在外面？`
          : `${w ? (w.name || 'That group') : 'That group'}: who does yours leave out?` }),
        w && w.omits ? h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: '→ ' + w.omits }) : null,
      ].filter(Boolean)));
    }

    box.append(h('.paper.stack', [
      h('p.task__id', { text: zh ? '你的理由' : 'YOUR REASON' }),
      reason,
      h('.doneline', { data: { done: String(!!reason.value.trim()) } }, [
        h('.doneline__dot'), h('span', { text: zh ? '理由跟外觀無關' : 'The reason is not about appearance' }),
      ]),
    ]));
  };

  root.append(box);
  paint();
  offs.push(subscribe(w => { if (w === 'votes' || w === 'work') paint(); }));
  return () => offs.forEach(fn => fn());
}
