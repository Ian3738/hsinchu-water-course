/* ============================================================
   文字雲
   ------------------------------------------------------------
   中文沒有空白可以斷詞，完整的斷詞器太重（詞庫動輒幾 MB），
   教室裡不值得。這裡用 n-gram：把二字與三字的組合都數一遍，
   再用停用詞和「被更長的詞包住就不算」的規則把碎片濾掉。

   這不是精確的斷詞，是夠用的頻率視覺化——投在螢幕上讓全班
   看見大家在意什麼，這個精度就夠了。
   ============================================================ */

/* 中文停用詞：虛詞、代名詞、常見連接。出現太廣，沒有資訊量。 */
const STOP_ZH = new Set([
  '的', '了', '是', '我', '你', '他', '她', '它', '們', '在', '有', '和', '就', '不',
  '人', '都', '一', '個', '這', '那', '也', '很', '會', '要', '到', '說', '去', '來',
  '我們', '你們', '他們', '因為', '所以', '可是', '但是', '不過', '如果', '這個', '那個',
  '這樣', '那樣', '什麼', '怎麼', '為什麼', '沒有', '可以', '應該', '覺得', '認為',
  '一個', '一些', '很多', '自己', '然後', '而且', '還有', '就是', '不會', '不能',
  '的話', '的人', '的水', '的時候', '時候', '知道', '可能', '需要', '問題',
]);

const STOP_EN = new Set([
  'the', 'and', 'that', 'this', 'with', 'for', 'you', 'not', 'but', 'they', 'have',
  'from', 'their', 'what', 'when', 'would', 'could', 'should', 'about', 'there',
  'because', 'which', 'been', 'were', 'them', 'then', 'than', 'into', 'more', 'some',
  'will', 'just', 'like', 'only', 'also', 'very', 'your', 'these', 'those', '我', 'i',
]);

/* ------------------------------------------------------------
   課程詞彙表
   沒有詞庫的話，「跨則重複」是判斷一個字串是不是詞的唯一訊號，
   所以留言只有一兩則時算不出東西。這張表補上那個缺口：
   這些是這門課本來就在談的詞，出現一次就值得標出來。
   ------------------------------------------------------------ */
const LEXICON = [
  // 地方與設施
  '頭前溪','上坪溪','霄裡溪','中港溪','竹東大圳','寶山水庫','寶二水庫','攔河堰',
  '分水嶺','水庫','水圳','渠道','新埔','竹東','寶山','科學園區','園區','石門水庫',
  // 水與環境
  '取水','引水','放流','廢水','排放','流量','下游','上游','枯水期','地下水','含水層',
  '灌溉','農田','稻田','水質','井水','自來水','飲用水','回收水','跨流域','集水區',
  '生態','魚','棲地','河床','溪水','雨水',
  // 人與立場
  '農民','居民','住戶','原住民','工程師','政府','廠商','工廠','面板廠','官員',
  '未出生','後代','子孫','遷居','搬走','徵收','補償','土地','受影響',
  // 這門課的概念
  '公平','不公平','決定','參與','發言','代言','不在場','沒有被問','有沒有問',
  '借水','還水','代價','犧牲','取捨','優先','需求','分配','水權','責任',
];

const isCJK = c => /[㐀-鿿]/.test(c);

/* 這些字放在詞頭或詞尾，幾乎一定是切錯了。
   「下游的」「游的人」都是這樣冒出來的碎片。 */
const EDGE_BAD = new Set('的了是在和就也都與而及對把被讓從向於之其此該們個一二三四五六七八九十'.split(''));

/** 詞頭或詞尾是虛詞就不算一個詞 */
const edgeOk = w => !EDGE_BAD.has(w[0]) && !EDGE_BAD.has(w[w.length - 1]);

/**
 * 從一堆句子算出詞頻。
 * @param {string[]} texts
 * @param {number} top 取前幾名
 *
 * 門檻是動態的：留言還少的時候要求「出現兩次」會整片空白，
 * 所以三則以內就讓出現一次的詞也算，只是優先留長一點的詞。
 */
