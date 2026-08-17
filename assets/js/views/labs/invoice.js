/* Task 2-1 幫上坪溪開一張帳單 */
import { h, clear, eyebrow, field, toast, debounce } from '../../ui.js';
import { t, getLang } from '../../i18n.js';
import { saveWork, myWork, allWork, subscribe } from '../../store.js';

const BASES = [
  { id: 'volume', zh: '算水量',  en: 'By volume',
    unit: { zh: '每萬噸', en: 'per 10,000 tonnes' },
    qLabel: { zh: '一年引走幾萬噸', en: 'ten-thousand tonnes per year' },
    note: { zh: '拿多少算多少。可是同樣一噸水，對枯水期的下游跟豐水期的下游，意義一樣嗎？',
            en: 'Pay for what you take. But is one tonne worth the same downstream in a dry year as in a wet one?' } },
  { id: 'years', zh: '算年數', en: 'By years',
    unit: { zh: '每年', en: 'per year' },
    qLabel: { zh: '引水引了幾年', en: 'years of diversion' },
    note: { zh: '借越久欠越多。可是前十年跟後十年，河的狀況已經不一樣了。',
            en: 'The longer the borrowing, the larger the debt. But the river of the first decade is not the river of the last.' } },
  { id: 'people', zh: '算受影響的人數', en: 'By people affected',
    unit: { zh: '每人', en: 'per person' },
    qLabel: { zh: '下游受影響的人數', en: 'people affected downstream' },
    note: { zh: '有人受影響才算數。那不會說話的、還沒出生的，要不要算進去？',
            en: 'Only those affected count. Do those who cannot speak, or are not yet born, go in the total?' } },
];

