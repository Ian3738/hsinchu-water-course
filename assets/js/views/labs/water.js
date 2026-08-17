/* 第 4 節：跨流域配置地圖　／　第 5 節：放流比例 */
import { h, clear, eyebrow, throttle, toast, debounce, field } from '../../ui.js';
import { t, getLang } from '../../i18n.js';
import { saveWork, myWork } from '../../store.js';

const NS = 'http://www.w3.org/2000/svg';

/* ============================================================
   basin — 一個流域的谷地，裝另一個流域的水
   ============================================================ */
export function basin(root) {
  const zh = getLang() === 'zh';
  let showOrigin = true;

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow(zh ? '模擬・跨流域' : 'SIMULATION · ACROSS THE DIVIDE'),
    h('h1.ask.ask--wide', { text: zh
      ? '為什麼一個流域的谷地，要裝另一個流域的水？'
      : "Why should a valley in one basin hold water from another?" }),
    h('p.lede', { text: zh
      ? '把分水嶺打開，看水是從哪一邊來的。'
      : 'Open the divide and see which side the water comes from.' }),
  ]));

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'sim__svg');
  svg.setAttribute('viewBox', '0 0 1000 560');
  const stage = h('.sim__stage', [svg]);

  const toggle = h('button.btn', {
    type: 'button',
    onclick: () => { showOrigin = !showOrigin; paint(); },
  });

  const panel = h('.sim__panel', [
    h('.stack-sm', [
      h('p.card__title', { text: zh ? '看什麼' : 'What to look at' }),
      toggle,
    ]),
    h('.readout', [
      row(zh ? '水庫位置' : 'Reservoir sits in', zh ? '中港溪流域' : 'Zhonggang basin', 'warn'),
      row(zh ? '庫水來源' : 'Water comes from', zh ? '頭前溪・上坪溪' : 'Touqian · Shangping', 'bad'),
      row(zh ? '枯水期調補' : 'Dry-year top-up', zh ? '石門、永和山' : 'Shihmen, Yonghe Shan', ''),
      row(zh ? '缺水時' : 'In shortages', zh ? '隆恩堰下 17 口井' : "17 wells below Long'en Weir", ''),
    ]),
  ]);

  root.append(h('section.wrap--wide.section--tight', [h('.sim', [stage, panel])]));

  root.append(h('section.wrap--wide.section--tight.stack', [
    h('.cols-2', [
      h('.card', [
        h('p.card__title', { text: zh ? '這樣安排有道理' : 'The arrangement makes sense' }),
        h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
          ? '那個谷地地形適合築壩，淹沒範圍相對小，工程成本低。完全合法，也有效率。'
          : 'That valley suits a dam, floods a relatively small area, and costs less to build. Entirely legal, and efficient.' }),
      ]),
      h('.card.card--clay', [
        h('p.card__title', { text: zh ? '值得問的還是那句' : 'The question still stands' }),
        h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
          ? '合法、有效率，跟有沒有人問過住在那裡的人，是三件不同的事。'
          : 'Legal, efficient, and asked-about are three different things.' }),
      ]),
    ]),
  ]));

  function row(k, v, state) {
    return h('.readout__row', [
      h('span.readout__k', { text: k }),
      h('span.readout__v', { data: state ? { state } : {}, text: v }),
    ]);
  }

  function paint() {
    toggle.textContent = showOrigin
      ? (zh ? '關掉來源標示' : 'Hide water origin')
      : (zh ? '顯示水從哪來' : 'Show water origin');

    clear(svg);
    const touqian = showOrigin ? '#3D96AC' : 'rgba(27,107,128,.45)';
    const zhonggang = showOrigin ? 'rgba(154,178,188,.3)' : 'rgba(27,107,128,.45)';

    svg.innerHTML = `
      <!-- 地形 -->
      <path d="M -20,300 C 120,250 220,180 330,140 C 420,108 470,104 500,150
               C 530,196 580,240 700,280 C 820,320 920,340 1020,346 L 1020,560 L -20,560 Z"
            fill="rgba(154,178,188,.06)" stroke="rgba(154,178,188,.22)" stroke-width="1.5"/>

      <!-- 分水嶺 -->
      <line x1="500" y1="86" x2="500" y2="560" stroke="rgba(217,119,66,.55)"
            stroke-width="2" stroke-dasharray="7 7"/>
      <text x="510" y="112" style="fill:var(--clay-lit);font-size:15px;font-family:var(--f-display)">${zh ? '分水嶺' : 'The divide'}</text>
      <text x="510" y="130" class="node-label">WATERSHED DIVIDE</text>

      <!-- 左：頭前溪流域 -->
      <text x="60" y="70" style="fill:var(--fg-2);font-size:19px;font-family:var(--f-display)">${zh ? '頭前溪流域' : 'Touqian basin'}</text>
      <text x="60" y="90" class="node-label">TOUQIAN RIVER BASIN</text>
      <path d="M 40,210 C 150,240 260,268 340,296" fill="none" stroke="${touqian}" stroke-width="11" stroke-linecap="round"/>
      <text x="60" y="196" class="node-label">${zh ? '上坪溪' : 'SHANGPING R.'}</text>

      <!-- 引水渠道：穿過分水嶺 -->
      <path d="M 340,296 C 420,300 460,262 500,258 C 545,254 590,258 640,266"
            fill="none" stroke="${touqian}" stroke-width="8" stroke-linecap="round"
            stroke-dasharray="${showOrigin ? '0' : '5 6'}"/>
      <circle cx="500" cy="258" r="7" fill="#D97742"/>
      <text x="392" y="240" class="node-label node-label--hi">${zh ? '引水穿過分水嶺' : 'DIVERTED ACROSS'}</text>

      <!-- 右：中港溪流域 -->
      <text x="700" y="70" style="fill:var(--fg-2);font-size:19px;font-family:var(--f-display)">${zh ? '中港溪流域' : 'Zhonggang basin'}</text>
      <text x="700" y="90" class="node-label">ZHONGGANG BASIN</text>

      <!-- 寶二水庫 -->
      <path d="M 640,250 L 838,250 L 812,392 L 666,392 Z"
            fill="${showOrigin ? 'rgba(61,150,172,.34)' : 'rgba(27,107,128,.26)'}"
            stroke="rgba(61,150,172,.6)" stroke-width="1.5"/>
      <text x="646" y="228" style="fill:var(--fg);font-size:17px;font-family:var(--f-display)">${zh ? '寶山第二水庫' : 'Baoshan Second Res.'}</text>
      <text x="646" y="246" class="node-label">157 HA · NT$10.5BN · 2006</text>
      ${showOrigin ? `<text x="676" y="330" style="fill:var(--clay-lit);font-size:15px;font-family:var(--f-display)">${zh ? '裡面是頭前溪的水' : "holds Touqian's water"}</text>` : ''}

      <!-- 淹沒區標記 -->
      <text x="666" y="418" class="node-label node-label--hi">${zh ? '淹沒四個鄉鎮・157 公頃' : 'FLOODED ACROSS FOUR TOWNSHIPS'}</text>
    `;
  }

  paint();
}

