/* Task 1-1 辯論：四回合計時與發言筆記 */
import { h, clear, eyebrow, field, mmss, toast, debounce } from '../../ui.js';
import { t, getLang } from '../../i18n.js';
import { saveWork, myWork } from '../../store.js';

const FULL = [
  { sec: 120, zh: '正方陳述', en: 'For side speaks',  hint: { zh: '為什麼公平', en: 'why it is fair' } },
  { sec: 120, zh: '反方陳述', en: 'Against side speaks', hint: { zh: '為什麼不公平', en: 'why it is not' } },
  { sec: 180, zh: '互相提問', en: 'Cross questions', hint: { zh: '各問對方兩個問題', en: 'two questions each' } },
  { sec: 60,  zh: '說出對方最好的一點', en: "Name the other's best point", hint: { zh: '各一分鐘', en: 'one minute each' } },
];

const ALT = [
  { sec: 60, zh: '第一位', en: 'First speaker',  hint: { zh: '其他三人不插話', en: 'no interruptions' } },
  { sec: 60, zh: '第二位', en: 'Second speaker', hint: { zh: '其他三人不插話', en: 'no interruptions' } },
  { sec: 60, zh: '第三位', en: 'Third speaker',  hint: { zh: '其他三人不插話', en: 'no interruptions' } },
  { sec: 60, zh: '第四位', en: 'Fourth speaker', hint: { zh: '其他三人不插話', en: 'no interruptions' } },
  { sec: 180, zh: '只能提問', en: 'Questions only', hint: { zh: '不可以說「你錯了」', en: 'no "you are wrong"' } },
  { sec: 180, zh: '找出一句共同的話', en: 'One shared sentence', hint: { zh: '全組要同意', en: 'the group must agree' } },
];

export default function debate(root) {
  const zh = getLang() === 'zh';
  let mode = 'full';
  let rounds = FULL;
  let idx = 0, left = rounds[0].sec, running = false, timer = null;

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow('TASK 1-1 · ' + (zh ? '辯論' : 'DEBATE')),
    h('h1.ask.ask--wide', { text: zh
      ? '把上坪溪的水引到科學園區和我們家，這樣公平嗎？'
      : 'Diverting the Shangping River to the science park and our homes: is that fair?' }),
  ]));

  /* ---- 模式 ---- */
  const modeSeg = h('.seg', [
    ['full', zh ? '四回合辯論' : 'Four rounds'],
    ['alt',  zh ? '四人輪替（小班／國小）' : 'Rounds of four'],
  ].map(([k, label]) => h('button.seg__btn', {
    type: 'button', 'aria-pressed': String(mode === k), data: { mode: k },
    onclick: () => {
      mode = k; rounds = k === 'full' ? FULL : ALT;
      idx = 0; left = rounds[0].sec; stop();
      [...modeSeg.children].forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
      paint();
    },
  }, label)));

  root.append(h('section.wrap--wide.section--tight', [modeSeg]));

  /* ---- 計時 ---- */
  const clock = h('.timer__clock', { text: mmss(left) });
  const roundLbl = h('p.timer__round');
  const pips = h('.rounds');
  const hintLbl = h('p.note-line', { style: { textAlign: 'center' } });
  const controls = h('.row');
  const timerBox = h('.timer', { data: { state: 'idle' } }, [roundLbl, clock, pips, hintLbl, controls]);

  root.append(h('section.wrap--wide.section--tight', [timerBox]));

  function paint() {
    const r = rounds[idx];
    roundLbl.textContent = `${t('round')} ${idx + 1} / ${rounds.length}　${zh ? r.zh : r.en}`;
    hintLbl.textContent = zh ? r.hint.zh : r.hint.en;
    clock.textContent = mmss(left);
    timerBox.dataset.state = left <= 0 ? 'over' : running ? 'running' : 'idle';

    clear(pips);
    rounds.forEach((_, i) => pips.append(h('.rounds__pip', {
      data: { on: String(i === idx), done: String(i < idx) },
    })));

    clear(controls);
    controls.append(
      h('button.btn.btn--water', { type: 'button', onclick: () => running ? stop() : start() },
        running ? t('pause') : t('start')),
      h('button.btn', { type: 'button', onclick: reset }, t('reset')),
      h('button.btn.btn--primary', {
        type: 'button',
        onclick: () => {
          if (idx < rounds.length - 1) { idx++; left = rounds[idx].sec; stop(); paint(); }
          else toast(zh ? '四個回合都跑完了' : 'All rounds done');
        },
      }, zh ? '下一回合' : 'Next round'),
    );
  }

  function tick() {
    left--;
    if (left <= 0) {
      left = 0; stop();
      toast(t('timesUp'));
      try { beep(); } catch {}
    }
    paint();
  }
  function start() { if (running) return; running = true; timer = setInterval(tick, 1000); paint(); }
  function stop()  { running = false; clearInterval(timer); timer = null; paint(); }
  function reset() { stop(); left = rounds[idx].sec; paint(); }

  function beep() {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.value = 660; o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.14, ac.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.7);
    o.start(); o.stop(ac.currentTime + 0.72);
  }

  /* ---- 發言筆記 ---- */
  const saved = myWork('t1-1') || {};
  const forTa = h('textarea.textarea', { value: saved.forSide || '', placeholder: zh ? '正方要講的重點' : 'Points for the For side' });
  const agTa  = h('textarea.textarea', { value: saved.against || '', placeholder: zh ? '反方要講的重點' : 'Points for the Against side' });
  const bestTa = h('textarea.textarea', {
    value: saved.best || '',
    placeholder: zh ? '第四回合：對方最好的一個論點是……' : "Round four: the other side's best point was...",
  });

  const autosave = debounce(() => {
    saveWork('t1-1', { forSide: forTa.value, against: agTa.value, best: bestTa.value });
  }, 700);
  [forTa, agTa, bestTa].forEach(el => el.addEventListener('input', autosave));

  root.append(h('section.wrap--wide.section--tight', [
    h('.paper.stack', [
      h('p.task__id', { text: zh ? '發言筆記' : 'SPEAKING NOTES' }),
      h('.cols-2', [
        field(t('sideFor'), forTa),
        field(t('sideAgainst'), agTa),
      ]),
      field(zh ? '對方最好的一點（第四回合用）' : "The other side's best point (round four)", bestTa,
            zh ? '這一欄是完成標準' : 'This field is the done-when'),
      h('.doneline', { data: { done: String(!!bestTa.value.trim()) } }, [
        h('.doneline__dot'),
        h('span', { text: zh ? '第四回合真的講出了對方的強項' : 'Round four names a real strength' }),
      ]),
      h('.row', [h('button.btn.btn--primary', {
        type: 'button',
        onclick: () => { saveWork('t1-1', { forSide: forTa.value, against: agTa.value, best: bestTa.value }); toast(t('saved')); },
      }, t('save'))]),
    ]),
  ]));

  paint();
  return () => { clearInterval(timer); };
}
