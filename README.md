# 頭前溪借水課

> 你家水龍頭的水，是跟誰借的？

新竹頭前溪流域的十節在地探究課。從新加坡的水治理起手，走過上坪溪引水、竹東大圳借道、寶二水庫徵地、跨流域配置、霄裡溪廢水與地下水，最後把整件事做成一個看得見的東西。

課程網站含所有課堂互動：觀點畫布、引水模擬、辯論計時、河川帳單、聽證會、三版草稿寫作、交換測試。另含 Google 登入、班級管理後台與 QR code 入班。

---

## 快速上手

### 學生
掃老師給的 QR code → 用 Google 帳號登入 → 自動進班。

### 老師
1. 用 Google 登入
2. 請管理員把你的角色設成「老師」
3. 進「後台」開班，把 QR code 投影或印出來給學生掃

### 管理員
`mickey3738@gmail.com` 是系統管理員，登入後自動取得最高權限。
在後台可以調整任何人的角色、停用帳號、管理所有班級。

---

## 本機預覽

```bash
python3 devserver.py 4180
```

`devserver.py` 跟 `python3 -m http.server` 的差別只有一個：一律送 `no-store`。
瀏覽器對 ES module 的快取很黏，改了程式卻載到舊的會很難查。

---

## 架構

純靜態網站，沒有建置流程。原生 ES module，直接推上 GitHub Pages 就能跑。

```
index.html              單一入口，hash 路由
config.js               站台設定（Firebase、AI agent、影片路徑）
database.rules.json     資料庫安全規則 ← 權限真正的防線
devserver.py            本機預覽用的 no-cache 伺服器

assets/
  css/  tokens · base · components · responsive
  data/ course.js（十節課雙語內容）· personas.js（未在場者）· ui.js（介面字串）
  js/   main（路由）· auth（登入與角色）· store（狀態與同步）
        agent（AI 代言）· qr（QR 產生器）· ui · i18n
        views/ home · session · board · teacher · admin · join · lab
               labs/ flow · water · debate · invoice · hearing · writing · make
  img/bg/  十一張課程背景圖（WebP，含手機版）

worker/                 AI agent 的 Cloudflare Worker（可選）
```

### 為什麼有些東西是自己寫的

| 東西 | 為什麼不用現成的 |
|---|---|
| QR 產生器 | 教室網路不穩時 CDN 掛掉就印不出來；也少一個供應鏈風險。已對 300 組隨機字串與參考實作逐格比對，完全一致。 |
| 引水模擬 | 這是課程內容本身，不是通用圖表 |
| 話語編碼 | 依變項的操作型定義是這個研究專有的 |

---

## 權限模型

四級角色。**權限由 `database.rules.json` 在伺服器端強制**，前端只決定畫面顯示什麼——就算有人改前端，也拿不到別班的資料。

| 角色 | 能做什麼 |
|---|---|
| `superadmin` | 全部。只有 `mickey3738@gmail.com`，**規則層寫死保護**：任何人（包括其他管理員）都不能改它的角色、不能停用、不能刪除 |
| `admin` | 管理所有使用者與班級 |
| `teacher` | 開自己的班、管自己班的學生與資料 |
| `student` | 進自己被加入的班 |

新使用者第一次登入預設是 `student`，要由管理員升級。

資料路徑：

```
users/{uid}/profile      本人與管理員可寫
users/{uid}/role         只有管理員可寫，超管那筆規則層擋住
classes/{cid}            老師寫自己的，管理員寫全部
members/{cid}/{uid}      學生只能加自己
data/{cid}/notes|votes|work|agent|peers
                         必須是該班成員；貼文的 authorId 必須等於 auth.uid
```

改完規則要重新部署：

```bash
npx firebase-tools deploy --only database
```

---

## Firebase 設定狀態

專案 `hsinchu-water-course`（Realtime Database 在 asia-southeast1）已建好，設定寫在 `config.js`。

