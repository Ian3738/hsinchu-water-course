/* ============================================================
   觀點畫布
   ・每則貼文須標示發言者身分與關切焦點
   ・保留數個「還沒有人替他說話」的位置
   ・由 AI agent 進駐空位，以第一人稱發言並回應提問
   ============================================================ */
import { h, clear, eyebrow, field, toast, esc, countWords } from '../ui.js';
import { L, t, getLang } from '../i18n.js';
import { SLOTS, BY_SLOT } from '../../data/personas.js';
import {
  state, subscribe, addNote, removeNote, updateNote, notesList,
  agentTurns, pushAgentTurn, resetAgent, setMe,
} from '../store.js';
import { speak, agentEnabled, engine } from '../agent.js';

/* 指認未在場者的啟發式線索（僅作提示，不取代學生自己勾選） */
const ABSENT_HINTS = [
  '下游', '未出生', '還沒出生', '後代', '子孫', '以後的人', '將來的人',
  '溪', '河', '魚', '生物', '棲地', '搬走', '遷', '徵收', '不在場',
  '沒有人問', '沒被問', '沒有被問', '農民', '居民', '井', '地下水', '含水層',
  'downstream', 'unborn', 'not yet born', 'future generation', 'river', 'creek',
  'fish', 'displaced', 'relocat', 'nobody asked', 'not in the room', 'groundwater',
];

function looksAbsent(text) {
  const s = (text || '').toLowerCase();
  return ABSENT_HINTS.some(k => s.includes(k.toLowerCase()));
}

export default function board(root) {
  const zh = getLang() === 'zh';
  const offs = [];
  let filter = 'all';      // all | absent | session
  let highlight = true;

  /* ---------- 抬頭 ---------- */
  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow(t('boardTitle')),
    h('h1.ask.ask--wide', { text: t('boardAxis') }),
    h('p.lede', { text: t('boardRule') }),
  ]));

  /* ---------- 身分 ---------- */
  const idBar = h('section.wrap--wide.section--tight');
  root.append(idBar);
  paintIdentity(idBar, zh);

  /* ---------- 工具列 ---------- */
  const controls = h('section.wrap--wide.stack-sm');
  root.append(controls);

  /* ---------- 畫布 ---------- */
  const boardEl = h('.board');
  root.append(h('section.wrap--wide.section--tight', [boardEl]));

  /* ---------- 新增貼文 ---------- */
  const composer = h('section.wrap--wide.section--tight');
  root.append(composer);
  paintComposer(composer, zh);

  const paintAll = () => {
    paintControls(controls, zh, { filter, highlight }, (k, v) => {
      if (k === 'filter') filter = v;
      if (k === 'highlight') highlight = v;
      paintAll();
    });
    paintBoard(boardEl, zh, { filter, highlight, offs });
  };

  paintAll();
  offs.push(subscribe(w => {
    if (['notes', 'agent', 'cls', 'init', 'import', 'wipe'].includes(w)) paintAll();
    if (w === 'me') paintIdentity(idBar, zh);
  }));

  return () => offs.forEach(fn => fn());
}

/* ============================================================
   身分列
   ============================================================ */
function paintIdentity(host, zh) {
  clear(host);
  const nameInput = h('input.input', {
    value: state.me.name, placeholder: zh ? '你的名字' : 'Your name',
    style: { maxWidth: '190px' },
    oninput: e => setMe({ name: e.target.value.trim() }),
  });
  const groupInput = h('input.input', {
    value: state.me.group, placeholder: zh ? '組別' : 'Group',
    style: { maxWidth: '110px' },
    oninput: e => setMe({ group: e.target.value.trim() }),
  });
  host.append(h('.card.on-ink.row', { style: { gap: 'var(--s3)' } }, [
    h('span.mono', { style: { fontSize: 'var(--t-micro)', letterSpacing: '.16em', color: 'var(--fg-3)' },
                     text: zh ? '你是誰' : 'WHO ARE YOU' }),
    nameInput, groupInput,
    h('span.grow'),
    h('span.pill', { data: { tone: 'agent' } }, [
      h('span.pill__dot'), t('agentLabel'),
    ]),
  ]));
}

/* ============================================================
   篩選
   ============================================================ */
function paintControls(host, zh, opts, set) {
  clear(host);
  const list = notesList();
  const absentCount = list.filter(n => n.namesAbsent).length;

  host.append(h('.row.row--between', [
    h('.seg', [
      ['all', zh ? '全部' : 'All'],
      ['absent', zh ? '指認未在場者' : 'Names the absent'],
      ['mine', zh ? '我的' : 'Mine'],
    ].map(([k, label]) => h('button.seg__btn', {
      type: 'button', 'aria-pressed': String(opts.filter === k),
      onclick: () => set('filter', k),
    }, label))),
    h('.row.row--tight', [
      h('span.pill', [h('span.pill__dot'), `${list.length} ${zh ? '則' : 'notes'}`]),
      h('span.pill', { data: { tone: 'agent' } }, [h('span.pill__dot'), `${absentCount} ${zh ? '則指認未在場者' : 'name the absent'}`]),
      h('button.btn.btn--sm.btn--ghost', {
        type: 'button', 'aria-pressed': String(opts.highlight),
        onclick: () => set('highlight', !opts.highlight),
      }, opts.highlight ? (zh ? '關閉標記' : 'Hide marks') : (zh ? '顯示標記' : 'Show marks')),
    ]),
  ]));
}

