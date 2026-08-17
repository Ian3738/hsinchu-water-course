/* Task 5-1 霄裡溪聽證會 */
import { h, clear, eyebrow, field, toast, debounce } from '../../ui.js';
import { t, getLang } from '../../i18n.js';
import { saveWork, myWork, allWork, castVote, voteTally, subscribe, state } from '../../store.js';

const ROLES = [
  { id: 'xinpu',    n: '01', zh: '新埔居民',   en: 'Xinpu resident',
    want: { zh: '我們喝這條溪的水，井也跟它相通。', en: 'We drink from this creek, and our wells connect to it.' } },
  { id: 'engineer', n: '02', zh: '廠方工程師', en: 'Plant engineer',
    want: { zh: '製程需要穩定排放，處理設備要花錢也要時間。', en: 'The process needs steady discharge; treatment costs money and time.' } },
  { id: 'official', n: '03', zh: '政府官員',   en: 'Government official',
    want: { zh: '我得同時對就業、稅收和法規負責。', en: 'I answer for jobs, tax revenue and the regulations at once.' } },
  { id: 'farmer',   n: '04', zh: '下游農民',   en: 'Downstream farmer',
    want: { zh: '我的田靠它灌溉，作物出問題我沒有第二條溪。', en: 'My fields depend on it. If the crop fails I have no second creek.' } },
  { id: 'neighbour',n: '05', zh: '鄰溪居民',   en: 'Neighbouring resident',
    want: { zh: '如果改排到我們這邊，那我就變成新埔。', en: 'If it is rerouted to us, then I become Xinpu.' } },
];

const OPTIONS = [
  { id: 'xiaoli',   zh: '照舊排進霄裡溪', en: 'Keep discharging into Xiaoli Creek' },
  { id: 'other',    zh: '改排到另一條溪', en: 'Reroute to another creek' },
  { id: 'recycle',  zh: '全回收，不排放', en: 'Full recycling, no discharge' },
  { id: 'stop',     zh: '停產再說',       en: 'Stop production first' },
];

