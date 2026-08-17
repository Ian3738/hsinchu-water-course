# AI agent proxy

網站本身不持有任何模型 API 金鑰。要用「連線模式」的 agent，就部署這支 Worker。

## 部署

```bash
cd worker
npx wrangler login
npx wrangler secret put GEMINI_API_KEY     # 貼上金鑰，不會存進 repo
npx wrangler deploy
```

部署完會拿到一組網址，例如 `https://hwc-agent.你的帳號.workers.dev`。
把它填進網站根目錄的 `config.js`：

```js
agentEngine: 'live',
agentEndpoint: 'https://hwc-agent.你的帳號.workers.dev/agent',
```

## 換成 Anthropic

改放 `ANTHROPIC_API_KEY` 這個 secret 就好，程式會自動改走 Anthropic。
兩個都放的話以 Anthropic 優先。

## 限制來源

上課前把 `wrangler.toml` 的 `ALLOWED_ORIGINS` 填成你的 Pages 網址再重新 deploy，
避免別人拿你的 Worker 去打模型。

## 為什麼守則寫在這裡

發言守則（只講第一人稱處境、不給事實、不評對錯、不出解方）組在 Worker 的
system prompt 裡，前端改不動。這樣兩個班拿到的 agent 行為才是一致的，
實驗才有意義。