/* ============================================================
   畫布本體
   ============================================================ */
function paintBoard(host, zh, { filter, highlight, offs }) {
  clear(host);
  let list = notesList();
  if (filter === 'absent') list = list.filter(n => n.namesAbsent);
  if (filter === 'mine') list = list.filter(n => n.authorId === state.me.id);

  const half = Math.ceil(list.length / 2);
  const before = list.slice(0, half);
  const after = list.slice(half);

  before.forEach(n => host.append(noteEl(n, zh, highlight)));
  host.append(h('.board__axis', { text: t('boardAxis') }));
  after.forEach(n => host.append(noteEl(n, zh, highlight)));

  // 空位永遠在最後，依節次解鎖
  SLOTS.forEach(slot => host.append(slotEl(slot, zh, offs)));

  if (!list.length) {
    host.append(h('.slot', { style: { gridColumn: '1 / -1', minHeight: '90px', borderStyle: 'solid' } }, [
      h('p.slot__hint', { text: zh ? '還沒有人貼東西上來。' : 'Nothing posted yet.' }),
    ]));
  }
}

function noteEl(n, zh, highlight) {
  const mine = n.authorId === state.me.id;
  return h('.note', {
    data: {
      side: n.side,
      namesAbsent: String(highlight && !!n.namesAbsent),
    },
  }, [
    h('.note__who', [
      n.who || (zh ? '（沒寫發言者）' : '(no speaker)'),
      n.namesAbsent && highlight ? h('span.tag-absent', { text: zh ? '未在場' : 'ABSENT' }) : null,
    ].filter(Boolean)),
    n.cares ? h('.note__care', { text: n.cares }) : null,
    h('.note__body', { text: n.body }),
    h('.note__foot', [
      h('span', { text: `${n.author || (zh ? '匿名' : 'anon')}${n.group ? '・' + n.group : ''}　S${n.session}` }),
      mine ? h('button.btn.btn--sm.btn--ghost', {
        type: 'button', style: { minHeight: '22px', padding: '0 6px', fontSize: '11px' },
        onclick: () => { if (confirm(zh ? '刪掉這則？' : 'Delete this note?')) removeNote(n.id); },
      }, t('delete')) : null,
    ].filter(Boolean)),
  ].filter(Boolean));
}

/* ============================================================
   空位
   ============================================================ */
