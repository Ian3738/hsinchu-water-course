/* ============================================================
   引水模擬 — 上坪溪 → 攔河堰 → 竹東大圳 → 寶山水庫 → 水龍頭
   這是教學模型，不是水文推估：流量以相對比例呈現，
   目的是讓「取走多少、下游剩多少」看得見，不是預測真實流量。
   ============================================================ */
import { h, clear, eyebrow, throttle, toast, field, debounce } from '../../ui.js';
import { L, t, getLang } from '../../i18n.js';
import { addNote, saveWork, myWork, allWork, subscribe, state } from '../../store.js';
import { speak } from '../../agent.js';
import { SLOTS } from '../../../data/personas.js';

const NS = 'http://www.w3.org/2000/svg';

/* 路徑：viewBox 1000×560 */
const PATHS = {
  upper:      'M -20,96 C 120,110 210,168 318,214',
  canal:      'M 352,206 L 700,206',
  downstream: 'M 352,246 C 430,318 520,372 636,410 C 752,446 860,462 1020,470',
  pipe:       'M 828,262 L 906,262',
};

const NODES = [
  { id: 'shangping', x: 60,  y: 60,  zh: '上坪溪',     en: 'SHANGPING RIVER' },
  { id: 'weir',      x: 300, y: 150, zh: '上坪攔河堰', en: 'SHANGPING WEIR' },
  { id: 'canal',     x: 470, y: 178, zh: '竹東大圳',   en: 'ZHUDONG CANAL' },
  { id: 'baoshan',   x: 700, y: 176, zh: '寶山水庫',   en: 'BAOSHAN RESERVOIR' },
  { id: 'tap',       x: 880, y: 320, zh: '你家水龍頭', en: 'YOUR TAP' },
  { id: 'down',      x: 560, y: 466, zh: '下游',       en: 'DOWNSTREAM' },
];

