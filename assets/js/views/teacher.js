/* 教師控制台：班級、進度、即時檢視、資料匯出 */
import { h, clear, eyebrow, field, toast, downloadFile, pill } from '../ui.js';
import { t, getLang } from '../i18n.js';
import { SESSIONS } from '../../data/course.js';
import { SLOTS } from '../../data/personas.js';
import {
  state, setClass, subscribe, sync, notesList, snapshot,
  importSnapshot, wipeLocal, allWork, allTalks, repliesFor,
} from '../store.js';
import { countWordsIn, cloudEl } from '../wordcloud.js';
import { SESSIONS as ALL_SESSIONS } from '../../data/course.js';
import { engine } from '../agent.js';

/* 話語編碼。自動標記只是初篩，正式分析仍須人工複核。
   TNA 看的是狀態之間的「轉移」，所以每一則貢獻只能有一個狀態；
   一則同時命中多個編碼時，依下面的順序取優先度最高的那個。 */
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

  const sessSel = h('select.select', { style: { maxWidth: '260px' } },
    SESSIONS.map(s => h('option', { value: String(s.n), selected: s.n === state.cls.session },
      `${String(s.n).padStart(2, '0')}　${s.title[zh ? 'zh' : 'en']}`)));
  sessSel.addEventListener('change', () => setClass({ session: Number(sessSel.value) }));

  root.append(h('section.wrap--wide.section--tight', [
    h('.card.on-ink.stack', [
      h('.cols-2', [
        field(t('classCode'), codeIn, zh ? '同一代碼的裝置會看到同一張畫布' : 'Devices sharing this code share a canvas'),
        field(zh ? '目前節次' : 'Current session', sessSel),
      ]),
      h('.row.row--tight', [
        sync.mode === 'live' ? pill(t('liveSync'), 'live') : null,
        pill(engine() === 'live' ? (zh ? 'AI：連線模式' : 'AI: live') : (zh ? 'AI：腳本模式' : 'AI: scripted'), 'agent'),
        pill(`${Object.keys(state.peers || {}).length} ${t('students')}`, ''),
      ]),
    ]),
  ]));

  /* ---------- 入班連結 ---------- */
  const joinLink = () => `${location.href.split('#')[0]}#/join?c=${state.cls.code}`;
  root.append(h('section.wrap--wide.section--tight.stack', [
    eyebrow(zh ? '發給學生的連結' : 'LINK TO HAND OUT'),
    h('.card', [
      h('p.mono', { style: { margin: 0, fontSize: 'var(--t-xs)', wordBreak: 'break-all', color: 'var(--fg-2)' }, text: joinLink() }),
      h('.row.row--tight', [
        h('button.btn.btn--sm', {
          type: 'button',
          onclick: async () => {
            try { await navigator.clipboard.writeText(joinLink()); toast(t('copied')); }
            catch { toast(zh ? '複製不了，請手動選取' : 'Copy failed'); }
          },
        }, t('copy')),
        h('a.btn.btn--sm', { href: '#/admin' }, zh ? '到後台看 QR' : 'QR in admin'),
      ]),
    ]),
  ]));

  /* ============================================================
     想法牆：全班在提問底下留的東西，即時進來。
     上面是文字雲（投影用），下面是每一則原文（老師要看得到誰寫了什麼）。
     ============================================================ */
  const wall = h('section.wrap--wide.section--tight.stack');
  root.append(wall);

  let wallFilter = 'all';   // all 或某個 qid

  const paintWall = () => {
    clear(wall);
    const talks = allTalks();
    const qids = [...new Set(talks.map(x => x.qid))];
    const rows = wallFilter === 'all' ? talks : talks.filter(x => x.qid === wallFilter);

    /* 題目切換 */
    const qLabel = qid => {
      const m = /^s(\d+)-b(\d+)$/.exec(qid || '');
      if (!m) return qid;
      const ses = ALL_SESSIONS.find(x => x.n === Number(m[1]));
      return `${String(m[1]).padStart(2, '0')}　${ses ? ses.title[zh ? 'zh' : 'en'] : ''}`;
    };

    wall.append(
      h('.row.row--between', [
        eyebrow(zh ? '想法牆・即時' : 'THE WALL · LIVE'),
        h('.row.row--tight', [
          h('span.pill', { data: { tone: 'live' } }, [h('span.pill__dot'),
            `${talks.length} ${zh ? '則想法' : 'thoughts'}`]),
          h('span.pill', [h('span.pill__dot'),
            `${new Set(talks.map(x => x.by)).size} ${zh ? '人參與' : 'contributors'}`]),
        ]),
      ]),
    );

    if (qids.length > 1) {
      const sel = h('select.select', { style: { maxWidth: '320px' } }, [
        h('option', { value: 'all', selected: wallFilter === 'all' }, zh ? '全部題目' : 'All questions'),
        ...qids.map(q => h('option', { value: q, selected: wallFilter === q }, qLabel(q))),
      ]);
      sel.addEventListener('change', () => { wallFilter = sel.value; paintWall(); });
      wall.append(sel);
    }

    /* 文字雲 */
    const words = countWordsIn(rows.map(r => r.text), 44);
    wall.append(cloudEl(h, words));
    if (words.length) {
      wall.append(h('p.note-line', {
        text: zh
          ? '字越大代表越多人提到。這是用 n-gram 算的，不是精確斷詞——當成「大家的注意力在哪」來看就好。'
          : 'Larger means more often mentioned. Computed with n-grams, not a real segmenter; read it as where attention is, not as precise terms.',
      }));
    }

    /* 每一則原文 */
    if (!rows.length) {
      wall.append(h('p.muted', { text: zh ? '學生還沒開始留想法。' : 'No thoughts yet.' }));
      return;
    }
    wall.append(
      eyebrow(zh ? '每一則' : 'EVERY THOUGHT'),
      h('.cols-2', rows.slice().reverse().map(r => {
        const reps = repliesFor(r.qid, r.ts);
        return h('.card.stack-sm', [
          h('.row.row--between', [
            h('span.mono', { style: { fontSize: 'var(--t-micro)', color: 'var(--water-lit)' },
                             text: (r.name || (zh ? '匿名' : 'anon')) + (r.group ? '・' + r.group : '') }),
            h('span.mono', { style: { fontSize: '10px', color: 'var(--fg-3)' }, text: qLabel(r.qid) }),
          ]),
          h('p', { style: { margin: 0, fontSize: 'var(--t-sm)', lineHeight: 1.65 }, text: r.text }),
          reps.length ? h('.talk__reps', reps.map(x => h('.talk__rep', [
            h('span.talk__who', { text: (x.name || '') + (x.group ? '・' + x.group : '') }),
            h('span', { text: x.text }),
          ]))) : null,
        ].filter(Boolean));
      })),
    );
  };

  paintWall();
  offs.push(subscribe(w => { if (w === 'work') paintWall(); }));

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
            ? `${turns.length} ${zh ? '則對話' : 'turns'}`
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

  /* ---- TNA ----
     tna 套件吃兩種輸入：
       long  每列一個事件：actor / time / action
       wide  每列一位學習者：T1, T2, … 依序的狀態
     兩種都給，研究者選一種用。 */

  /** 一則貢獻的單一狀態：依 CODES 的順序取第一個命中的 */
  const stateOf = n => {
    const hit = CODES.find(c => c.test(n));
    return hit ? hit.id : 'OTHER';
  };

  const exportTnaLong = () => {
    const rows = [['actor', 'time', 'order', 'action', 'session', 'group', 'speaker', 'text']];
    const seen = {};
    notesList().forEach(n => {
      const actor = n.authorId || n.author || 'unknown';
      seen[actor] = (seen[actor] || 0) + 1;
      rows.push([
        actor,
        new Date(n.ts).toISOString(),
        seen[actor],
        stateOf(n),
        n.session,
        n.group || '',
        n.who || '',
        n.body,
      ]);
    });
    downloadFile(`hwc-tna-long-${state.cls.code}-${stamp()}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
    toast(zh ? '編碼是自動初篩，正式分析請人工複核' : 'Codes are an automated first pass; verify by hand');
  };

  const exportTnaWide = () => {
    const bySeq = {};
    notesList().forEach(n => {
      const actor = n.authorId || n.author || 'unknown';
      (bySeq[actor] = bySeq[actor] || []).push(stateOf(n));
    });
    const longest = Math.max(1, ...Object.values(bySeq).map(a => a.length));
    const head = ['actor', ...Array.from({ length: longest }, (_, i) => 'T' + (i + 1))];
    const rows = [head];
    Object.entries(bySeq).forEach(([actor, seq]) => {
      rows.push([actor, ...seq, ...Array(longest - seq.length).fill('')]);
    });
    downloadFile(`hwc-tna-wide-${state.cls.code}-${stamp()}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
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
      h('button.btn.btn--water', { type: 'button', onclick: exportTnaLong }, t('exportTna') + ' long'),
      h('button.btn.btn--water', { type: 'button', onclick: exportTnaWide }, t('exportTna') + ' wide'),
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
      h('p.card__title', { text: zh ? 'TNA 檔怎麼讀' : 'What is in the TNA files' }),
      h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
        ? 'long 檔每列是一個事件：actor（學習者）、time（時間）、order（該學習者的第幾則）、action（狀態）。wide 檔每列是一位學習者，T1 起依序排開。tna 套件兩種都吃。'
        : 'The long file has one row per event: actor, time, order, action. The wide file has one row per learner with states in order from T1. The tna package takes either.' }),
      h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
        ? 'TNA 算的是狀態之間的轉移，所以一則貢獻只能有一個狀態。一則同時命中多個編碼時，依 NAMES_ABSENT → CITE → RESPOND → QUESTION → CLAIM 的順序取第一個；都沒中就是 OTHER。這個優先序會直接影響轉移矩陣，換順序前先想清楚。'
        : 'TNA models transitions between states, so each contribution carries exactly one. When several codes match, the first of NAMES_ABSENT → CITE → RESPOND → QUESTION → CLAIM wins; none matching gives OTHER. This ordering shapes the transition matrix — think before changing it.' }),
      h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
        ? 'NAMES_ABSENT 取的是學生自己勾選的結果，不是猜的。其餘四個由關鍵詞規則產生，只能當初篩，跑分析前務必人工複核。'
        : 'NAMES_ABSENT reflects the learner\'s own tick. The other four come from keyword rules and are a first pass only. Verify by hand before analysis.' }),
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