export default function invoice(root) {
  const zh = getLang() === 'zh';
  const saved = myWork('t2-1') || {};
  let basis = saved.basis || 'volume';

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow('TASK 2-1 · ' + (zh ? '河川帳單' : 'RIVER INVOICE')),
    h('h1.ask.ask--wide', { text: zh
      ? '如果上坪溪可以收水費，它該跟誰收？'
      : 'If the Shangping River could charge for its water, who should it bill?' }),
    h('p.lede', { text: zh
      ? '重點不是算出正確答案。是你為什麼選這個基準，以及為什麼不選另一個。'
      : 'The point is not the right number. It is why you chose this basis and not the other.' }),
  ]));

  /* ---- 基準 ---- */
  const basisSeg = h('.seg', BASES.map(b => h('button.seg__btn', {
    type: 'button', 'aria-pressed': String(basis === b.id), data: { basis: b.id },
    onclick: () => {
      basis = b.id;
      [...basisSeg.children].forEach(x => x.setAttribute('aria-pressed', String(x.dataset.basis === basis)));
      paint();
    },
  }, zh ? b.zh : b.en)));

  const billTo = h('input.input', { value: saved.billTo || '', placeholder: zh ? '例：新竹科學園區、自來水公司、我們全家' : 'e.g. the science park' });
  const qty = h('input.input', { type: 'number', min: '0', value: saved.qty ?? '', placeholder: '0' });
  const price = h('input.input', { type: 'number', min: '0', value: saved.price ?? '', placeholder: '0' });
  const whyThis = h('textarea.textarea', { value: saved.whyThis || '', placeholder: zh ? '我選這個基準，是因為……' : 'I chose this basis because...' });
  const whyNot = h('textarea.textarea', { value: saved.whyNot || '', placeholder: zh ? '我不選另外那個，是因為……' : 'I did not choose the other because...' });

  const total = h('span.datum__n', { style: { fontSize: 'var(--t-xxl)' }, text: 'NT$ 0' });
  const unitLbl = h('span.field__hint');
  const qtyLbl = h('span');
  const noteLine = h('p.note-line');

  const compute = () => {
    const n = (parseFloat(qty.value) || 0) * (parseFloat(price.value) || 0);
    total.textContent = 'NT$ ' + n.toLocaleString('zh-TW', { maximumFractionDigits: 0 });
  };

  const autosave = debounce(() => {
    saveWork('t2-1', {
      basis, billTo: billTo.value, qty: qty.value, price: price.value,
      whyThis: whyThis.value, whyNot: whyNot.value,
      total: (parseFloat(qty.value) || 0) * (parseFloat(price.value) || 0),
    });
  }, 700);

  [billTo, qty, price, whyThis, whyNot].forEach(el =>
    el.addEventListener('input', () => { compute(); autosave(); }));

  /* ---- 帳單 ---- */
  const sheet = h('.paper.stack');
  const paint = () => {
    const b = BASES.find(x => x.id === basis);
    unitLbl.textContent = zh ? b.unit.zh : b.unit.en;
    qtyLbl.textContent = zh ? b.qLabel.zh : b.qLabel.en;
    noteLine.textContent = zh ? b.note.zh : b.note.en;
    compute();
    autosave();
  };

  sheet.append(
    h('.row.row--between', { style: { borderBottom: '2px solid var(--on-paper)', paddingBottom: 'var(--s3)' } }, [
      h('div', [
        h('p.task__id', { text: zh ? '請 款 單' : 'INVOICE' }),
        h('h2.task__title', { style: { fontSize: 'var(--t-lg)' }, text: zh ? '上坪溪' : 'The Shangping River' }),
      ]),
      h('p.mono', { style: { fontSize: 'var(--t-xs)', color: 'var(--on-paper-2)' }, text: new Date().toLocaleDateString('zh-TW') }),
    ]),
    field(zh ? '收費對象' : 'Bill to', billTo),
    h('.cols-2', [
      field(qtyLbl, qty),
      field(h('span', [zh ? '單價　' : 'Unit price ', unitLbl]), price),
    ]),
    h('.row.row--between', { style: { borderTop: '1px solid var(--rule-paper)', paddingTop: 'var(--s4)' } }, [
      h('span', { class: 'task__id', text: zh ? '合計' : 'TOTAL' }),
      total,
    ]),
    noteLine,
    field(zh ? '為什麼選這個基準' : 'Why this basis', whyThis),
    field(zh ? '為什麼不選另一個' : 'Why not the other', whyNot,
          zh ? '這一欄是完成標準' : 'This field is the done-when'),
    h('.doneline', [h('.doneline__dot'), h('span', { text: zh
      ? '你講得出為什麼不選另一個基準' : 'You can say why not the other basis' })]),
    h('.row', [h('button.btn.btn--primary', { type: 'button', onclick: () => { autosave(); toast(t('saved')); } }, t('save'))]),
  );

  root.append(h('section.wrap--wide.section--tight.stack', [basisSeg, sheet]));

  /* ---- 全班的帳單 ---- */
  const others = h('section.wrap--wide.section--tight.stack');
  const paintOthers = () => {
    clear(others);
    const rows = allWork('t2-1').filter(w => w.total);
    if (!rows.length) return;
    others.append(
      eyebrow(zh ? '其他組開的帳單' : "Other groups' invoices"),
      h('.cols-3', rows.map(w => h('.card', [
        h('p.mono', { style: { margin: 0, color: 'var(--clay-lit)', fontSize: 'var(--t-lg)' },
                      text: 'NT$ ' + Number(w.total).toLocaleString('zh-TW', { maximumFractionDigits: 0 }) }),
        h('p', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: (zh ? '收 ' : 'bills ') + (w.billTo || '—') }),
        h('p.muted', { style: { margin: 0, fontSize: 'var(--t-xs)' },
                       text: `${w.name || (zh ? '匿名' : 'anon')}${w.group ? '・' + w.group : ''}　${BASES.find(b => b.id === w.basis)?.[zh ? 'zh' : 'en'] || ''}` }),
      ]))),
      h('p.note-line', { text: zh
        ? '同一條溪，金額差這麼多。差在哪裡？'
        : 'Same river, very different totals. Where does the difference come from?' }),
    );
  };
  root.append(others);
  paintOthers();
  const off = subscribe(w => { if (w === 'work') paintOthers(); });

  paint();
  return () => off();
}
