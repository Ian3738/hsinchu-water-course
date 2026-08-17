/* 語言：中英切換。整站共用一個狀態，切換時重繪。 */
import { UI } from '../data/ui.js';

const KEY = 'hwc.lang';
const stored = localStorage.getItem(KEY);
let lang = ['zh', 'en'].includes(stored)
  ? stored
  : ((navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en');

const listeners = new Set();

export function getLang() { return lang; }

export function setLang(next) {
  if (next === lang || !['zh', 'en'].includes(next)) return;
  lang = next;
  localStorage.setItem(KEY, lang);
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant-TW' : 'en';
  listeners.forEach(fn => fn(lang));
}

export function onLang(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** 取雙語物件的當前語言字串；也接受純字串 */
export function L(obj) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] ?? obj.zh ?? obj.en ?? '';
}

/** 介面字串，%s 依序替換 */
export function t(key, ...args) {
  const v = UI[key];
  let s = v == null ? key : L(v);
  args.forEach(a => { s = s.replace('%s', a); });
  return s;
}

/** 取雙語陣列 */
export function LA(obj) {
  if (!obj) return [];
  return Array.isArray(obj) ? obj : (obj[lang] ?? obj.zh ?? []);
}

document.documentElement.dataset.lang = lang;
document.documentElement.lang = lang === 'zh' ? 'zh-Hant-TW' : 'en';
