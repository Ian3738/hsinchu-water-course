/* 教師控制台：班級、條件、進度、即時檢視、資料匯出 */
import { h, clear, eyebrow, field, toast, downloadFile, pill } from '../ui.js';
import { t, getLang } from '../i18n.js';
import { SESSIONS } from '../../data/course.js';
import { SLOTS } from '../../data/personas.js';
import {
  state, setClass, subscribe, sync, notesList, snapshot,
  importSnapshot, wipeLocal, allWork,
} from '../store.js';
import { engine } from '../agent.js';

/* 話語編碼：自動標記只是初篩，正式分析仍須人工複核 */
const CODES = [
  { id: 'NAMES_ABSENT', zh: '指認未在場者', en: 'Names the absent',
    test: n => !!n.namesAbsent },
  { id: 'CLAIM', zh: '提出主張', en: 'Claim',
    test: n => /應該|我認為|我覺得|不該|必須|才對|should|must|ought|I think/i.test(n.body) },
  { id: 'CITE', zh: '引用資料', en: 'Cite',
    test: n => /\d{2,}|公頃|萬噸|億|年|％|%|等級|tonnes|hectare|percent/i.test(n.body) },
  { id: 'RESPOND', zh: '回應他人', en: 'Respond',
    test: n => /可是|但是|不過|他們說|你們說|同意|反對|回應|but|however|they said|agree|disagree/i.test(n.body) },
  { id: 'QUESTION', zh: '提問', en: 'Question',
    test: n => /？|\?/.test(n.body) },
];