export default function flow(root) {
  const zh = getLang() === 'zh';
  let ratio = 0.55;          // 取水比例
  let raf = null;

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow(zh ? '模擬・引水' : 'SIMULATION · DIVERSION'),
    h('h1.ask.ask--wide', { text: zh ? '取走多少，下游就少多少' : 'What you take is what the river loses' }),
    h('p.lede', { text: t('simHint') }),
  ]));

  /* ---------- 舞台 ---------- */
  const canvas = h('canvas');
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'sim__svg');
  svg.setAttribute('viewBox', '0 0 1000 560');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  const stage = h('.sim__stage', [canvas, svg]);

  /* ---------- 控制面板 ---------- */
  const valEl = h('span.slider__val', { text: '55%' });
  const range = h('input', {
    type: 'range', min: '0', max: '100', value: '55',
    'aria-label': t('diversion'),
  });
  const readout = h('.readout');

  const panel = h('.sim__panel', [
    h('.slider', [
      h('.slider__top', [h('span.slider__label', { text: t('diversion') }), valEl]),
      range,
      h('p', { class: 'muted', style: { fontSize: 'var(--t-micro)', margin: 0 },
               text: zh ? '攔河堰把多少比例的水引進大圳' : 'Share of the flow taken into the canal' }),
    ]),
    readout,
  ]);

  root.append(h('section.wrap--wide.section--tight', [h('.sim', [stage, panel])]));

  /* ---------- 說明 ---------- */
  root.append(h('section.wrap--wide.section--tight.stack', [
    h('.cols-2', [
      h('.card', [
        h('p.card__title', { text: zh ? '這個模型在算什麼' : 'What this model computes' }),
        h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
          ? '把上坪溪的流量當成 100 份。你拉走幾份，下游就少幾份。大圳的水先供灌溉，剩下的進寶山水庫，水庫再分給園區和家戶。'
          : 'Treat the Shangping flow as 100 parts. What you divert is what downstream loses. The canal serves irrigation first; the remainder fills Baoshan Reservoir, which then splits between the science park and households.' }),
      ]),
      h('.card.card--clay', [
        h('p.card__title', { text: zh ? '這個模型不算什麼' : 'What it does not' }),
        h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
          ? '這不是真實流量推估。真實的取水受降雨、季節、水權與調度影響，數字要去水利署查。這裡只讓取捨看得見。'
          : 'This is not a hydrological estimate. Real diversion depends on rainfall, season, water rights and scheduling. Look those up. This only makes the trade-off visible.' }),
      ]),
    ]),
    h('.card', [
      h('p.card__title', { text: zh ? '拉到底看看' : 'Try both ends' }),
      h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
        ? '拉到 0%：園區和你家沒有水。拉到 100%：下游沒有水。這門課要問的，是中間那條線該畫在哪裡，以及誰有資格畫。'
        : 'At 0% the park and your home get nothing. At 100% the river below gets nothing. The course asks where the line between them belongs, and who gets to draw it.' }),
    ]),
  ]));

  /* ============================================================
     模擬完不是就結束了。這組數字要能拿去吵架、拿去問人、跟全班比。
     ============================================================ */
  const bridge = h('section.wrap--wide.section--tight.stack');
  root.append(bridge);

  /** 目前設定的一句話描述，貼到畫布與問 agent 都用它 */
  const describe = () => zh
    ? `我把取水設成 ${Math.round(ratio * 100)}%：下游剩 ${fmt(m.down)} 份，灌溉 ${fmt(m.irrigation)}／${m.irrigationNeed}，園區 ${fmt(m.park)}／${m.parkNeed}，${m.fish ? '魚還上得去' : '魚上不去'}。`
    : `I set diversion to ${Math.round(ratio * 100)}%: ${fmt(m.down)} left downstream, irrigation ${fmt(m.irrigation)}/${m.irrigationNeed}, park ${fmt(m.park)}/${m.parkNeed}, fish ${m.fish ? 'can' : 'cannot'} pass.`;

  const reason = h('textarea.textarea', {
    placeholder: zh ? '我為什麼把線畫在這裡……' : 'Why I drew the line here...',
  });

  /* ---- 問未在場者 ---- */
  const askable = SLOTS.filter(x => ['river', 'farmers'].includes(x.id));
  const chat = h('.chat', { style: { maxHeight: '220px' } });

  const askSlot = async slot => {
    chat.append(h('.bubble.bubble--me', { text: describe() }));
    const wait = h('.bubble.bubble--agent', [h('.typing', [h('span'), h('span'), h('span')])]);
    chat.append(wait); chat.scrollTop = chat.scrollHeight;
    const { text } = await speak(slot.id, '', [], m);
    wait.remove();
    chat.append(h('.bubble.bubble--agent', [
      h('p', { style: { margin: 0 }, text: text }),
      h('p', { style: { margin: '4px 0 0', fontSize: '10px', opacity: .7, fontStyle: 'italic' },
               text: L(slot.who) }),
    ]));
    chat.scrollTop = chat.scrollHeight;
  };

  /* ---- 全班的設定 ---- */
  const classBox = h('.stack-sm');
  const paintClass = () => {
    clear(classBox);
    const rows = allWork('sim-flow').filter(w => typeof w.ratio === 'number');
    if (!rows.length) {
      classBox.append(h('p.muted', { style: { fontSize: 'var(--t-sm)' },
        text: zh ? '還沒有人存設定。存一組上來，才比得出誰把線畫在哪裡。' : 'No settings saved yet.' }));
      return;
    }
    // 分佈：每 10% 一格
    const bins = Array(10).fill(0);
    rows.forEach(w => { bins[Math.min(9, Math.floor(w.ratio * 10))]++; });
    const max = Math.max(...bins);
    classBox.append(
      h('.row', { style: { alignItems: 'flex-end', gap: '4px', height: '84px' } },
        bins.map((n, k) => h('div', { style: { flex: '1', display: 'grid', gap: '4px', alignContent: 'end' } }, [
          h('div', {
            style: {
              height: (n ? 12 + (n / max) * 58 : 2) + 'px',
              background: n ? 'linear-gradient(180deg, var(--water-lit), var(--water-dim))' : 'var(--rule)',
              borderRadius: '2px',
            },
            title: `${k * 10}–${k * 10 + 10}%：${n}`,
          }),
          h('p.mono', { style: { margin: 0, fontSize: '9px', color: 'var(--fg-3)', textAlign: 'center' },
                        text: String(k * 10) }),
        ]))),
      h('p.muted', { style: { fontSize: 'var(--t-xs)', margin: 0 },
        text: zh ? `${rows.length} 組設定・橫軸是取水比例` : `${rows.length} settings · x-axis is diversion ratio` }),
      h('.stack-sm', rows.slice(-6).reverse().map(w => h('.card', { style: { padding: 'var(--s3)' } }, [
        h('.row.row--between', [
          h('span.mono', { style: { color: 'var(--clay-lit)', fontSize: 'var(--t-sm)' }, text: Math.round(w.ratio * 100) + '%' }),
          h('span.muted', { style: { fontSize: 'var(--t-xs)' }, text: `${w.name || (zh ? '匿名' : 'anon')}${w.group ? '・' + w.group : ''}` }),
        ]),
        w.reason ? h('p', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: w.reason }) : null,
      ].filter(Boolean)))),
    );
  };

  bridge.append(
    eyebrow(zh ? '用這組數字做點事' : 'DO SOMETHING WITH THIS'),
    h('.cols-2', [
      /* 左：存下來、貼上畫布 */
      h('.paper.stack', [
        h('p.task__id', { text: zh ? '把你的線交出來' : 'HAND IN YOUR LINE' }),
        h('p', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
          ? '拉到你覺得說得過去的位置，寫下理由。存下來之後，全班就看得到你把線畫在哪。'
          : 'Set it where you can defend, then say why. Once saved, the class can see where you drew the line.' }),
        field(zh ? '理由' : 'Why', reason),
        h('.row', [
          h('button.btn.btn--primary', {
            type: 'button',
            onclick: () => {
              saveWork('sim-flow', { ratio, reason: reason.value, readout: describe() });
              toast(zh ? '存好了，全班看得到' : 'Saved for the class');
              paintClass();
            },
          }, zh ? '存下設定' : 'Save setting'),
          h('button.btn', {
            type: 'button',
            onclick: () => {
              if (!reason.value.trim()) { toast(zh ? '先寫理由，不然畫布上只有數字' : 'Write your reason first'); return; }
              addNote({
                who: zh ? '我的取水方案' : 'My diversion plan',
                cares: zh ? '取水比例' : 'DIVERSION',
                body: describe() + ' ' + reason.value.trim(),
                side: 'for',
              });
              toast(t('posted'));
            },
          }, zh ? '貼到觀點畫布' : 'Post to the canvas'),
        ]),
      ]),

      /* 右：拿這組數字去問人 */
      h('.card.stack-sm', [
        h('p.card__title', { text: zh ? '拿這組數字去問他們' : 'Ask them about this setting' }),
        h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
          ? '他們只會講這組數字會讓自己變成什麼樣，不會說你對或錯。'
          : 'They will only say what this setting does to them. They will not say you are right or wrong.' }),
        h('.row.row--tight', askable.map(slot => h('button.btn.btn--sm', {
          type: 'button', onclick: () => askSlot(slot),
        }, L(slot.who)))),
        chat,
      ]),
    ]),

    /* 全班 */
    h('.card.stack-sm', [
      h('p.card__title', { text: zh ? '全班把線畫在哪裡' : 'Where the class drew the line' }),
      classBox,
    ]),
  );

  paintClass();
  const offClass = subscribe(w => { if (w === 'work') paintClass(); });

  /* ---------- 計算 ---------- */
  function model(r) {
    const total = 100;
    const diverted = total * r;
    const down = total - diverted;
    const irrigationNeed = 28;                          // 大圳灌溉的基本需求
    const irrigation = Math.min(diverted, irrigationNeed);
    const toReservoir = Math.max(0, diverted - irrigation);
    const parkNeed = 42;
    const park = Math.min(toReservoir, parkNeed);
    const household = Math.max(0, toReservoir - park);
    const storage = Math.min(100, toReservoir / 0.7);    // 蓄水位（相對）
    return {
      diverted, down, irrigation, irrigationNeed,
      park, parkNeed, household, storage,
      fish: down >= 20,
      bed: down < 10,
    };
  }

  function paintReadout(m) {
    clear(readout);
    const rows = [
      { k: t('downstream'), v: fmt(m.down), pct: m.down,
        state: m.down < 10 ? 'bad' : m.down < 20 ? 'warn' : 'ok' },
      { k: t('irrigation'), v: fmt(m.irrigation) + ` / ${m.irrigationNeed}`, pct: m.irrigation / m.irrigationNeed * 100,
        state: m.irrigation < m.irrigationNeed ? 'bad' : 'ok' },
      { k: t('parkSupply'), v: fmt(m.park) + ` / ${m.parkNeed}`, pct: m.park / m.parkNeed * 100,
        state: m.park < m.parkNeed ? 'bad' : 'ok' },
      { k: t('household'), v: fmt(m.household), pct: m.household,
        state: m.household <= 0 ? 'bad' : 'ok' },
      { k: t('storage'), v: Math.round(m.storage) + '%', pct: m.storage, state: '' },
    ];
    rows.forEach(r => {
      readout.append(
        h('.readout__row', [
          h('span.readout__k', { text: r.k }),
          h('span.readout__v', { data: r.state ? { state: r.state } : {}, text: r.v }),
        ]),
        h('.meter', { style: { marginTop: '-6px', marginBottom: '2px' } },
          [h('.meter__fill', { style: { width: Math.max(0, Math.min(100, r.pct)) + '%' },
                               data: r.state === 'bad' ? { state: 'bad' } : {} })]),
      );
    });

    readout.append(h('.readout__row', { style: { borderBottom: '0', marginTop: 'var(--s2)' } }, [
      h('span.readout__k', { text: t('fishPassage') }),
      h('span.readout__v', { data: { state: m.fish ? 'ok' : 'bad' },
                             text: m.fish ? (zh ? '可以' : 'yes') : (zh ? '過不去' : 'no') }),
    ]));
    if (m.bed) {
      readout.append(h('p', {
        style: { fontSize: 'var(--t-xs)', color: 'var(--clay-lit)', margin: 0, fontStyle: 'italic' },
        text: zh ? '河床大面積裸露。' : 'Long stretches of bed are exposed.',
      }));
    }
  }

  const fmt = n => (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, '');

  /* ---------- SVG 靜態層 ---------- */
  const bands = {};
  function buildSvg() {
    clear(svg);

    // 底圖：地形線
    const ground = document.createElementNS(NS, 'path');
    ground.setAttribute('d', 'M -20,140 C 160,180 300,250 460,330 C 620,410 800,470 1020,500 L 1020,560 L -20,560 Z');
    ground.setAttribute('fill', 'rgba(154,178,188,.045)');
    svg.append(ground);

    // 水庫
    const res = document.createElementNS(NS, 'path');
    res.setAttribute('d', 'M 700,196 L 828,196 L 812,300 L 716,300 Z');
    res.setAttribute('fill', 'rgba(27,107,128,.30)');
    res.setAttribute('stroke', 'rgba(61,150,172,.55)');
    res.setAttribute('stroke-width', '1.5');
    svg.append(res);

    const resLevel = document.createElementNS(NS, 'rect');
    resLevel.setAttribute('x', '702'); resLevel.setAttribute('width', '124');
    resLevel.setAttribute('fill', 'rgba(61,150,172,.5)');
    svg.append(resLevel);
    bands.resLevel = resLevel;

    // 水帶
    ['upper', 'canal', 'downstream', 'pipe'].forEach(k => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', PATHS[k]);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', 'rgba(27,107,128,.5)');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-width', '14');
      svg.append(p);
      bands[k] = p;
    });

    // 攔河堰
    const weir = document.createElementNS(NS, 'g');
    weir.innerHTML = `
      <rect x="322" y="176" width="34" height="104" fill="rgba(8,32,44,.9)" stroke="rgba(154,178,188,.4)" stroke-width="1.5"/>
      <rect id="gate" x="332" y="188" width="14" height="60" rx="3" fill="#D97742"/>`;
    svg.append(weir);
    bands.gate = weir.querySelector('#gate');

    // 水龍頭
    const tap = document.createElementNS(NS, 'g');
    tap.innerHTML = `
      <rect x="906" y="238" width="10" height="34" fill="#9AB2BC"/>
      <rect x="898" y="230" width="34" height="10" rx="3" fill="#9AB2BC"/>
      <path d="M 916,272 l 0,14" stroke="#3D96AC" stroke-width="3" stroke-linecap="round"/>`;
    svg.append(tap);

    // 標籤：中文在上，英文小字在下（沿用視覺稿的雙行作法）
    NODES.forEach(n => {
      const g = document.createElementNS(NS, 'g');
      const zhT = document.createElementNS(NS, 'text');
      zhT.setAttribute('x', n.x); zhT.setAttribute('y', n.y);
      zhT.setAttribute('style', 'fill:var(--fg-2);font-size:17px;font-family:var(--f-display)');
      zhT.textContent = zh ? n.zh : n.en.replace(/\b\w/g, c => c.toUpperCase());
      const enT = document.createElementNS(NS, 'text');
      enT.setAttribute('x', n.x); enT.setAttribute('y', n.y + 15);
      enT.setAttribute('class', 'node-label');
      enT.textContent = zh ? n.en : n.zh;
      const val = document.createElementNS(NS, 'text');
      val.setAttribute('x', n.x); val.setAttribute('y', n.y + 32);
      val.setAttribute('class', 'node-val');
      val.setAttribute('id', 'v-' + n.id);
      g.append(zhT, enT, val);
      svg.append(g);
      bands['label-' + n.id] = val;
    });
  }

  /* ---------- 粒子 ---------- */
  const ctx = canvas.getContext('2d');
  let particles = [];
  let lens = {};

  function measure() {
    ['upper', 'canal', 'downstream', 'pipe'].forEach(k => {
      lens[k] = bands[k].getTotalLength();
    });
  }

  function seed() {
    particles = [];
    const make = (path, n) => {
      for (let i = 0; i < n; i++) {
        particles.push({ path, u: Math.random(), v: 0.0016 + Math.random() * 0.0022, r: 0.7 + Math.random() * 1.5 });
      }
    };
    make('upper', 130);
    make('canal', 140);
    make('downstream', 170);
    make('pipe', 26);
  }

  function resize() {
    const r = stage.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
  }

  /* SVG viewBox → 畫布座標 */
  function toCanvas(pt, rect) {
    const sx = rect.width / 1000, sy = rect.height / 560;
    const s = Math.min(sx, sy);
    const ox = (rect.width - 1000 * s) / 2, oy = (rect.height - 560 * s) / 2;
    return { x: pt.x * s + ox, y: pt.y * s + oy };
  }

  let m = model(ratio);

  function tick() {
    const rect = stage.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    const density = {
      upper: 1,
      canal: Math.max(0.04, ratio),
      downstream: Math.max(0.04, 1 - ratio),
      pipe: Math.max(0.04, m.park / 42),
    };

    particles.forEach(p => {
      p.u += p.v * (0.35 + density[p.path] * 1.1);
      if (p.u > 1) p.u -= 1;
      // 依密度隱藏部分粒子，流量少時看起來就稀疏
      if (p.u > density[p.path] * 1.15 && p.path !== 'upper') return;
      const len = lens[p.path];
      if (!len) return;
      const pt = bands[p.path].getPointAtLength(p.u * len);
      const c = toCanvas(pt, rect);
      const alpha = 0.30 + density[p.path] * 0.6;
      ctx.beginPath();
      ctx.arc(c.x, c.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(122,214,238,${alpha})`;
      ctx.fill();
    });

    raf = requestAnimationFrame(tick);
  }

  /* ---------- 更新 ---------- */
  function update() {
    m = model(ratio);
    valEl.textContent = Math.round(ratio * 100) + '%';
    paintReadout(m);

    // 水帶粗細
    bands.upper.setAttribute('stroke-width', '14');
    bands.canal.setAttribute('stroke-width', String(2 + ratio * 16));
    bands.downstream.setAttribute('stroke-width', String(2 + (1 - ratio) * 16));
    bands.pipe.setAttribute('stroke-width', String(2 + (m.park / 42) * 8));
    bands.downstream.setAttribute('stroke',
      m.down < 10 ? 'rgba(217,119,66,.65)' : m.down < 20 ? 'rgba(224,178,75,.6)' : 'rgba(27,107,128,.5)');

    // 閘門位置：拉得越多，閘門開得越大
    bands.gate.setAttribute('y', String(188 + (1 - ratio) * 44));
    bands.gate.setAttribute('height', String(Math.max(10, 60 - (1 - ratio) * 30)));

    // 水庫水位
    const lvl = Math.max(2, m.storage / 100 * 100);
    bands.resLevel.setAttribute('y', String(300 - lvl));
    bands.resLevel.setAttribute('height', String(lvl));

    // 節點讀數
    const set = (id, s) => { if (bands['label-' + id]) bands['label-' + id].textContent = s; };
    set('shangping', '100');
    set('weir', Math.round(ratio * 100) + '%');
    set('canal', fmt(m.diverted));
    set('baoshan', Math.round(m.storage) + '%');
    set('tap', fmt(m.park + m.household));
    set('down', fmt(m.down));
  }

  range.addEventListener('input', throttle(e => { ratio = e.target.value / 100; update(); }, 40));

  /* ---------- 啟動 ---------- */
  const saved = myWork('sim-flow');
  if (saved && typeof saved.ratio === 'number') {
    ratio = saved.ratio;
    range.value = String(Math.round(ratio * 100));
    if (saved.reason) reason.value = saved.reason;
  }
  buildSvg();
  requestAnimationFrame(() => {
    measure(); seed(); resize(); update(); tick();
  });
  const onResize = throttle(() => { resize(); }, 200);
  window.addEventListener('resize', onResize);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    offClass();
  };
}