function slotEl(slot, zh, offs) {
  const unlocked = state.cls.session >= slot.unlock;

  /* 尚未開放 */
  if (!unlocked) {
    return h('.slot', { data: { locked: 'true' } }, [
      h('p.slot__who', { text: L(slot.who) }),
      h('p.slot__hint', { text: t('lockedSlot', slot.unlock) }),
    ]);
  }

  /* AI agent 進駐空位 */
  const box = h('.slot.slot--agent');
  const paint = () => {
    clear(box);
    const turns = agentTurns(slot.id);

    box.append(
      h('.row.row--between', [
        h('.agent-badge', [h('span.agent-badge__dot'), `${t('agentLabel')} · ${L(slot.who)}`]),
        h('span.note__care', { style: { color: 'var(--fg-3)' }, text: L(slot.cares) }),
      ]),
    );

    if (!turns.length) {
      // 尚未開口：先給一個「請他說話」的按鈕，避免一進畫布就被灌訊息
      box.append(
        h('p.slot__hint', { style: { textAlign: 'left', color: 'var(--fg-3)' }, text: L(slot.tag) }),
        h('button.btn.btn--sm', {
          type: 'button',
          onclick: async e => {
            e.target.disabled = true;
            e.target.textContent = t('agentThinking') + '…';
            const { text, via } = await speak(slot.id, '', []);
            pushAgentTurn(slot.id, { role: 'agent', text, via });
          },
        }, zh ? '請他說一句' : 'Let them speak'),
      );
      return;
    }

    const chat = h('.chat');
    turns.forEach(tn => chat.append(
      h('.bubble.bubble--' + (tn.role === 'me' ? 'me' : 'agent'), { text: tn.text }),
    ));
    box.append(chat);

    // 提問
    const input = h('input.input', {
      placeholder: t('askAgent'),
      style: { background: 'rgba(8,32,44,.5)', color: 'var(--fg)', borderColor: 'rgba(201,162,39,.3)' },
    });
    const send = async () => {
      const q = input.value.trim();
      if (!q) return;
      input.value = '';
      pushAgentTurn(slot.id, { role: 'me', text: q, by: state.me.name || '' });
      const thinking = h('.bubble.bubble--agent', [h('.typing', [h('span'), h('span'), h('span')])]);
      chat.append(thinking);
      chat.scrollTop = chat.scrollHeight;
      const { text, via } = await speak(slot.id, q, agentTurns(slot.id));
      thinking.remove();
      pushAgentTurn(slot.id, { role: 'agent', text, via });
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

    box.append(
      h('.row.row--tight', [
        h('span.grow', [input]),
        h('button.btn.btn--sm', { type: 'button', onclick: send }, t('send')),
      ]),
      h('p', {
        style: { fontSize: '10px', lineHeight: 1.45, color: 'var(--fg-3)', margin: 0, fontStyle: 'italic' },
        text: t('agentNotice'),
      }),
      h('.row.row--tight', [
        h('button.btn.btn--sm.btn--ghost', {
          type: 'button', style: { minHeight: '26px', fontSize: '11px' },
          onclick: () => { if (confirm(zh ? '清掉這個空位的對話？' : 'Clear this conversation?')) resetAgent(slot.id); },
        }, t('reset')),
        engine() === 'script'
          ? h('span.mono', { style: { fontSize: '10px', color: 'var(--fg-3)' }, text: zh ? '腳本模式' : 'scripted' })
          : null,
      ].filter(Boolean)),
    );
    chat.scrollTop = chat.scrollHeight;
  };

  paint();
  offs.push(subscribe(w => { if (w === 'agent') paint(); }));
  return box;
}

/* ============================================================
   新增貼文
   ============================================================ */
function paintComposer(host, zh) {
  clear(host);

  const who   = h('input.input', { placeholder: zh ? '例：下游的人、大圳的農民、上坪溪' : 'e.g. people downstream' });
  const cares = h('input.input', { placeholder: zh ? '例：流量、灌溉、喝的水' : 'e.g. flow, irrigation' });
  const body  = h('textarea.textarea', { placeholder: zh ? '他要說的話。寫清楚這個方案會讓他怎麼樣。' : 'What they would say. Be clear about how the proposal affects them.' });

  const sideSeg = h('.seg', [
    ['for', t('sideFor')], ['against', t('sideAgainst')], ['absent', t('sideAbsent')],
  ].map(([k, label], idx) => h('button.seg__btn', {
    type: 'button', 'aria-pressed': String(idx === 0), data: { side: k },
    onclick: e => {
      [...sideSeg.children].forEach(b => b.setAttribute('aria-pressed', 'false'));
      e.target.setAttribute('aria-pressed', 'true');
    },
  }, label)));

  const absentBox = h('input', { type: 'checkbox', id: 'namesAbsent', style: { width: '18px', height: '18px', accentColor: 'var(--clay)' } });
  const hint = h('p.field__hint', { style: { margin: 0 } });

  const recheck = () => {
    const auto = looksAbsent(who.value + ' ' + body.value);
    hint.textContent = auto
      ? (zh ? '這則看起來提到了不在現場的人。是的話請勾起來。' : 'This looks like it names someone absent. Tick the box if so.')
      : '';
    hint.style.color = auto ? 'var(--clay-dim)' : 'transparent';
  };
  who.addEventListener('input', recheck);
  body.addEventListener('input', recheck);

  const submit = () => {
    if (!state.me.name) { toast(t('needName')); return; }
    if (!who.value.trim()) { toast(t('needWho')); who.focus(); return; }
    if (!body.value.trim()) { toast(t('needBody')); body.focus(); return; }
    const side = [...sideSeg.children].find(b => b.getAttribute('aria-pressed') === 'true')?.dataset.side || 'for';
    addNote({
      who: who.value, cares: cares.value, body: body.value, side,
      namesAbsent: absentBox.checked,
    });
    who.value = ''; cares.value = ''; body.value = ''; absentBox.checked = false;
    recheck();
    toast(t('posted'));
  };

  host.append(h('.paper.stack', [
    h('.row.row--between', [
      h('p.task__id', { text: zh ? '貼一則到畫布' : 'POST TO THE CANVAS' }),
      h('span', { class: 'counter', text: '' }),
    ]),
    h('.cols-2', [
      field(t('whoSpeaks'), who, t('whoSpeaksHint')),
      field(t('caresAbout'), cares, t('caresHint')),
    ]),
    field(t('yourPoint'), body),
    h('.row.row--between', [
      h('.row.row--tight', [
        h('span', { class: 'field__label', style: { fontSize: 'var(--t-xs)' }, text: t('side') }),
        sideSeg,
      ]),
      h('label.row.row--tight', { for: 'namesAbsent', style: { cursor: 'pointer', fontSize: 'var(--t-xs)', fontWeight: '600' } }, [
        absentBox, t('namesAbsent'),
      ]),
    ]),
    hint,
    h('.row', [h('button.btn.btn--primary', { type: 'button', onclick: submit }, t('post'))]),
  ]));
}
