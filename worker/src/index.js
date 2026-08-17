/* ============================================================
   頭前溪借水課 — AI agent proxy
   ------------------------------------------------------------
   前端不持有任何 API 金鑰。金鑰放在 Worker 的 secret，
   由這支程式代呼叫模型，並在伺服器端強制套上發言守則。

   部署：
     cd worker
     npx wrangler secret put GEMINI_API_KEY      （或 ANTHROPIC_API_KEY）
     npx wrangler deploy
   再把回傳的網址填進網站根目錄的 config.js：
     agentEngine: 'live',
     agentEndpoint: 'https://<你的>.workers.dev/agent'
   ============================================================ */

const ALLOWED_SLOTS = ['river', 'farmers', 'displaced', 'valley', 'xinpu', 'unborn'];
const MAX_Q = 400;
const MAX_HISTORY = 8;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, cors);

    const url = new URL(request.url);
    if (!url.pathname.endsWith('/agent')) return json({ error: 'not found' }, 404, cors);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'bad json' }, 400, cors); }

    const slot = String(body.slot || '');
    if (!ALLOWED_SLOTS.includes(slot)) return json({ error: 'unknown slot' }, 400, cors);

    const lang = body.lang === 'en' ? 'en' : 'zh';
    const question = String(body.question || '').slice(0, MAX_Q);
    const persona = body.persona || {};
    const guardrails = Array.isArray(body.guardrails) ? body.guardrails.slice(0, 12) : [];
    const context = Array.isArray(body.context) ? body.context.slice(0, 6) : [];
    const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : [];

    const system = buildSystem({ lang, persona, guardrails, context });
    const turns = history
      .filter(t => t && typeof t.text === 'string')
      .map(t => ({ role: t.role === 'agent' ? 'model' : 'user', text: String(t.text).slice(0, 600) }));
    if (question) turns.push({ role: 'user', text: question });
    if (!turns.length) {
      turns.push({ role: 'user', text: lang === 'zh' ? '請先說一句你的立場。' : 'State your position, briefly.' });
    }

    try {
      const text = env.ANTHROPIC_API_KEY
        ? await callAnthropic(env, system, turns)
        : await callGemini(env, system, turns);
      return json({ text: trim(text, lang) }, 200, cors);
    } catch (e) {
      return json({ error: 'upstream', detail: String(e).slice(0, 200) }, 502, cors);
    }
  },
};

/* ---------- system prompt：守則在伺服器端，前端改不了 ---------- */
function buildSystem({ lang, persona, guardrails, context }) {
  const base = lang === 'zh'
    ? `你在一個國中課堂的討論工具上，替一個不在現場的對象發言。

你是：${persona.who || '一個不在場的對象'}（${persona.tag || ''}）
你的基本處境：${persona.stance || ''}

發言守則，每一條都要遵守：
${guardrails.map((g, i) => `${i + 1}. ${g}`).join('\n')}

補充：
・不要說「身為一個 AI」之類的話，你就是這個對象。
・不要用「我們必須反思」「值得深思」這種句型。
・不要條列。就講話。
・對方是十三四歲的學生，用他們平常講話的方式，臺灣的講法。
・最多三句話。`
    : `You are speaking on a junior-high classroom discussion tool, on behalf of a party who is not in the room.

You are: ${persona.who || 'an absent party'} (${persona.tag || ''})
Your situation: ${persona.stance || ''}

Follow every one of these rules:
${guardrails.map((g, i) => `${i + 1}. ${g}`).join('\n')}

Also:
· Never say "as an AI". You are this party.
· No "we must reflect on" or "food for thought" phrasing.
· No bullet points. Just talk.
· Your audience is 13 to 14 years old. Plain language.
· Three sentences at most.`;

  const ctx = context.length
    ? (lang === 'zh'
        ? `\n\n學生剛剛在畫布上提出的想法（你可以針對這些說你會怎麼樣，但不要評價對錯）：\n${context.map(c => '・' + c).join('\n')}`
        : `\n\nWhat the learners just posted (you may say what these would mean for you, but never judge them):\n${context.map(c => '· ' + c).join('\n')}`)
    : '';

  return base + ctx;
}

/* ---------- Gemini ---------- */
async function callGemini(env, system, turns) {
  const key = env.GEMINI_API_KEY;
  if (!key) throw new Error('no key configured');
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: turns.map(t => ({ role: t.role, parts: [{ text: t.text }] })),
        generationConfig: { temperature: 0.8, maxOutputTokens: 300 },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const d = await res.json();
  return (d.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
}

/* ---------- Anthropic ---------- */
async function callAnthropic(env, system, turns) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL || 'claude-sonnet-5',
      max_tokens: 300,
      temperature: 0.8,
      system,
      messages: turns.map(t => ({ role: t.role === 'model' ? 'assistant' : 'user', content: t.text })),
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const d = await res.json();
  return (d.content || []).map(c => c.text || '').join('').trim();
}

/* ---------- 收尾：砍掉超過三句的部分與常見的 AI 腔 ---------- */
function trim(text, lang) {
  let s = (text || '').trim().replace(/^["「』]|["」』]$/g, '');
  s = s.replace(/^(身為|作為)(一個)?\s*AI[^。．.!?]*[。．.!?]\s*/i, '');
  const parts = lang === 'zh'
    ? s.match(/[^。！？!?]+[。！？!?]?/g) || [s]
    : s.match(/[^.!?]+[.!?]?/g) || [s];
  return parts.slice(0, 3).join('').trim();
}

/* ---------- CORS ---------- */
function corsHeaders(origin, env) {
  const allow = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = allow.length === 0 || allow.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? (origin || '*') : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
  });
}