export function countWordsIn(texts, top = 40) {
  const live = texts.filter(t => String(t || '').trim());

  // 先掃課程詞彙表。這些詞出現一次就算數，所以第一則留言進來就有東西看。
  const lex = scanLexicon(live);

  // 留言還少的時候，跨則重複的訊號不夠，就只用詞彙表的結果。
  if (live.length < 4) {
    return [...lex.entries()]
      .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
      .slice(0, top)
      .map(([text, n]) => ({ text, n }));
  }
  const freq = new Map();
  const bump = (w, n = 1) => freq.set(w, (freq.get(w) || 0) + n);

  texts.forEach(raw => {
    const text = String(raw || '');

    // 英文與數字：直接依非字元切
    text.toLowerCase().split(/[^a-z0-9]+/).forEach(w => {
      if (w.length >= 3 && !STOP_EN.has(w)) bump(w);
    });

    // 中文：先用標點切成句段，再在句段內取 2、3、4 字組合
    text.split(/[^㐀-鿿]+/).filter(Boolean).forEach(seg => {
      for (let n = 2; n <= 4; n++) {
        for (let i = 0; i + n <= seg.length; i++) {
          const w = seg.slice(i, i + n);
          if (STOP_ZH.has(w)) continue;
          if (!edgeOk(w)) continue;
          // 全部由停用單字組成的詞，跳過
          if ([...w].every(c => STOP_ZH.has(c))) continue;
          bump(w, n === 2 ? 1 : 1.2);   // 長一點的詞略微加權，通常更有意義
        }
      }
    });
  });

  // 詞彙表命中的詞加權併入：它們是這門課的關鍵詞，不該被一般片段蓋過
  lex.forEach((n, w) => freq.set(w, (freq.get(w) || 0) + n * 1.6));

  // 被更長且幾乎一樣頻繁的詞包住的碎片，丟掉
  const rows = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const kept = [];
  for (const [w, n] of rows) {
    if (kept.length >= top * 3) break;
    // 被更長的詞包住，而且頻率沒有明顯更高 → 是碎片
    const swallowed = kept.some(([kw, kn]) =>
      kw.length > w.length && kw.includes(w) && kn >= n * 0.55);
    // 反過來：這個詞包住了已經留下的短詞，而且更常出現 → 把短的換掉
    const eatsIdx = kept.findIndex(([kw, kn]) =>
      w.length > kw.length && w.includes(kw) && n >= kn * 0.9);
    if (eatsIdx >= 0) { kept.splice(eatsIdx, 1); }
    if (!swallowed) kept.push([w, n]);
  }

  return kept
    .filter(([w, n]) => n >= 2)
    .slice(0, top)
    .map(([text, n]) => ({ text, n }));
}

/* 掃課程詞彙表。長的詞先比，比中就跳過那一段，不會重疊。 */
function scanLexicon(texts) {
  const terms = [...LEXICON].sort((a, b) => b.length - a.length);
  const freq = new Map();
  texts.forEach(raw => {
    let t = String(raw || '');
    terms.forEach(w => {
      let n = 0, i;
      while ((i = t.indexOf(w)) !== -1) {
        n++;
        t = t.slice(0, i) + '\u0000'.repeat(w.length) + t.slice(i + w.length);
      }
      if (n) freq.set(w, (freq.get(w) || 0) + n);
    });
    // 剩下的英文照舊
    t.toLowerCase().split(/[^a-z0-9]+/).forEach(w => {
      if (w.length >= 3 && !STOP_EN.has(w)) freq.set(w, (freq.get(w) || 0) + 1);
    });
  });
  return freq;
}

/**
 * 畫成一團字。
 * 不做螺旋排版——投影時字會互相蓋到很難讀。
 * 用置中的流式排列，大小與顏色反映頻率，一眼看得出重心在哪。
 */
export function cloudEl(h, words, { max = 64, min = 14, empty = '還沒有人留下想法' } = {}) {
  const box = h('.cloud');
  if (!words.length) {
    box.append(h('p.cloud__empty', { text: empty }));
    return box;
  }
  const hi = words[0].n;
  const lo = words[words.length - 1].n;
  const span = Math.max(1, hi - lo);

  // 大的排前面會擠成一團，打散一點比較好看
  const shuffled = [...words];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (i * 7 + 3) % (i + 1);        // 固定的打散順序，重畫不會亂跳
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  shuffled.forEach(w => {
    const t = (w.n - lo) / span;                     // 0..1
    const size = Math.round(min + t * (max - min));
    const weight = t > 0.66 ? 700 : t > 0.33 ? 500 : 400;
    const color = t > 0.66 ? 'var(--clay-lit)' : t > 0.33 ? 'var(--water-lit)' : 'var(--fg-3)';
    box.append(h('span.cloud__w', {
      style: { fontSize: size + 'px', fontWeight: String(weight), color },
      title: `${w.text}　${Math.round(w.n)}`,
    }, w.text));
  });
  return box;
}
