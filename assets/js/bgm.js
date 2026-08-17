/* ============================================================
   背景音樂
   ------------------------------------------------------------
   預設關閉。瀏覽器本來就會擋自動播放，而且沒問過就放音樂
   對課堂是干擾——老師要用才開。

   音量刻意壓很低（0.16），設計上要能讓人在上面講話。
   開關記在這台裝置，下次進來維持上次的選擇。
   ============================================================ */
import { h, qs } from './ui.js';
import { getLang } from './i18n.js';

const KEY = 'hwc.bgm';
const SRC = 'media/ambient.mp3';
const VOL = 0.16;

let audio = null;
let on = localStorage.getItem(KEY) === 'on';
let available = true;

function ensure() {
  if (audio) return audio;
  audio = new Audio(SRC);
  audio.loop = true;
  audio.preload = 'none';
  audio.volume = 0;
  audio.addEventListener('error', () => {
    available = false;
    paintButton();
  });
  return audio;
}

/** 淡入淡出，直接切會嚇到人 */
function fade(to, ms = 900) {
  const a = ensure();
  const from = a.volume;
  const t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / ms);
    a.volume = from + (to - from) * k;
    if (k < 1) requestAnimationFrame(step);
    else if (to === 0) a.pause();
  };
  requestAnimationFrame(step);
}

export async function toggleBgm() {
  const a = ensure();
  if (on) {
    on = false;
    localStorage.setItem(KEY, 'off');
    fade(0);
  } else {
    try {
      a.volume = 0;
      await a.play();          // 一定要由使用者的動作觸發，不然會被擋
      on = true;
      localStorage.setItem(KEY, 'on');
      fade(VOL);
    } catch (e) {
      console.warn('背景音樂播不起來', e);
      available = false;
    }
  }
  paintButton();
}

export function bgmOn() { return on; }

let btn = null;

export function bgmButton() {
  btn = h('button.bgm', {
    type: 'button',
    onclick: toggleBgm,
  });
  paintButton();
  return btn;
}

function paintButton() {
  if (!btn) return;
  const zh = getLang() === 'zh';
  btn.hidden = !available;
  btn.setAttribute('aria-pressed', String(on));
  btn.title = on
    ? (zh ? '關掉背景音樂' : 'Turn off background music')
    : (zh ? '播放背景音樂' : 'Play background music');
  btn.setAttribute('aria-label', btn.title);
  btn.innerHTML = on ? WAVE : MUTE;
}

/* 內嵌 SVG，不外連 */
const MUTE = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none"
  stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
  <path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/></svg>`;

const WAVE = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none"
  stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
  <path d="M4 9v6h4l5 4V5L8 9H4z"/>
  <path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>`;

/** 上次選了開，這次進來要接回去。仍然需要一次點擊，瀏覽器規定。 */
export function restoreBgm() {
  if (localStorage.getItem(KEY) !== 'on') return;
  const kick = async () => {
    document.removeEventListener('pointerdown', kick);
    document.removeEventListener('keydown', kick);
    const a = ensure();
    try { a.volume = 0; await a.play(); on = true; fade(VOL); paintButton(); }
    catch { /* 還是被擋就算了，使用者自己按 */ }
  };
  document.addEventListener('pointerdown', kick, { once: true });
  document.addEventListener('keydown', kick, { once: true });
}