/* ============================================================
   effluent — 溪水裡有多少不是溪水
   ============================================================ */
export function effluent(root) {
  const zh = getLang() === 'zh';
  let share = 0.25;

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow(zh ? '模擬・放流' : 'SIMULATION · EFFLUENT'),
    h('h1.ask.ask--wide', { text: zh ? '溪水裡有多少，不是溪水？' : 'How much of the creek is not creek?' }),
    h('p.lede', { text: zh
      ? '霄裡溪的流量裡，最高曾有四成是放流水。拉拉看。'
      : "At its height, two-fifths of Xiaoli Creek's flow was effluent. Try it." }),
  ]));

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'sim__svg');
  svg.setAttribute('viewBox', '0 0 1000 560');
  const stage = h('.sim__stage', [svg]);

  const valEl = h('span.slider__val', { text: '25%' });
  const range = h('input', { type: 'range', min: '0', max: '60', value: '25', 'aria-label': t('effluentRatio') });
  const readout = h('.readout');

  const panel = h('.sim__panel', [
    h('.slider', [
      h('.slider__top', [h('span.slider__label', { text: t('effluentRatio') }), valEl]),
      range,
      h('p', { class: 'muted', style: { fontSize: 'var(--t-micro)', margin: 0 },
               text: zh ? '溪流量裡放流水佔的比例' : "share of the creek's flow that is effluent" }),
    ]),
    readout,
  ]);

  root.append(h('section.wrap--wide.section--tight', [h('.sim', [stage, panel])]));

  root.append(h('section.wrap--wide.section--tight.stack', [
    h('.card.card--clay', [
      h('p.card__title', { text: zh ? '兩個常被跳過的細節' : 'Two details that get skipped' }),
      h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
        ? '當時只有一半多的新埔家戶有自來水，其他人喝井水。井跟溪是通的——溪髒了，井也乾淨不到哪裡去。這個模型裡的「受影響的井」就是在算這件事。'
        : 'Just over half of Xinpu households had piped water then; the rest drank from wells. Wells and creek are connected, so a dirty creek does not leave clean wells. That is what the "wells affected" figure tracks.' }),
    ]),
    h('.card', [
      h('p.card__title', { text: zh ? '這是教學模型' : 'A teaching model' }),
      h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
        ? '水質等級的判定實際上要看多項指標與長期監測，不是單一比例就能決定。這裡只是讓「稀釋」這個說法變得可以檢查。'
        : 'Real water-quality grading uses many indicators and long-term monitoring, not one ratio. This only makes the word "dilution" checkable.' }),
    ]),
  ]));

  function model(s) {
    const grade = s < 0.05 ? (zh ? '甲類・可直接取用' : 'Class A · drawable')
                : s < 0.15 ? (zh ? '乙類・處理後可用' : 'Class B · usable after treatment')
                : s < 0.30 ? (zh ? '丙類・不宜飲用' : 'Class C · not for drinking')
                :            (zh ? '丁類以下・僅供環境用水' : 'Class D or below · environmental use only');
    const state = s < 0.05 ? 'ok' : s < 0.15 ? 'warn' : 'bad';
    const wells = Math.round(s * 900);          // 相對指標
    const drink = s < 0.05;
    return { grade, state, wells, drink };
  }

  function paint() {
    const m = model(share);
    valEl.textContent = Math.round(share * 100) + '%';

    clear(readout);
    readout.append(
      h('.readout__row', [h('span.readout__k', { text: t('waterGrade') }),
                          h('span.readout__v', { data: { state: m.state }, text: m.grade })]),
      h('.readout__row', [h('span.readout__k', { text: t('drinkable') }),
                          h('span.readout__v', { data: { state: m.drink ? 'ok' : 'bad' },
                                                 text: m.drink ? (zh ? '可以' : 'yes') : (zh ? '不行' : 'no') })]),
      h('.readout__row', [h('span.readout__k', { text: t('wells') }),
                          h('span.readout__v', { data: { state: m.wells > 200 ? 'bad' : m.wells > 0 ? 'warn' : 'ok' },
                                                 text: String(m.wells) })]),
    );
    readout.append(h('p', {
      style: { fontSize: 'var(--t-xs)', color: 'var(--fg-3)', margin: 0, fontStyle: 'italic' },
      text: zh ? '「受影響的井」為相對指標，非實測井數。' : '"Wells affected" is a relative index, not a measured count.',
    }));

    // 溪流剖面：上半是溪水，下半是放流水
    const eff = share;
    clear(svg);
    svg.innerHTML = `
      <path d="M -20,180 C 200,200 420,236 700,280 C 840,302 940,318 1020,326"
            fill="none" stroke="rgba(61,150,172,.55)" stroke-width="${34 * (1 - eff) + 6}" stroke-linecap="round"/>
      <path d="M -20,214 C 200,234 420,270 700,314 C 840,336 940,352 1020,360"
            fill="none" stroke="rgba(217,119,66,${0.25 + eff})" stroke-width="${34 * eff + 2}" stroke-linecap="round"/>

      <text x="60" y="140" style="fill:var(--fg-2);font-size:19px;font-family:var(--f-display)">${zh ? '霄裡溪' : 'Xiaoli Creek'}</text>
      <text x="60" y="160" class="node-label">XIAOLI CREEK · XINPU</text>

      <text x="700" y="230" style="fill:var(--water-lit);font-size:14px;font-family:var(--f-body)">${zh ? '溪水' : 'creek water'} ${Math.round((1 - eff) * 100)}%</text>
      <text x="700" y="404" style="fill:var(--clay-lit);font-size:14px;font-family:var(--f-body)">${zh ? '放流水' : 'effluent'} ${Math.round(eff * 100)}%</text>

      <rect x="120" y="392" width="150" height="4" fill="rgba(154,178,188,.3)"/>
      <text x="120" y="424" class="node-label">${zh ? '上游・面板廠' : 'UPSTREAM · PANEL PLANTS'}</text>
      <text x="640" y="466" class="node-label">${zh ? '下游・新埔 3 萬 5 千人' : 'DOWNSTREAM · 35,000 PEOPLE'}</text>
    `;
  }

  range.addEventListener('input', throttle(e => { share = e.target.value / 100; paint(); }, 40));
  paint();
}
