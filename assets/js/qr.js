/* ============================================================
   QR code 產生器（byte 模式，錯誤更正等級 M，版本 1–16）
   自己實作，不依賴外部函式庫：教室網路不穩也印得出來。

   用法：
     const m = qrMatrix('https://example.com/#/join?c=703a');
     el.append(qrSvg(m, { size: 240 }));
   ============================================================ */

/* ---------- GF(256) ---------- */
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

const gmul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];

function rsGenerator(deg) {
  let poly = [1];
  for (let i = 0; i < deg; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gmul(poly[j], EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  // 上面是常數項在前，除法迴圈要的是最高次在前
  return poly.reverse();
}

function rsEncode(data, ecLen) {
  const gen = rsGenerator(ecLen);
  const res = new Uint8Array(ecLen);
  for (const byte of data) {
    const factor = byte ^ res[0];
    res.copyWithin(0, 1);
    res[ecLen - 1] = 0;
    for (let i = 0; i < ecLen; i++) res[i] ^= gmul(gen[i + 1], factor);
  }
  return res;
}

/* ---------- 版本表（等級 M）----------
   [每塊 EC 碼字數, 第一組塊數, 第一組資料碼字, 第二組塊數, 第二組資料碼字] */
const RS_M = {
  1:  [10, 1, 16, 0, 0],   2:  [16, 1, 28, 0, 0],   3:  [26, 1, 44, 0, 0],
  4:  [18, 2, 32, 0, 0],   5:  [24, 2, 43, 0, 0],   6:  [16, 4, 27, 0, 0],
  7:  [18, 4, 31, 0, 0],   8:  [22, 2, 38, 2, 39],  9:  [22, 3, 36, 2, 37],
  10: [26, 4, 43, 1, 44],  11: [30, 1, 50, 4, 51],  12: [22, 6, 36, 2, 37],
  13: [22, 8, 37, 1, 38],  14: [24, 4, 40, 5, 41],  15: [24, 5, 41, 5, 42],
  16: [28, 7, 45, 3, 46],
};

/* 對齊圖樣中心座標 */
const ALIGN = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
  7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
  11: [6, 30, 54], 12: [6, 32, 58], 13: [6, 34, 62],
  14: [6, 26, 46, 66], 15: [6, 26, 48, 70], 16: [6, 26, 50, 74],
};

const dataCapacity = v => {
  const [ec, b1, d1, b2, d2] = RS_M[v];
  return b1 * d1 + b2 * d2;
};

/* ---------- BCH ---------- */
function bch(value, poly, deg) {
  let v = value << deg;
  const bits = n => 32 - Math.clz32(n);
  while (bits(v) >= bits(poly)) v ^= poly << (bits(v) - bits(poly));
  return (value << deg) | v;
}

const formatBits = mask => bch((0b00 << 3) | mask, 0b10100110111, 10) ^ 0b101010000010010;
const versionBits = v => bch(v, 0b1111100100101, 12);

/* ---------- 主流程 ---------- */

/** forceMask 只給測試用；正常呼叫不帶，會自動挑罰分最低的遮罩 */
export function qrMatrix(text, { forceMask = null } = {}) {
  const bytes = new TextEncoder().encode(text);

  let version = 0;
  for (let v = 1; v <= 16; v++) {
    const lenBits = v < 10 ? 8 : 16;
    if (dataCapacity(v) * 8 >= 4 + lenBits + bytes.length * 8) { version = v; break; }
  }
  if (!version) throw new Error('QR：內容太長，超過版本 16 的容量');

  const size = version * 4 + 17;
  const [ecLen, b1, d1, b2, d2] = RS_M[version];
  const totalData = dataCapacity(version);

  /* --- 位元串 --- */
  const bits = [];
  const push = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); };

  push(0b0100, 4);                                   // byte 模式
  push(bytes.length, version < 10 ? 8 : 16);         // 字元數
  bytes.forEach(b => push(b, 8));

  const cap = totalData * 8;
  for (let i = 0; i < 4 && bits.length < cap; i++) bits.push(0);   // 終止符
  while (bits.length % 8) bits.push(0);
  const pad = [0xec, 0x11];
  for (let i = 0; bits.length < cap; i++) push(pad[i % 2], 8);

  const dataBytes = new Uint8Array(totalData);
  for (let i = 0; i < totalData; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
    dataBytes[i] = b;
  }

  /* --- 分塊、算 EC、交錯 --- */
  const blocks = [];
  let off = 0;
  for (let i = 0; i < b1; i++) { blocks.push(dataBytes.slice(off, off + d1)); off += d1; }
  for (let i = 0; i < b2; i++) { blocks.push(dataBytes.slice(off, off + d2)); off += d2; }
  const ecBlocks = blocks.map(b => rsEncode(b, ecLen));

  const out = [];
  const maxData = Math.max(d1, d2);
  for (let i = 0; i < maxData; i++) blocks.forEach(b => { if (i < b.length) out.push(b[i]); });
  for (let i = 0; i < ecLen; i++) ecBlocks.forEach(b => out.push(b[i]));

  /* --- 排版 --- */
  const m = Array.from({ length: size }, () => new Int8Array(size).fill(-1));  // -1 = 尚未填
  const fn = Array.from({ length: size }, () => new Uint8Array(size));         // 1 = 功能區

  const setFn = (r, c, v) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    m[r][c] = v; fn[r][c] = 1;
  };

  // 尋像圖樣與分隔
  const finder = (r0, c0) => {
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
      const inRing = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                     (c >= 0 && c <= 6 && (r === 0 || r === 6));
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      setFn(r0 + r, c0 + c, (inRing || inCore) ? 1 : 0);
    }
  };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);

  // 時序圖樣
  for (let i = 8; i < size - 8; i++) { setFn(6, i, i % 2 === 0 ? 1 : 0); setFn(i, 6, i % 2 === 0 ? 1 : 0); }

  // 對齊圖樣
  const ap = ALIGN[version];
  ap.forEach(r => ap.forEach(c => {
    if ((r <= 7 && c <= 7) || (r <= 7 && c >= size - 8) || (r >= size - 8 && c <= 7)) return;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      const edge = Math.max(Math.abs(dr), Math.abs(dc));
      setFn(r + dr, c + dc, edge !== 1 ? 1 : 0);
    }
  }));

  // 固定的暗模組 + 格式資訊保留區
  // 左上：第 8 列 0..8 與第 8 欄 0..8，但要跳過 6（那是時序圖樣，不能蓋）
  for (let i = 0; i <= 8; i++) {
    if (i === 6) continue;
    setFn(8, i, 0);
    setFn(i, 8, 0);
  }
  // 第二份：左下 8 格 + 右上 8 格 = 16 格，放 15 個位元與 1 個固定暗模組
  for (let i = 0; i < 8; i++) { setFn(size - 1 - i, 8, 0); setFn(8, size - 1 - i, 0); }
  setFn(size - 8, 8, 1);

  // 版本資訊（第 7 版以上）
  if (version >= 7) {
    const vb = versionBits(version);
    for (let i = 0; i < 18; i++) {
      const bit = (vb >> i) & 1;
      setFn(Math.floor(i / 3), size - 11 + (i % 3), bit);
      setFn(size - 11 + (i % 3), Math.floor(i / 3), bit);
    }
  }

  // 資料：由右下角起，兩欄一組蛇行
  let bi = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;                    // 跳過時序欄
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        const upward = ((right + 1) & 2) === 0;
        const r = upward ? size - 1 - vert : vert;
        if (fn[r][c]) continue;
        const byte = out[bi >> 3];
        m[r][c] = byte === undefined ? 0 : (byte >> (7 - (bi & 7))) & 1;
        bi++;
      }
    }
  }

  /* --- 選遮罩 --- */
  let best = null, bestPenalty = Infinity;
  const masks = forceMask === null ? [0, 1, 2, 3, 4, 5, 6, 7] : [forceMask];
  for (const mask of masks) {
    const cand = m.map(row => Int8Array.from(row));
    applyMask(cand, fn, mask, size);
    writeFormat(cand, mask, size);
    const p = penalty(cand, size);
    if (p < bestPenalty) { bestPenalty = p; best = cand; }
  }

  return best.map(row => Array.from(row, v => v === 1));
}