`apiKey` 是設計上就會公開的識別碼，不是密碼——安全靠上面那份規則，不是靠藏這串字。

### 還需要手動做的一件事

**在 Firebase Console 啟用 Google 登入**。這一步只有 Console 有，因為它會順帶建立 OAuth 同意畫面：

1. 開 https://console.firebase.google.com/project/hsinchu-water-course/authentication/providers
2. 點「Google」→ 開啟 → 選一個支援信箱 → 儲存
3. 到 Authentication → Settings → Authorized domains，把 GitHub Pages 的網域加進去

沒做這步的話，登入按鈕會出現但按下去會失敗；網站其餘功能照常，資料存在本機瀏覽器。

---

## AI agent

觀點畫布上保留六個「還沒有人替他說話」的空位，對應六個未在場者：上坪溪、大圳的農民、交出土地的人、中港溪谷地、新埔居民、還沒出生的人。依節次逐一解鎖。

兩種模式，由 `config.js` 的 `agentEngine` 決定：

- **`script`（預設）** 內建人設腳本。離線可用、回應固定、不會亂講話。先導測試與需要控制干擾變項時建議用這個。
- **`live`** 呼叫自架的 Cloudflare Worker，金鑰放在 Worker 的 secret，前端拿不到。部署方式見 [`worker/README.md`](worker/README.md)。

兩種模式共用同一套發言守則：**只講第一人稱處境、不提供事實資料、不評價對錯、不提出解決方案**。守則組在伺服器端（live 模式）或寫死在腳本裡（script 模式），前端改不動——兩個班拿到的行為必須一致，實驗才有意義。

---

## 研究用

課程設計對應一項準實驗：自變項是觀點畫布上空位的處理方式。

- **實驗組** `condition: 'agent'` — AI agent 進駐空位，以第一人稱發言並回應提問
- **對照組** `condition: 'blank'` — 空位維持空白，僅標示尚無人為其發言

除此單一差異外，教學內容、時數、教師與任務完全相同。老師在後台切換，或用網址參數指定。

依變項是「指認未在場者」的話語頻率。教師控制台可匯出：

- **JSON** 全班原始資料
- **貼文 CSV** 逐則貼文
- **ENA CSV** 話語編碼矩陣，欄位為 `unit`（學習者）、`conversation`（班級-節次）與五個 0／1 編碼

> ⚠️ ENA 檔的編碼是關鍵詞規則自動產生的**初篩**。`NAMES_ABSENT` 取的是學生自己勾選的結果，但操作型定義還要求「說明該對象將如何受到所議方案影響」，這半段機器判不準。正式分析前務必人工複核。

模擬器同理：引水與放流的數字是**相對比例的教學模型**，不是水文推估。真實數字要去水利署與環境部查。這一點在網站上也寫給學生看。

---

## 無障礙與裝置

- 斷點 480 / 720 / 900 / 1200 / 1600，手機到投影機都排得開
- 觸控裝置命中範圍加大，輸入框字級 ≥16px（iOS 才不會自動縮放）
- 支援 `prefers-reduced-motion`、`prefers-contrast`
- 背景圖分 1920w 與 960w 兩種尺寸，用 `srcset` 依裝置選
- 按 `P` 開投影模式（字級放大）、`B` 跳到觀點畫布、方向鍵換節次
- 有列印樣式，任務單可以直接印

---

## 影片

`media/` 放兩支課程影片（課前循環、第 1 節上坪溪）。mp4 預設不進版控，見 `.gitignore`。要一起推上 GitHub 就用 Git LFS，或把檔案放別的空間再把網址填進 `config.js`。

---

## 授權與素材

課程內容出自簡報 `Hsinchu_Borrowed_Water_Class_Deck_EN.pptx`。背景圖以 Gemini 生成（日式寫實動畫風）。配色與字體沿用簡報：`#0F2E3D` `#1B6B80` `#D97742` `#9AB2BC`。
