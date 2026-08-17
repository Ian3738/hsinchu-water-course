/* ============================================================
   借水事件簿 — 十一道關卡
   ------------------------------------------------------------
   每一關三段：
     scene  真實情境。一份文件、一通電話、一張公告——先有事情發生。
     hunt   要學生去哪裡找答案。不直接給。
     gate   鎖。沒解開不能往下一關。

   鎖的型別：
     code   從證據裡找出一個數字或詞
     order  把東西排成正確順序
     match  配對
     sim    在模擬器裡達成某個條件
     note   在觀點畫布上貼出符合條件的一則
     work   完成某個任務並符合檢核

   設計原則：鎖住的東西必須是「非做不可才會懂」的那件事。
   純記憶性的答案不設鎖——那只是考試。
   ============================================================ */

export const PUZZLES = {

  /* ---------------------------------------------------- 00 */
  s0: {
    caseNo: '00',
    scene: {
      zh: '桌上有一份影本。標題是《供水協定》，簽署國是新加坡與馬來西亞。條文很長，你只看得懂最後一行有一個年份，被人用紅筆圈了起來。旁邊有人寫了一句：「到這一年，就要重新談。」',
      en: 'A photocopy on the table: a water agreement between Singapore and Malaysia. The text is long. You can only make out a year on the last line, circled in red, with a note beside it: "Renegotiate by then."',
    },
    hunt: { zh: '那個年份是幾年？答案在這一關的資料裡。', en: 'What year? The answer is in this stage.' },
    gate: {
      type: 'code',
      prompt: { zh: '紅筆圈起來的年份', en: 'The year circled in red' },
      answer: ['2061'],
      hint: { zh: '新加坡有一半以上的水是買來的，合約會到期。', en: 'More than half its water is bought, and the contract expires.' },
      after: {
        zh: '所以他們花了幾十年，把三分之二的國土變成集水區，還讓總理在鏡頭前喝回收水。一個國家願意做到這種程度，是因為他們知道那份合約會到期。那新竹呢？我們的水，是跟誰借的、借到什麼時候？',
        en: 'So they spent decades turning two-thirds of the country into catchment, and had the Prime Minister drink recycled water on camera. A country goes that far when it knows the contract expires. And Hsinchu? Whom is our water borrowed from, and until when?',
      },
    },
  },

  /* ---------------------------------------------------- 01 */
  s1: {
    caseNo: '01',
    scene: {
      zh: '一封陳情書，寄件人寫「上坪下游居民」。信裡說：這幾年溪床露出來的面積越來越大，孩子已經不能在那裡玩水。最後一句是：「我們不是要你們別用水，我們是想知道，還剩多少是我們的。」',
      en: 'A letter signed "residents downstream of Shangping". It says the exposed riverbed grows every year and the children can no longer play there. The last line: "We are not asking you to stop using water. We want to know how much is still ours."',
    },
    hunt: { zh: '打開引水模擬，自己拉拉看。', en: 'Open the diversion simulator and try it yourself.' },
    gate: {
      type: 'sim',
      lab: 'flow',
      prompt: {
        zh: '找出一組設定：魚上得去（下游至少 20 份），而且園區的水是足的（42 份）。找到就填「找到了」，找不到就填「做不到」。',
        en: 'Find a setting where fish can pass (at least 20 downstream) and the park is fully supplied (42). Enter "found" if you can, "impossible" if you cannot.',
      },
      answer: ['做不到', '不可能', '沒辦法', 'impossible', 'cannot', "can't", 'no'],
      // 這一關的重點就是做不到：園區 42 + 灌溉 28 = 70，下游只剩 30；
      // 但要下游 ≥20 就只能引 80 以下，園區拿不滿。學生要自己撞到這面牆。
      hint: {
        zh: '灌溉要 28 份、園區要 42 份，加起來 70 份。那下游還剩幾份？再回頭看魚的門檻。',
        en: 'Irrigation needs 28 and the park needs 42, which is 70. What is left downstream? Now check the fish threshold again.',
      },
      after: {
        zh: '對，做不到。這條溪不夠同時滿足所有人。閘門怎麼拉都一樣。所以真正的問題不是怎麼調，是誰先被犧牲，以及那個人有沒有在場。',
        en: 'Correct: it cannot be done. The river cannot satisfy everyone at once, however you set the gate. So the real question is not how to tune it, but who gets cut first, and whether that party was in the room.',
      },
    },
  },

  /* ---------------------------------------------------- 02 */
  s2: {
    caseNo: '02',
    scene: {
      zh: '一張泛黃的水利圖，日治時期繪製。圖上標的是稻田與圳路，沒有水庫。那時候還沒有。但今天同一條圳裡的水，有一部分流進了水庫。沒有人記得是哪一天開始的。',
      en: 'A yellowed irrigation map from the Japanese colonial period. It marks paddies and canals, no reservoir; there was none then. Yet today part of that same canal feeds a reservoir. Nobody remembers which day it started.',
    },
    hunt: { zh: '把水今天走的路排出來。', en: "Lay out the route the water takes today." },
    gate: {
      type: 'order',
      prompt: { zh: '把這五個節點排成水實際流過的順序', en: 'Put these five nodes in the order the water actually flows' },
      items: [
        { id: 'shangping', zh: '上坪溪', en: 'Shangping River' },
        { id: 'weir',      zh: '上坪攔河堰', en: 'Shangping Weir' },
        { id: 'canal',     zh: '竹東大圳', en: 'Zhudong Canal' },
        { id: 'baoshan',   zh: '寶山水庫', en: 'Baoshan Reservoir' },
        { id: 'tap',       zh: '你家水龍頭', en: 'Your tap' },
      ],
      answer: ['shangping', 'weir', 'canal', 'baoshan', 'tap'],
      hint: { zh: '水先被攔下來，才會走進渠道。', en: 'It is held back before it enters the canal.' },
      after: {
        zh: '這條路中間有一段，是別人為了自己的田挖的。水改道去水庫的時候，沒有人回去問過那些人。這件事不違法。只是沒有人問過。',
        en: 'One stretch of that route was dug by people for their own fields. When the water was rerouted to the reservoir, nobody went back to ask them. Nothing illegal happened. It simply was never asked.',
      },
    },
  },

  /* ---------------------------------------------------- 03 */
  s3: {
    caseNo: '03',
    scene: {
      zh: '一張徵收公告的影本，紙已經很舊。上面列了地號、面積、補償標準，字很小。最下面一行寫著淹沒範圍，橫跨四個鄉鎮。公告上沒有任何一個人的名字。',
      en: 'A photocopy of a compulsory purchase notice, the paper old. Parcel numbers, areas, compensation rates, all in small type. The last line gives the flooded extent across four townships. Not one person is named on it.',
    },
    hunt: { zh: '淹沒範圍是多少公頃？在這一關的資料裡。', en: 'How many hectares were flooded? It is in this stage.' },
    gate: {
      type: 'code',
      prompt: { zh: '淹沒面積（公頃）', en: 'Flooded area, in hectares' },
      answer: ['157'],
      hint: { zh: '四個鄉鎮，一個三位數。', en: 'Four townships, a three-digit number.' },
      after: {
        zh: '你查得到面積、查得到造價、查得到每日增供多少噸。你查不到的是那些人搬去了哪裡。公告寫的是地，不是人。所以畫布上留了一個位置給他們。',
        en: 'You can look up the area, the cost, the daily yield. What you cannot look up is where those people went. The notice records land, not people. That is why a position on the canvas is kept for them.',
      },
    },
  },

  /* ---------------------------------------------------- 04 */
  s4: {
    caseNo: '04',
    scene: {
      zh: '兩張地圖疊在一起，透光看的時候你發現一件怪事：水庫的位置，和水的來源，不在同一個流域裡。中間隔著一道分水嶺。工程報告上寫「地形適宜、成本最佳」，沒有寫別的。',
      en: 'Two maps overlaid. Held to the light, something is odd: the reservoir and the source of its water sit in different basins, a watershed divide between them. The engineering report says "suitable terrain, optimal cost", and nothing else.',
    },
    hunt: { zh: '打開流域地圖，把分水嶺看清楚。', en: 'Open the basin map and look at the divide.' },
    gate: {
      type: 'match',
      prompt: { zh: '把兩件事配對正確', en: 'Match the two correctly' },
      pairs: [
        { q: { zh: '寶二水庫「坐落」在哪個流域', en: 'The reservoir sits in' },
          options: [{ id: 'zg', zh: '中港溪流域', en: 'Zhonggang basin' }, { id: 'tq', zh: '頭前溪流域', en: 'Touqian basin' }],
          answer: 'zg' },
        { q: { zh: '水庫裡的水「來自」哪個流域', en: 'Its water comes from' },
          options: [{ id: 'zg', zh: '中港溪流域', en: 'Zhonggang basin' }, { id: 'tq', zh: '頭前溪流域', en: 'Touqian basin' }],
          answer: 'tq' },
      ],
      hint: { zh: '水是從上坪溪引過來的，上坪溪屬於哪一條大河？', en: 'The water is diverted from the Shangping. Which river system is that?' },
      after: {
        zh: '合法、有效率、成本最低，三件事都成立。可是「地形適宜」這句話裡面沒有人。適宜誰？住在那個谷地旁邊的人，是什麼時候知道的？',
        en: 'Legal, efficient, cheapest: all three hold. But "suitable terrain" contains no people. Suitable for whom? And when did those living beside that valley find out?',
      },
    },
  },

  /* ---------------------------------------------------- 05 */
  s5: {
    caseNo: '05',
    scene: {
      zh: '一通檢舉電話的逐字稿。來電者說她住新埔，家裡沒接自來水，喝的是井水。她說溪的顏色變了，可是廠商說符合標準。她問了一句：「符合標準的意思，是可以喝嗎？」承辦人沒有回答這一句。',
      en: 'A transcript of a complaint call. The caller lives in Xinpu, has no piped water, drinks from a well. She says the creek changed colour but the plant says it meets the standard. She asks: "Does meeting the standard mean I can drink it?" The officer does not answer that.',
    },
    hunt: { zh: '打開放流比例模擬，找出那條線。', en: 'Open the effluent simulator and find the line.' },
    gate: {
      type: 'sim',
      lab: 'effluent',
      prompt: {
        zh: '把放流比例往上調，找出「還可以直接取用」的最高比例是幾 %（整數）',
        en: 'Raise the effluent share and find the highest percentage at which the creek is still safe to draw from',
      },
      answer: ['4', '4%', '5', '5%'],
      hint: { zh: '看「可以直接取用嗎」那一行什麼時候從「可以」變成「不行」。', en: 'Watch when "safe to draw from" flips from yes to no.' },
      after: {
        zh: '模擬器裡你隨時可以把它拉回去。真實世界裡，那條溪花了十六年才停止排放。中間那十六年，住在旁邊的人還是要喝水。',
        en: 'In the simulator you can always drag it back. In the real world it took sixteen years for the discharging to stop. Through those sixteen years, the people beside it still had to drink.',
      },
    },
  },

  /* ---------------------------------------------------- 06 */
  s6: {
    caseNo: '06',
    scene: {
      zh: '一封沒有收件人的信，放在檔案夾最後。信的開頭寫著：「你好，我不知道你叫什麼名字，也不知道你會不會讀到這封信。我們正在決定一件跟你有關的事。我們要抽掉一些地下水。等你出生的時候，它可能還沒補回來。」',
      en: 'A letter with no addressee, last in the folder. It opens: "Hello. I do not know your name, or whether you will read this. We are deciding something that concerns you: we are going to pump some groundwater. By the time you are born, it may not have come back."',
    },
    hunt: { zh: '這一關的鎖不在資料裡，在畫布上。', en: 'This lock is not in the evidence. It is on the canvas.' },
    gate: {
      type: 'note',
      prompt: {
        zh: '到觀點畫布貼一則，替一個不在現場的對象說話，並且勾選「這則提到了不在現場的人」。貼好就回來。',
        en: 'Post a note on the canvas speaking for a party who is not present, and tick "this names someone not in the room". Then come back.',
      },
      needAbsent: 1,
      hint: { zh: '溪、搬走的人、還沒出生的人。挑一個，用他的口氣講一句。', en: 'The creek, those who moved away, those not yet born. Pick one and speak as them.' },
      after: {
        zh: '你剛剛替一個不會說話的對象說了一句話。這件事本身有個問題：你怎麼知道他會這樣說？這門課不會給你答案，但你從現在開始，會注意到誰在替誰說話。',
        en: 'You just spoke for someone who cannot speak. There is a problem inside that act: how do you know they would say it that way? This course will not resolve it, but from now on you will notice who is speaking for whom.',
      },
    },
  },

  /* ---------------------------------------------------- 07 */
  s7: {
    caseNo: '07',
    scene: {
      zh: '三份文件攤在桌上，講的都是同一座水庫。一份讓你覺得工程很了不起，一份讓你覺得有人受害，一份讓你想去那裡玩。三份都沒有說謊。',
      en: 'Three documents on the table, all about the same reservoir. One leaves you impressed by the engineering, one leaves you feeling someone was harmed, one makes you want to visit. None of the three lies.',
    },
    hunt: { zh: '先填完三欄表，再回來。', en: 'Fill in the three-column table first, then come back.' },
    gate: {
      type: 'work',
      taskId: 't7-1',
      check: w => ['official', 'news', 'tourism'].every(r => (w[`${r}_omit`] || '').trim().length > 1),
      prompt: { zh: '三種文本的「它沒有提到誰」都要填。填完這一關就開。', en: 'Fill the "who it leaves out" column for all three texts.' },
      lab: 'table3',
      hint: { zh: '第三欄最難，因為要找的是不在文章裡的東西。', en: 'The third column is hardest: you are looking for what is not there.' },
      after: {
        zh: '三份都沒說謊，可是三份都留了人在外面。接下來換你寫。你會把誰留在外面？',
        en: 'None of them lied, and all three left someone out. Now it is your turn to write. Whom will you leave out?',
      },
    },
  },

  /* ---------------------------------------------------- 08 */
  s8: {
    caseNo: '08',
    scene: {
      zh: '一張退稿單。編輯只寫了兩行：「你的一百字裡，有八十字放到任何一條溪都成立。剩下的二十字才是新竹。三十字內重寫。」',
      en: 'A rejection slip. The editor wrote two lines: "Eighty of your hundred words would fit any river. The other twenty are Hsinchu. Rewrite in thirty."',
    },
    hunt: { zh: '去三版草稿那邊寫。', en: 'Go write the three drafts.' },
    gate: {
      type: 'work',
      taskId: 't8',
      check: w => {
        const d2 = (w.d2 || '').trim();
        if (!d2) return false;
        const cjk = (d2.match(/[㐀-鿿]/g) || []).length;
        const rest = d2.replace(/[㐀-鿿]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
        const n = cjk + rest;
        const banned = ['美麗', '純淨', '保護', '療癒', '祕境', '動人', '珍貴', '守護',
                        'beautiful', 'pristine', 'protect', 'healing', 'hidden gem', 'moving'];
        return n > 0 && n <= 30 && !banned.some(b => d2.toLowerCase().includes(b.toLowerCase()));
      },
      prompt: { zh: '第二版壓到三十字以內，而且不能出現禁用字。', en: 'Draft two: thirty words or fewer, no banned words.' },
      lab: 'drafts',
      hint: { zh: '先把形容詞全刪掉，看剩下什麼。', en: 'Delete every adjective first and see what survives.' },
      after: {
        zh: '留下來的那三十個字，是你真的想講的。剩下那七十個字，是你以為自己想講的。',
        en: 'The thirty words that survived are what you meant. The seventy you cut are what you thought you meant.',
      },
    },
  },

  /* ---------------------------------------------------- 09 */
  s9: {
    caseNo: '09',
    scene: {
      zh: '一封策展邀請函。「我們要辦一場新竹的展，只收一件作品。條件只有一條：拿到它的人要問出問題，而不是覺得新竹很漂亮。」',
      en: 'A curator\'s invitation. "We are mounting a show about Hsinchu and taking one object. One condition: whoever holds it must be left with a question, not with the impression that Hsinchu is pretty."',
    },
    hunt: { zh: '去做東西那一頁，把三個科目寫清楚。', en: 'Go to the make page and locate three subjects.' },
    gate: {
      type: 'work',
      taskId: 't9',
      check: w => Object.values(w.used || {}).filter(v => (v || '').trim()).length >= 3
                  && (w.omits || '').trim().length > 1,
      prompt: { zh: '至少三個科目寫出用在哪裡，而且要說出這個東西把誰留在外面。', en: 'Locate at least three subjects and say who the object leaves out.' },
      lab: 'make',
      hint: { zh: '「它把誰留在外面」這一格空著就過不了。', en: 'Leaving the omission field blank will not pass.' },
      after: {
        zh: '你做的東西一定會留人在外面，沒有例外。差別只在你說不說得出是誰。',
        en: 'Whatever you made leaves someone out; there is no exception. The only difference is whether you can name them.',
      },
    },
  },

  /* ---------------------------------------------------- 10 */
  s10: {
    caseNo: '10',
    scene: {
      zh: '最後一份文件是三張便條，字跡都不一樣。上面是三個沒上過這門課的人，看了你的東西之後說的第一句話。其中一張寫的跟你想的完全不同。',
      en: 'The last item is three slips in three different hands: the first thing three people who never took this course said about your object. One of them says something entirely unlike what you intended.',
    },
    hunt: { zh: '去交換測試那一頁，記下三個人的原話。', en: 'Go to the exchange test and record three people verbatim.' },
    gate: {
      type: 'work',
      taskId: 't10',
      check: w => (w.tests || []).filter(x => (x.said || '').trim()).length >= 3,
      prompt: { zh: '三份測試記錄都要有對方的原話。', en: "Three test records, each with the tester's exact words." },
      lab: 'testing',
      hint: { zh: '不要解釋，也不要幫他們修飾。一字不改記下來。', en: 'Do not explain and do not tidy their words. Write them as spoken.' },
      after: {
        zh: '事件簿到這裡結束了。新加坡把自己的決定變成一個看得見的東西，而且他們說得出那個東西是誰選的。你現在也有一個——而且你說得出它把誰留在外面。',
        en: 'The case file ends here. Singapore turned its decisions into something you can look at, and can say who chose it. Now you have one too, and you can say whom it leaves out.',
      },
    },
  },
};

/** 這一關要學生先去哪個工具 */
export function gateLab(sid) {
  const g = PUZZLES[sid]?.gate;
  return g?.lab || null;
}