export default function hearing(root) {
  const zh = getLang() === 'zh';
  const saved = myWork('t5-1') || {};
  let role = saved.role || null;
  const offs = [];

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow('TASK 5-1 · ' + (zh ? '聽證會' : 'HEARING')),
    h('h1.ask.ask--wide', { text: zh ? '廢水該排進哪一條溪？' : 'Which creek should the wastewater go into?' }),
    h('p.lede', { text: zh
      ? '只討論這一個問題。每個角色都要說出「怎樣才能接受」，不能只反對。'
      : 'One question only. Every role must state what would make it acceptable, not just object.' }),
  ]));

  /* ---- 選角色 ---- */
  const roleGrid = h('.roles');
  const paintRoles = () => {
    clear(roleGrid);
    ROLES.forEach(r => roleGrid.append(h('button.role', {
      type: 'button', 'aria-pressed': String(role === r.id),
      onclick: () => { role = r.id; paintRoles(); autosave(); },
    }, [
      h('span.role__n', { text: r.n }),
      h('span.role__name', { text: zh ? r.zh : r.en }),
      h('span.role__want', { text: zh ? r.want.zh : r.want.en }),
    ])));
  };
  paintRoles();
  root.append(h('section.wrap--wide.section--tight.stack', [
    eyebrow(zh ? '你演誰' : 'YOUR ROLE'),
    roleGrid,
  ]));

  /* ---- 角色稿 ---- */
  const stance = h('textarea.textarea', { value: saved.stance || '', placeholder: zh ? '我的立場是……' : 'My position is...' });
  const terms  = h('textarea.textarea', { value: saved.terms || '', placeholder: zh ? '要我接受的話，必須……' : 'For me to accept it, there must be...' });
  const worry  = h('textarea.textarea', { value: saved.worry || '', placeholder: zh ? '我最怕的是……' : 'What I fear most is...' });

  const autosave = debounce(() => {
    saveWork('t5-1', { role, stance: stance.value, terms: terms.value, worry: worry.value });
  }, 700);
  [stance, terms, worry].forEach(el => el.addEventListener('input', autosave));

  root.append(h('section.wrap--wide.section--tight', [
    h('.paper.stack', [
      h('p.task__id', { text: zh ? '角色稿' : 'ROLE SCRIPT' }),
      field(zh ? '立場' : 'Position', stance),
      field(zh ? '我可以接受的條件' : 'What would make it acceptable', terms,
            zh ? '這一欄是完成標準：不能只寫反對' : 'Done-when: not just objection'),
      field(zh ? '我最怕的是' : 'What I fear most', worry),
      h('.doneline', { data: { done: String(!!terms.value.trim()) } }, [
        h('.doneline__dot'),
        h('span', { text: zh ? '你說出了可接受的條件' : 'You stated acceptable terms' }),
      ]),
      h('.row', [h('button.btn.btn--primary', { type: 'button', onclick: () => { autosave(); toast(t('saved')); } }, t('save'))]),
    ]),
  ]));

  /* ---- 全班投票 ---- */
  const voteBox = h('section.wrap--wide.section--tight.stack');
  const dissent = h('textarea.textarea', { value: saved.dissent || '', placeholder: zh ? '如果你投的是少數，寫下你為什麼不同意多數。' : 'If you were in the minority, write why you disagreed.' });
  dissent.addEventListener('input', debounce(() => {
    saveWork('t5-1', { role, stance: stance.value, terms: terms.value, worry: worry.value, dissent: dissent.value });
  }, 700));

  const paintVote = () => {
    clear(voteBox);
    const { tally, total, mine } = voteTally('hearing-creek');
    voteBox.append(
      eyebrow(zh ? '全班投票' : 'CLASS VOTE'),
      h('.row', OPTIONS.map(o => h('button.btn' + (mine === o.id ? '.btn--primary' : ''), {
        type: 'button', onclick: () => castVote('hearing-creek', o.id),
      }, zh ? o.zh : o.en))),
    );
    if (total) {
      const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
      voteBox.append(
        h('.stack-sm', OPTIONS.map(o => {
          const n = tally[o.id] || 0;
          const pct = Math.round(n / total * 100);
          return h('div', [
            h('.row.row--between', { style: { fontSize: 'var(--t-xs)' } }, [
              h('span', { text: zh ? o.zh : o.en }),
              h('span.mono', { text: `${n}　${pct}%` }),
            ]),
            h('.meter', [h('.meter__fill', { style: { width: pct + '%' },
                                             data: top && top[0] === o.id ? {} : { state: 'bad' } })]),
          ]);
        })),
        h('p.muted', { style: { fontSize: 'var(--t-xs)' }, text: `${total} ${zh ? '票' : 'votes'}` }),
        h('.paper.stack', [
          h('p.task__id', { text: zh ? '異議記錄' : 'DISSENT RECORD' }),
          h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
            ? '多數決之後，反對的理由不會消失。把它留下來。'
            : 'A majority does not dissolve the reasons against. Keep them.' }),
          dissent,
        ]),
      );
    }
  };
  root.append(voteBox);
  paintVote();
  offs.push(subscribe(w => { if (w === 'votes') paintVote(); }));

  /* ---- 全班角色稿 ---- */
  const board = h('section.wrap--wide.section--tight.stack');
  const paintBoard = () => {
    clear(board);
    const rows = allWork('t5-1').filter(w => w.terms && w.terms.trim());
    if (!rows.length) return;
    board.append(
      eyebrow(zh ? '各方開出的條件' : 'TERMS ON THE TABLE'),
      h('.cols-2', rows.map(w => {
        const r = ROLES.find(x => x.id === w.role);
        return h('.card', [
          h('p.card__title', { text: r ? (zh ? r.zh : r.en) : (zh ? '未選角色' : 'No role') }),
          h('p', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: w.terms }),
          h('p.muted', { style: { margin: 0, fontSize: 'var(--t-xs)' },
                         text: `${w.name || (zh ? '匿名' : 'anon')}${w.group ? '・' + w.group : ''}` }),
        ]);
      })),
    );
  };
  root.append(board);
  paintBoard();
  offs.push(subscribe(w => { if (w === 'work') paintBoard(); }));

  return () => offs.forEach(fn => fn());
}
