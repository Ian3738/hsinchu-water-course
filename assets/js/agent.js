/* ============================================================
   AI agent — 替未在場者發言
   兩種引擎：
     script  內建人設腳本，離線、固定、可重現（先導與對照建議用）
     live    呼叫自架 Worker，金鑰在伺服器端，前端拿不到
   兩者的守則一致：只講第一人稱處境，不給事實、不評對錯、不出解方。
   ============================================================ */
import { CONFIG } from '../../config.js';
import { BY_SLOT, REFUSALS, classify, GUARDRAILS } from '../data/personas.js';
import { getLang, L } from './i18n.js';
import { state } from './store.js';

/* ---------- 腳本引擎 ---------- */

function scriptReply(slotId, question) {
  const p = BY_SLOT[slotId];
  if (!p) return '';
  const lang = getLang();
  const q = (question || '').trim();

  // 開場：還沒問問題時，先講立場
  if (!q) return L(p.stance);

  // 職權外的問題先擋掉
  const kind = classify(q);
  if (kind) return L(REFUSALS[kind]);

  // 關鍵詞比對
  const lower = q.toLowerCase();
  let best = null, bestHits = 0;
  for (const item of p.qa) {
    const hits = item.k.filter(k => lower.includes(k.toLowerCase())).length;
    if (hits > bestHits) { best = item; bestHits = hits; }
  }
  if (best) return best[lang] || best.zh;

  // 比對不到：回到自己的處境，並把問題丟回去
  return L(REFUSALS.offtopic) + ' ' + L(p.ask);
}

/* ---------- live 引擎 ---------- */

async function liveReply(slotId, question, turns) {
  const p = BY_SLOT[slotId];
  const lang = getLang();
  const res = await fetch(CONFIG.agentEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slot: slotId,
      lang,
      persona: {
        who: L(p.who),
        tag: L(p.tag),
        stance: L(p.stance),
      },
      guardrails: GUARDRAILS[lang] || GUARDRAILS.zh,
      // 讓 agent 知道學生在畫布上提了什麼，才能說「你們的提案會讓我怎樣」
      context: recentProposals(),
      history: (turns || []).slice(-8).map(t => ({ role: t.role, text: t.text })),
      question,
    }),
  });
  if (!res.ok) throw new Error('agent ' + res.status);
  const data = await res.json();
  const text = (data.text || '').trim();
  if (!text) throw new Error('empty');
  return text;
}

/** 畫布上最近幾則學生貼文，給 live agent 當上下文 */
function recentProposals() {
  return Object.values(state.notes || {})
    .filter(n => !n.slot)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 6)
    .map(n => `${n.who}（在意${n.cares}）：${n.body}`);
}

/* ---------- 對外 ---------- */

export function engine() {
  return CONFIG.agentEngine === 'live' && CONFIG.agentEndpoint ? 'live' : 'script';
}

/**
 * 取得 agent 的一句話。
 * question 留空 = 請它開場陳述立場。
 * live 失敗時自動退回腳本，課堂不會開天窗。
 */
export async function speak(slotId, question = '', turns = []) {
  if (engine() === 'live') {
    try {
      return { text: await liveReply(slotId, question, turns), via: 'live' };
    } catch (e) {
      console.warn('live agent 失敗，改用腳本', e);
      return { text: scriptReply(slotId, question), via: 'script-fallback' };
    }
  }
  // 腳本模式也給一點延遲，讓「正在想」的狀態有意義
  await new Promise(r => setTimeout(r, 380 + Math.random() * 420));
  return { text: scriptReply(slotId, question), via: 'script' };
}

/** 空位一律由 agent 進駐（已不再分實驗組／對照組） */
export function agentEnabled() {
  return true;
}