function applyMask(m, fn, mask, size) {
  const f = [
    (r, c) => (r + c) % 2 === 0,
    (r) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ][mask];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (!fn[r][c] && f(r, c)) m[r][c] ^= 1;
  }
}

function writeFormat(m, mask, size) {
  const bitsVal = formatBits(mask);
  for (let i = 0; i < 15; i++) {
    // 放置順序是由高位到低位：位置 i 對應第 (14-i) 個位元
    const bit = (bitsVal >> (14 - i)) & 1;
    // 第一份，繞著左上角的尋像圖樣（跳過第 6 列與第 6 欄的時序）
    if (i < 6) m[8][i] = bit;
    else if (i === 6) m[8][7] = bit;
    else if (i === 7) m[8][8] = bit;
    else if (i === 8) m[7][8] = bit;
    else m[14 - i][8] = bit;
    // 第二份：前 7 位在左下的第 8 欄，後 8 位在右上的第 8 列
    if (i < 7) m[size - 1 - i][8] = bit;
    else m[8][size - 15 + i] = bit;
  }
  // 固定暗模組，位置在左下格式區的正上方
  m[size - 8][8] = 1;
}

function penalty(m, size) {
  let score = 0;

  // 規則 1：連續同色
  const run = get => {
    for (let a = 0; a < size; a++) {
      let last = -1, len = 0;
      for (let b = 0; b < size; b++) {
        const v = get(a, b);
        if (v === last) { len++; }
        else { if (len >= 5) score += len - 2; last = v; len = 1; }
      }
      if (len >= 5) score += len - 2;
    }
  };
  run((r, c) => m[r][c]);
  run((c, r) => m[r][c]);

  // 規則 2：2×2 同色
  for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++) {
    const v = m[r][c];
    if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
  }

  // 規則 3：類尋像圖樣
  const P1 = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const P2 = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const match = (get, a, b, pat) => {
    for (let k = 0; k < 11; k++) if (get(a, b + k) !== pat[k]) return false;
    return true;
  };
  for (let r = 0; r < size; r++) for (let c = 0; c <= size - 11; c++) {
    if (match((a, b) => m[a][b], r, c, P1) || match((a, b) => m[a][b], r, c, P2)) score += 40;
    if (match((a, b) => m[b][a], r, c, P1) || match((a, b) => m[b][a], r, c, P2)) score += 40;
  }

  // 規則 4：黑白比例
  let dark = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (m[r][c]) dark++;
  const pct = dark * 100 / (size * size);
  score += Math.floor(Math.abs(pct - 50) / 5) * 10;

  return score;
}

