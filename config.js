/* ============================================================
   站台設定
   ------------------------------------------------------------
   兩項都留空也能上課：資料存在瀏覽器本機，AI agent 走內建腳本。
   要跨裝置同步或接真的生成式 agent，才需要填。

   ⚠️ 這個檔會被推上 GitHub。絕對不要把 Gemini / Anthropic /
      OpenAI 的 API 金鑰寫在這裡。金鑰只能放在 Worker 的環境變數。
      Firebase 的 apiKey 是設計上就會公開的識別碼，安全靠資料庫規則，
      不是靠隱藏這串字（規則寫法見 README）。
   ============================================================ */

export const CONFIG = {

  /* ---- Firebase：登入、權限、跨裝置即時同步 ----
     專案 hsinchu-water-course（新加坡節點）。
     apiKey 是設計上就會公開的識別碼，不是密碼；
     權限由 database.rules.json 在伺服器端把關。 */
  firebase: {
    apiKey: 'AIzaSyD_GfoBRbXWxQ7P3nTVZMURhX4VOKav0CQ',
    authDomain: 'hsinchu-water-course.firebaseapp.com',
    databaseURL: 'https://hsinchu-water-course-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'hsinchu-water-course',
    storageBucket: 'hsinchu-water-course.firebasestorage.app',
    messagingSenderId: '882380779553',
    appId: '1:882380779553:web:032e06ab36a5e96e33f360',
  },

  /* 系統管理員。這組帳號在資料庫規則裡受保護：
     任何人都不能改它的角色，也不能停用或刪除它。
     改這一行不會鬆綁規則——規則裡是各自寫死的。 */
  superAdmin: 'mickey3738@gmail.com',

  /* ---- AI agent ----
     'script'  內建人設腳本。離線可用，回應固定，不會亂講話。
     'live'    呼叫你自己部署的 Worker（金鑰在 Worker 那邊，不在這裡）。
     腳本模式是預設，也是先導測試建議用的模式。 */
  agentEngine: 'script',
  agentEndpoint: '',      // 例：'https://hwc-agent.your-name.workers.dev/agent'

  /* ---- 預設班級 ----
     老師可在控制台改，或用網址參數指定：
       ?class=703&cond=agent   實驗組
       ?class=704&cond=blank   對照組 */
  defaultClass: 'demo',
  defaultCondition: 'agent',   // 'agent' 實驗組 ｜ 'blank' 對照組

  /* ---- 影片 ----
     把課前循環與第 1 節的影片檔放進 media/，或填外部網址。 */
  media: {
    intro: 'media/intro.mp4',
    s1:    'media/s1-shangping.mp4',
  },
};