export default function teacher(root) {
  const zh = getLang() === 'zh';
  const offs = [];

  root.append(h('section.wrap--wide.section--tight.stack.enter', [
    eyebrow('TEACHER CONSOLE'),
    h('h1.ask.ask--wide', { text: t('teacher') }),
  ]));

  /* ---------- 班級與條件 ---------- */
  const codeIn = h('input.input', { value: state.cls.code, style: { maxWidth: '180px' } });
  codeIn.addEventListener('change', () => {
    const v = codeIn.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'demo';
    codeIn.value = v;
    setClass({ code: v });
    toast(zh ? '換班級要重新整理才會載入該班資料' : 'Reload to load that class');
  });

  const condSeg = h('.seg', [
    ['agent', t('condAgent')], ['blank', t('condBlank')],
  ].map(([k, label]) => h('button.seg__btn', {
    type: 'button', 'aria-pressed': String(state.cls.condition === k), data: { cond: k },
    onclick: () => {
      setClass({ condition: k });
      [...condSeg.children].forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cond === k)));
      toast(k === 'agent' ? (zh ? '空位由 AI agent 進駐' : 'Agent occupies the slots') : (zh ? '空位維持空白' : 'Slots stay blank'));
    },
  }, label)));

  const sessSel = h('select.select', { style: { maxWidth: '260px' } },
    SESSIONS.map(s => h('option', { value: String(s.n), selected: s.n === state.cls.session },
      `${String(s.n).padStart(2, '0')}　${s.title[zh ? 'zh' : 'en']}`)));
  sessSel.addEventListener('change', () => setClass({ session: Number(sessSel.value) }));

  root.append(h('section.wrap--wide.section--tight', [
    h('.card.on-ink.stack', [
      h('.cols-3', [
        field(t('classCode'), codeIn, zh ? '同一代碼的裝置會看到同一張畫布' : 'Devices sharing this code share a canvas'),
        h('.field', [h('span.field__label', { text: t('condition') }), condSeg]),
        field(zh ? '目前節次' : 'Current session', sessSel),
      ]),
      h('.row.row--tight', [
        pill(sync.mode === 'live' ? t('liveSync') : t('localOnly'), sync.mode === 'live' ? 'live' : 'local'),
        pill(engine() === 'live' ? (zh ? 'AI：連線模式' : 'AI: live') : (zh ? 'AI：腳本模式' : 'AI: scripted'), 'agent'),
        pill(`${Object.keys(state.peers || {}).length} ${t('students')}`, ''),
      ]),
    ]),
  ]));

  /* ---------- 分派連結 ---------- */
  const linkFor = cond => {
    const base = location.href.split('#')[0];
    return `${base}#/?class=${state.cls.code}&cond=${cond}`;
  };
  root.append(h('section.wrap--wide.section--tight.stack', [
    eyebrow(zh ? '發給學生的連結' : 'LINKS TO HAND OUT'),
    h('.cols-2', [
      ['agent', t('condAgent')], ['blank', t('condBlank')],
    ].map(([k, label]) => h('.card', [
      h('p.card__title', { text: label }),
      h('p.mono', { style: { margin: 0, fontSize: 'var(--t-xs)', wordBreak: 'break-all', color: 'var(--fg-2)' }, text: linkFor(k) }),
      h('button.btn.btn--sm', {
        type: 'button',
        onclick: async () => {
          try { await navigator.clipboard.writeText(linkFor(k)); toast(t('copied')); }
          catch { toast(zh ? '複製不了，請手動選取' : 'Copy failed; select manually'); }
        },
      }, t('copy')),
    ]))),
    h('p.note-line', { text: zh
      ? '同一個班級代碼、不同 cond 參數，兩組會共用同一張畫布。若要讓兩組互不干擾，班級代碼也要分開，例如 703a 與 703b。'
      : 'Same class code with different cond shares one canvas. To keep the groups apart, give them separate class codes.' }),
  ]));

  /* ---------- 即時檢視 ---------- */
  const live = h('section.wrap--wide.section--tight.stack');
  const paintLive = () => {
    clear(live);
    const notes = notesList();
    const absent = notes.filter(n => n.namesAbsent);
    const bySession = {};
    notes.forEach(n => { bySession[n.session] = (bySession[n.session] || 0) + 1; });

    live.append(
      eyebrow(zh ? '現在的樣子' : 'RIGHT NOW'),
      h('.datum-grid', [
        dat(String(notes.length), zh ? '畫布上的貼文' : 'notes on the canvas'),
        dat(String(absent.length), zh ? '指認未在場者' : 'name the absent'),
        dat(notes.length ? Math.round(absent.length / notes.length * 100) + '%' : '—', zh ? '佔全部貼文' : 'of all notes'),
        dat(String(Object.keys(state.peers || {}).length), zh ? '在線裝置' : 'devices online'),
      ]),
      h('.stack-sm', SESSIONS.map(s => {
        const n = bySession[s.n] || 0;
        const max = Math.max(1, ...Object.values(bySession));
        return h('div', [
          h('.row.row--between', { style: { fontSize: 'var(--t-xs)' } }, [
            h('span', { text: `${String(s.n).padStart(2, '0')}　${s.title[zh ? 'zh' : 'en']}` }),
            h('span.mono', { text: String(n) }),
          ]),
          h('.meter', [h('.meter__fill', { style: { width: (n / max * 100) + '%' } })]),
        ]);
      })),
    );

    // 各任務繳交狀況
    const TASKS = ['t0', 't1-1', 't2-1', 't5-1', 't6-1', 't6-3', 't7-1', 't8', 't9', 't10', 't10-3'];
    live.append(
      eyebrow(zh ? '各任務繳交' : 'HAND-INS'),
      h('.cols-3', TASKS.map(id => {
        const rows = allWork(id);
        return h('.card', [
          h('p.mono', { style: { margin: 0, fontSize: 'var(--t-lg)', color: rows.length ? 'var(--clay-lit)' : 'var(--fg-3)' }, text: String(rows.length) }),
          h('p', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: id.toUpperCase() }),
        ]);
      })),
    );

    // 空位狀態
    live.append(
      eyebrow(zh ? '空位' : 'THE SLOTS'),
      h('.cols-3', SLOTS.map(s => {
        const open = state.cls.session >= s.unlock;
        const turns = (state.agent[s.id] && state.agent[s.id].turns) || [];
        return h('.card', [
          h('p.card__title', { text: s.who[zh ? 'zh' : 'en'] }),
          h('p.muted', { style: { margin: 0, fontSize: 'var(--t-xs)' }, text: open
            ? (state.cls.condition === 'agent'
                ? `${turns.length} ${zh ? '則對話' : 'turns'}`
                : (zh ? '對照組・留白' : 'control · blank'))
            : `${zh ? '第' : 'opens in session'} ${s.unlock} ${zh ? '節開放' : ''}` }),
        ]);
      })),
    );
  };
  root.append(live);
  paintLive();
  offs.push(subscribe(() => paintLive()));

  /* ---------- 匯出 ---------- */
  const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');

  const exportJson = () => {
    downloadFile(`hwc-${state.cls.code}-${stamp()}.json`, JSON.stringify(snapshot(), null, 2));
    toast(zh ? '匯出好了' : 'Exported');
  };

  const exportNotesCsv = () => {
    const rows = [['id', 'ts', 'iso', 'session', 'author', 'authorId', 'group', 'side', 'slot', 'who', 'cares', 'namesAbsent', 'body']];
    notesList().forEach(n => rows.push([
      n.id, n.ts, new Date(n.ts).toISOString(), n.session, n.author, n.authorId, n.group,
      n.side, n.slot || '', n.who, n.cares, n.namesAbsent ? 1 : 0, n.body,
    ]));
    downloadFile(`hwc-notes-${state.cls.code}-${stamp()}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
  };

  const exportEna = () => {
    const head = ['unit', 'conversation', 'line', 'ts', 'condition', 'session', 'group', 'speaker', ...CODES.map(c => c.id), 'text'];
    const rows = [head];
    notesList().forEach((n, i) => {
      rows.push([
        n.authorId || n.author || 'unknown',
        `${state.cls.code}-s${n.session}`,
        i + 1,
        new Date(n.ts).toISOString(),
        state.cls.condition,
        n.session,
        n.group || '',
        n.who || '',
        ...CODES.map(c => (c.test(n) ? 1 : 0)),
        n.body,
      ]);
    });
    downloadFile(`hwc-ena-${state.cls.code}-${stamp()}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
    toast(zh ? '編碼是自動初篩，正式分析請人工複核' : 'Codes are an automated first pass; verify by hand');
  };

  const fileIn = h('input', { type: 'file', accept: '.json', style: { display: 'none' } });
  fileIn.addEventListener('change', async () => {
    const f = fileIn.files[0]; if (!f) return;
    try {
      importSnapshot(JSON.parse(await f.text()));
      toast(zh ? '匯入完成' : 'Imported');
    } catch (e) { toast((zh ? '匯入失敗：' : 'Import failed: ') + e.message); }
    fileIn.value = '';
  });

  root.append(h('section.wrap--wide.section--tight.stack', [
    eyebrow(zh ? '資料' : 'DATA'),
    h('.row', [
      h('button.btn.btn--primary', { type: 'button', onclick: exportJson }, t('exportAll') + '（JSON）'),
      h('button.btn', { type: 'button', onclick: exportNotesCsv }, zh ? '貼文 CSV' : 'Notes CSV'),
      h('button.btn.btn--water', { type: 'button', onclick: exportEna }, t('exportEna')),
      h('button.btn', { type: 'button', onclick: () => fileIn.click() }, zh ? '匯入 JSON' : 'Import JSON'),
      fileIn,
      h('button.btn.btn--ghost', {
        type: 'button',
        onclick: () => {
          if (!confirm(zh ? '這會清掉這台裝置上這個班的所有資料。確定？' : 'This wipes this class on this device. Sure?')) return;
          wipeLocal(); toast(zh ? '清掉了' : 'Wiped');
        },
      }, zh ? '清空本機資料' : 'Wipe local data'),
    ]),
    h('.card', [
      h('p.card__title', { text: zh ? 'ENA 檔的欄位' : 'What is in the ENA file' }),
      h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
        ? 'unit 是學習者、conversation 是「班級-節次」，之後五欄是話語編碼的 0／1。編碼由關鍵詞規則自動產生，只能當初篩；NAMES_ABSENT 一欄取的是學生自己勾選的結果，不是猜的。'
        : 'unit is the learner, conversation is class-session, then five binary discourse codes. The codes come from keyword rules and are a first pass only. NAMES_ABSENT reflects the learner\'s own tick, not a guess.' }),
      h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
        ? '依變項的操作型定義要求「明確提及某一不在現場的對象，並說明該對象將如何受到所議方案影響」，後半段機器判不準，務必人工複核後再跑 ENA。'
        : 'The operational definition also requires stating how the absent party is affected. A machine cannot judge that reliably. Verify by hand before running ENA.' }),
    ]),
  ]));

  return () => offs.forEach(fn => fn());

  function dat(n, l) {
    return h('.datum', [h('.datum__n', { text: n }), h('.datum__l', { text: l })]);
  }
}

function toCsv(rows) {
  const cell = v => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return '﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n');
}