/* ---------- 輸出 ---------- */

/** 產生 SVG 元素 */
export function qrSvg(matrix, { size = 240, quiet = 4, dark = '#0F2E3D', light = '#FFFFFF', title = 'QR code' } = {}) {
  const n = matrix.length;
  const total = n + quiet * 2;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${total} ${total}`);
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('role', 'img');
  svg.setAttribute('shape-rendering', 'crispEdges');

  const t = document.createElementNS(NS, 'title');
  t.textContent = title;
  svg.append(t);

  const bg = document.createElementNS(NS, 'rect');
  bg.setAttribute('width', total); bg.setAttribute('height', total); bg.setAttribute('fill', light);
  svg.append(bg);

  // 每一列合併成一條 path，元素數量少很多
  let d = '';
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (!matrix[r][c]) { c++; continue; }
      let len = 0;
      while (c + len < n && matrix[r][c + len]) len++;
      d += `M${c + quiet} ${r + quiet}h${len}v1h-${len}z`;
      c += len;
    }
  }
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', dark);
  svg.append(path);

  return svg;
}

/** 轉成可下載的 PNG dataURL（列印用） */
export function qrPng(matrix, { scale = 12, quiet = 4, dark = '#0F2E3D', light = '#FFFFFF' } = {}) {
  const n = matrix.length;
  const total = (n + quiet * 2) * scale;
  const cv = document.createElement('canvas');
  cv.width = cv.height = total;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = light; ctx.fillRect(0, 0, total, total);
  ctx.fillStyle = dark;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (matrix[r][c]) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
  }
  return cv.toDataURL('image/png');
}
