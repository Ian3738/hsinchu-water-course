/* ============================================================
   課程內容 — 頭前溪借水課
   由 Hsinchu_Borrowed_Water_Class_Deck_EN.pptx 轉寫，中英並存。
   區塊型別：ask / facts / task / bridge / lab / vote / board /
             prose / list / video / rules / compare
   ============================================================ */

export const META = {
  title: { zh: '你家水龍頭的水，是跟誰借的？', en: 'Where is the water in your tap borrowed from?' },
  sub:   { zh: '探究頭前溪流域', en: 'An inquiry into the Touqian River basin' },
  tail:  { zh: '跟誰借的？還得回去嗎？', en: 'Borrowed from whom? And can it be given back?' },
};

export const RULES = [
  {
    n: 1,
    t: { zh: '還沒想清楚就先講', en: "Say it before you're sure" },
    d: { zh: '留在你腦袋裡的想法，別人沒辦法幫你改得更好。', en: "An idea you keep to yourself can't be improved by anyone else." },
  },
  {
    n: 2,
    t: { zh: '有人反對是好事', en: 'Someone disagreeing is a good sign' },
    d: { zh: '表示你的想法值得別人花力氣跟你吵。', en: 'It means your idea was worth arguing with.' },
  },
  {
    n: 3,
    t: { zh: '最後要留下一句更好的話', en: 'We end with one better sentence' },
    d: { zh: '不是比誰的答案贏，是找出一句話，能同時容納兩邊。', en: 'Not whose answer wins. One sentence that holds both sides.' },
  },
];

/* ---------- 十節課 ---------- */

export const SESSIONS = [

/* ========================= 起手式 ========================= */
{
  id: 's0', n: 0,
  kind: 'opening',
  title: { zh: '一個不得不想清楚的國家', en: 'A country that had to think hard' },
  sub:   { zh: '起手式・新加坡', en: 'Getting started · Singapore' },
  mins: 45,
  blocks: [
    { type: 'video', slot: 'intro',
      cap: { zh: '固定鏡位，時間流過・15 秒', en: 'Fixed camera, time passing · 15 sec' },
      note: { zh: '學生進教室時循環播放。不介紹，鐘響就換頁。', en: 'Play it as students walk in, set to loop. No introduction. Switch when the bell rings.' } },

    { type: 'rules' },

    { type: 'facts',
      head: { zh: '新加坡是一個很小的島', en: 'Singapore is a very small island' },
      items: [
        { n: { zh: '比臺北市大一點', en: 'Larger than Taipei City' }, l: { zh: '這樣就是一整個國家了', en: 'That is the whole country' } },
        { n: { zh: '沒有長河', en: 'No long rivers' }, l: { zh: '下的雨幾乎立刻流進海裡', en: 'Rain reaches the sea almost immediately' } },
        { n: { zh: '一半以上', en: 'More than half' }, l: { zh: '的水，是跟馬來西亞買的', en: 'of its water is bought from Malaysia' } },
        { n: { zh: '2061', en: '2061' }, l: { zh: '供水合約到期的那一年', en: 'the year the water agreement expires' } },
      ] },

    { type: 'ask',
      q: { zh: '如果你家的水要跟鄰居買，你會先確認什麼？', en: 'If your household had to buy water from the neighbours, what would you check first?' },
      note: { zh: '而且合約有到期日。', en: 'And the contract has an expiry date.' } },

    { type: 'facts',
      head: { zh: '所以新加坡做了三件很費力的事', en: 'So Singapore did three demanding things' },
      items: [
        { n: { zh: '三分之二', en: 'Two-thirds' }, l: { zh: '的國土拿來集雨水', en: "of the country's land collects rainwater" } },
        { n: { zh: '17 座水庫', en: '17 reservoirs' }, l: { zh: '蓋來接住每一滴', en: 'built to catch every drop' } },
        { n: { zh: '喝回收水', en: 'Drinking recycled water' }, l: { zh: '用過的水處理過再喝', en: 'used water is treated and drunk again' } },
        { n: { zh: '總理自己喝', en: 'The Prime Minister drank it' }, l: { zh: '在鏡頭前喝，人民才願意相信', en: 'in public, so people would believe it' } },
      ] },

    { type: 'vote', id: 'v-newater',
      q: { zh: '你會喝別人用過的水嗎？', en: 'Would you drink water that someone else has used?' },
      note: { zh: '先投再說，別想太久。', en: "Vote first. Don't overthink it." },
      options: [
        { id: 'yes', l: { zh: '會', en: 'Yes' } },
        { id: 'no',  l: { zh: '不會', en: 'No' } },
        { id: 'depends', l: { zh: '看情況', en: 'Depends' } },
      ] },

    { type: 'facts',
      head: { zh: '他們還把整座城市做成一個模型', en: 'They also built the whole city as a model' },
      items: [
        { n: { zh: '11 公尺見方', en: 'Eleven metres square' }, l: { zh: '世界上最大的建築模型之一', en: 'one of the largest architectural models anywhere' } },
        { n: { zh: '每一棟', en: 'Every building' }, l: { zh: '市中心的建築都在上面', en: 'downtown is on it' } },
        { n: { zh: '免費參觀', en: 'Free to visit' }, l: { zh: '誰都可以走進去看', en: 'anyone can walk in and look' } },
        { n: { zh: '從上往下看', en: 'Seen from above' }, l: { zh: '像從一千六百公尺高俯瞰', en: 'like looking down from 1,600 metres' } },
      ] },

    { type: 'ask',
      q: { zh: '這個模型讓你看見什麼？又擋住了什麼？', en: 'What does the model let you see? And what does it hide?' },
      note: { zh: '每一棟房子都在。裡面的人呢？搬走的人呢？', en: 'Every house is there. What about the people inside? The ones who moved away?' } },

    { type: 'facts',
      head: { zh: '他們也很會講自己的故事', en: 'They are also good at telling their own story' },
      items: [
        { n: { zh: '留下老街', en: 'Old streets kept' }, l: { zh: '哪幾個街廓要保留，是選出來的', en: 'which blocks to preserve was a choice' } },
        { n: { zh: '花園城市', en: 'Garden City' }, l: { zh: '他們以前這樣稱呼自己', en: 'what they once called themselves' } },
        { n: { zh: '自然中的城市', en: 'City in Nature' }, l: { zh: '現在改用這個名字', en: 'the name they use now' } },
        { n: { zh: '魚尾獅', en: 'The Merlion' }, l: { zh: '1964 年設計出來的，不是古老傳說', en: 'designed in 1964, not an ancient legend' } },
      ] },

    { type: 'ask',
      q: { zh: '一個地方本來就長那樣，還是有人選擇那樣描述它？', en: 'Is a place simply the way it is, or is it the way someone chose to describe it?' },
      note: { zh: '老房子留下來了。原本住在裡面的人呢？', en: 'The old buildings were kept. What happened to the people who lived in them?' } },

    { type: 'prose', tone: 'big',
      body: { zh: '新加坡把自己的決定，變成一個可以看的東西。<br>那新竹的水，我們要去哪裡看？',
              en: 'Singapore turned its decisions into something you can look at.<br>Where can we look at Hsinchu&rsquo;s water?' } },

    { type: 'ask',
      q: { zh: '新竹的水，到底是從哪裡來的？', en: "Where does Hsinchu's water actually come from?" },
      note: { zh: '不准查手機。用你現在腦袋裡有的東西回答。', en: 'No phones. Answer from what you know right now.' } },

    { type: 'task', id: 't0', lab: 'route',
      tid: 'Task 0',
      title: { zh: '畫一條線，寫下你現在的想法', en: 'Draw a line. Write what you think now.' },
      steps: [
        { zh: '畫出路線：水從哪裡開始，怎麼跑到你家水龍頭。', en: 'Draw the route: where the water starts, how it reaches your tap.' },
        { zh: '拍照、上傳，加一句話。', en: 'Photograph it, post it, add one sentence.' },
        { zh: '標題寫「我一開始以為」。', en: 'Title it "What I thought at the start".' },
      ],
      mins: 8,
      hand: { zh: '一張照片', en: '1 photo' },
      done: { zh: '畫出了一個起點，不能只寫「水庫」', en: 'A starting point is drawn, not just "a reservoir"' } },

    { type: 'facts',
      head: { zh: '查一下，答案通常出乎意料', en: 'The answer surprises most people' },
      items: [
        { n: { zh: '寶山水庫', en: 'Baoshan Reservoir' }, l: { zh: '1984 年，為了供應科學園區而蓋', en: '1984, built to supply the science park' } },
        { n: { zh: '寶山第二水庫', en: 'Baoshan Second Reservoir' }, l: { zh: '2006 年，造價新臺幣 105 億元', en: '2006, cost NT$10.5 billion' } },
        { n: { zh: '水不是它自己的', en: "The water isn't theirs" }, l: { zh: '兩座水庫都不在河道上', en: 'neither reservoir sits on a river' } },
        { n: { zh: '是引來的', en: 'It is diverted' }, l: { zh: '從上坪溪取水，沿渠道送過來', en: 'taken from the Shangping River, sent along a canal' } },
      ] },

    { type: 'bridge',
      said: [
        { zh: '水庫是雨水積起來的', en: 'Reservoirs fill with rain' },
        { zh: '石門水庫供應新竹', en: 'Shihmen supplies Hsinchu' },
        { zh: '水本來就在那裡', en: 'The water was always there' },
      ],
      next: { zh: '把上坪溪的水引到科學園區和我們家，這樣公平嗎？', en: 'Diverting the Shangping River to the science park and our homes: is that fair?' },
      lead: { zh: '離槽水庫，代表水是從別的地方帶過來的。那被取水的那條河呢？', en: 'A reservoir off the river means the water was brought from elsewhere. So what happened to the river it came from?' } },
  ],
},

/* ========================= 第 1 節 ========================= */
{
  id: 's1', n: 1,
  title: { zh: '被取水的那條河', en: 'The river that was drawn from' },
  sub:   { zh: '辯論・上坪溪與竹東', en: 'Debate · Shangping and Zhudong' },
  mins: 50,
  slot: 'downstream',
  blocks: [
    { type: 'lab', lab: 'flow',
      title: { zh: '水怎麼跑到你家水龍頭', en: 'How the water reaches your tap' },
      body: { zh: '拉動取水閘門，看下游剩下多少。', en: 'Drag the diversion gate and watch what is left downstream.' } },

    { type: 'list',
      head: { zh: '兩件值得注意的事', en: 'Two things worth noticing' },
      items: [
        { t: { zh: '這條渠道本來是為農田挖的', en: 'The canal was dug for farmland' },
          d: { zh: '很久以前挖來灌溉稻田，現在也供水給水庫。', en: 'It was built long ago to irrigate rice fields. Now it also feeds the reservoir.' } },
        { t: { zh: '下游拿到的變少了', en: 'Downstream gets less' },
          d: { zh: '一部分水在上坪就被取走，往下流的就少了。', en: 'Part of the flow is taken at Shangping, so less arrives below.' } },
      ] },

    { type: 'video', slot: 's1',
      cap: { zh: '水離開的那一段・15 秒', en: 'The stretch where the water leaves · 15 sec' },
      note: { zh: '圖解說的是路線。這段影片說的是這條路線在下游的代價。', en: 'The diagram showed the route. This shows what the route costs downstream.' } },

    { type: 'ask',
      q: { zh: '把上坪溪的水引到科學園區和我們家，這樣公平嗎？', en: 'Diverting the Shangping River to the science park and our homes: is that fair?' },
      sides: [
        { k: { zh: '正方：公平', en: 'For: it is fair' }, v: { zh: '需要水的人很多，園區也養活很多家庭', en: 'Many people need water, and the plants support many families' } },
        { k: { zh: '反方：不公平', en: 'Against: it is not' }, v: { zh: '下游的人和生物也需要那些水', en: 'People and wildlife downstream need that water too' } },
      ] },

    { type: 'task', id: 't1-1', lab: 'debate',
      tid: 'Task 1-1',
      title: { zh: '辯論：四個回合', en: 'Debate: four rounds' },
      steps: [
        { zh: '第一回合。正方講 2 分鐘，說為什麼公平。', en: 'Round one. For side speaks 2 minutes on why it is fair.' },
        { zh: '第二回合。反方講 2 分鐘，說為什麼不公平。', en: 'Round two. Against side speaks 2 minutes on why it is not.' },
        { zh: '第三回合。兩邊各問對方兩個問題。', en: 'Round three. Each side asks the other two questions.' },
        { zh: '第四回合。各用 1 分鐘，說出對方最好的一個論點。', en: "Round four. Each side takes 1 minute to name the other's best point." },
      ],
      mins: 25,
      hand: { zh: '發言筆記', en: 'Speaking notes' },
      done: { zh: '第四回合真的講出了對方的強項', en: 'Round four names a real strength' },
      alt: {
        head: { zh: '如果辯論不適合，改用這個', en: "If a debate doesn't fit, do this instead" },
        note: { zh: '年紀小或人數少的班級，改成四人一輪。建議國小用。每個人都能把話講完。', en: 'For younger or smaller classes, use rounds of four. Recommended for primary classes. Everyone gets to finish a thought.' },
        steps: [
          { zh: '一人一分鐘。有人在講的時候，其他三個人不插話。', en: 'One minute each. While one speaks, the other three do not interrupt.' },
          { zh: '講完才能問。可以問，但不能說「你錯了」。', en: 'Questions only, after the round. You may ask, but you may not say "you\'re wrong".' },
          { zh: '找出一句大家都同意的話。', en: 'Find one shared sentence. The group must agree on a single sentence together.' },
        ],
      } },

    { type: 'board', intro: {
      zh: '每一則貼文都要寫兩件事：誰在說話，還有他最在意什麼。',
      en: 'Every note says two things: who is speaking, and what they care about most.' } },

    { type: 'task', id: 't1-2',
      tid: 'Task 1-2',
      title: { zh: '把兩邊都放上畫布', en: 'Put both sides on the canvas' },
      steps: [
        { zh: '兩邊各自最好的論點是什麼？', en: 'What was the best point made for each side?' },
        { zh: '各寫一則貼文，標明誰在說話、他在意什麼。', en: 'Write one note each, naming who is speaking and what they care about.' },
        { zh: '放到畫布上該放的位置。', en: 'Place it on the canvas where it belongs.' },
      ],
      mins: 10,
      hand: { zh: '2 則貼文', en: '2 sticky notes' },
      done: { zh: '兩則都寫了發言者', en: 'Both notes name a speaker' } },

    { type: 'bridge',
      said: [
        { zh: '園區養活很多家庭', en: 'The plants support families' },
        { zh: '沒有人問過下游的人', en: 'Nobody asked people downstream' },
        { zh: '每個人都需要水', en: 'Everyone needs water' },
      ],
      next: { zh: '水從上坪怎麼到寶山水庫？那條路是誰的？', en: 'How does water get from Shangping to Baoshan Reservoir, and whose route is it?' },
      lead: { zh: '兩邊都在吵誰需要水。有一件事沒人問：水走的是哪一條路？', en: 'Both sides argued about who needs water. One thing went unasked: which route did the water take?' } },
  ],
},

/* ========================= 第 2 節 ========================= */
{
  id: 's2', n: 2,
  title: { zh: '農民的水圳，現在送的是城市的水', en: "A farmers' canal now carries city water" },
  sub:   { zh: '竹東大圳', en: 'Zhudong Canal' },
  mins: 45,
  slot: 'farmers',
  blocks: [
    { type: 'facts',
      head: { zh: '竹東大圳從哪來的', en: 'Where the Zhudong Canal came from' },
      items: [
        { n: { zh: '很久以前挖的', en: 'Dug long ago' }, l: { zh: '日治時期為了灌溉農田而開', en: 'built under Japanese rule to irrigate fields' } },
        { n: { zh: '現在也送', en: 'Now it also carries' }, l: { zh: '上坪溪的水進寶山水庫', en: 'Shangping water into Baoshan Reservoir' } },
        { n: { zh: '沒有人宣布過', en: 'Nobody announced it' }, l: { zh: '是慢慢變成這樣的，不是某一天', en: 'it changed gradually, not on a single day' } },
        { n: { zh: '共用', en: 'Shared use' }, l: { zh: '農田和水庫用的是同一條圳', en: 'farmland and reservoir draw on the same canal' } },
      ] },

    { type: 'ask',
      q: { zh: '一條為稻田挖的水圳，什麼時候變成工業用的管線？', en: 'When does a canal dug for rice fields become a pipe for industry?' },
      note: { zh: '查查看有沒有人問過農民。', en: 'See whether anyone ever asked the farmers.' } },

    { type: 'task', id: 't2-1', lab: 'invoice',
      tid: 'Task 2-1',
      title: { zh: '幫上坪溪開一張帳單', en: 'Write an invoice for the Shangping River' },
      steps: [
        { zh: '如果這條溪可以收水費，它該跟誰收？', en: 'If the river could charge for its water, who should it bill?' },
        { zh: '選一個計價基準：算水量？算年數？算受影響的人數？', en: 'Choose a basis: volume? years? number of people affected?' },
        { zh: '算出金額，寫下你為什麼選這個基準。', en: 'Work out an amount and write down why you chose that basis.' },
        { zh: '再加一行：為什麼不選另外那個？', en: 'Then add one line: why not the other basis?' },
      ],
      mins: 20,
      hand: { zh: '一組一張帳單', en: '1 group invoice' },
      done: { zh: '講得出為什麼不選另一個基準', en: 'You can say why not the other basis' } },

    { type: 'slotfill',
      head: { zh: '畫布上多一個觀點', en: 'One more perspective on the canvas' },
      body: { zh: '把農民的立場寫成一句話，貼上去。', en: "Write the farmers' position as a single sentence and put it up." } },

    { type: 'bridge',
      said: [
        { zh: '水圳本來是灌溉用的', en: 'The canal was for irrigation' },
        { zh: '後來慢慢也供水庫', en: 'It gradually also fed the reservoir' },
        { zh: '農民還在用', en: 'Farmers still use it' },
      ],
      next: { zh: '蓋水庫要淹掉一大片地。住在那裡的人去哪了？', en: 'Building a reservoir floods a large area. Where did the people living there go?' },
      lead: { zh: '路是農民先鋪的。那存水的地方呢？水庫蓋在誰的地上？', en: 'The route was built by farmers first. What about where the water is stored? Whose land is the reservoir on?' } },
  ],
},

/* ========================= 第 3 節 ========================= */
{
  id: 's3', n: 3,
  title: { zh: '很多人交出了自己的土地', en: 'Many people gave up their land' },
  sub:   { zh: '寶山第二水庫', en: 'Baoshan Second Reservoir' },
  mins: 45,
  slot: 'displaced',
  blocks: [
    { type: 'facts',
      head: { zh: '關於這座水庫的四個數字', en: 'Four numbers about the reservoir' },
      items: [
        { n: { zh: '105 億', en: 'NT$10.5 billion' }, l: { zh: '新臺幣，蓋這座水庫的造價', en: 'what it cost to build' } },
        { n: { zh: '157 公頃', en: '157 hectares' }, l: { zh: '淹沒範圍橫跨四個鄉鎮', en: 'flooded across four townships' } },
        { n: { zh: '直接徵收', en: 'Acquired outright' }, l: { zh: '土地是強制徵收來的', en: 'the land was compulsorily purchased' } },
        { n: { zh: '每日 28 萬噸', en: '280,000 tonnes daily' }, l: { zh: '它多供應的水量', en: 'the additional supply it provides' } },
      ] },

    { type: 'ask',
      q: { zh: '交出那些土地的人，後來去了哪裡？', en: 'The people who gave up that land: where did they go?' },
      note: { zh: '官方資料給的是面積和數字。人得我們自己去找。', en: 'The official material gives areas and figures. The people are ours to find.' } },

    { type: 'task', id: 't3-1',
      tid: 'Task 3-1',
      title: { zh: '找出我們還想知道什麼', en: 'Find what we still want to know' },
      steps: [
        { zh: '找出水庫的官方介紹，把它給的數字列出來。', en: 'Find the official description of the reservoir. List the figures it gives.' },
        { zh: '讀完之後，列出你還想知道的事。', en: 'Then list what you still want to know after reading it.' },
        { zh: '一組貼一則，標題寫「我們還想知道什麼」。', en: 'Post one group note titled "What we still want to know".' },
      ],
      mins: 18,
      hand: { zh: '一組一則貼文', en: '1 group post' },
      done: { zh: '至少列出三件', en: 'At least three things listed' } },

    { type: 'slotfill',
      head: { zh: '填掉一個虛線空位', en: 'One dashed box gets filled in' },
      body: { zh: '交出土地的那些人，最在意的是什麼？寫下來，放進那個空位。', en: 'What did the people who gave up land care about most? Write it and place it in that box.' } },

    { type: 'bridge',
      said: [
        { zh: '資料給了面積和造價', en: 'The material gives area and cost' },
        { zh: '我們還想知道他們去哪了', en: 'We still want to know where they went' },
        { zh: '補償是一種作法', en: 'Compensation is one approach' },
      ],
      next: { zh: '水庫在中港溪流域，裝的卻是頭前溪的水。為什麼？', en: 'The reservoir sits in the Zhonggang basin but holds Touqian water. Why?' },
      lead: { zh: '有人願意交出土地。那，為什麼偏偏是那一塊地？', en: 'People were willing to give up land. So why that particular piece of land?' } },
  ],
},

/* ========================= 第 4 節 ========================= */
{
  id: 's4', n: 4,
  title: { zh: '這座水庫站在一個奇怪的位置', en: 'This reservoir stands in an odd place' },
  sub:   { zh: '寶二水庫的選址', en: 'Siting the second reservoir' },
  mins: 50,
  blocks: [
    { type: 'facts',
      head: { zh: '有件事很奇怪', en: 'Something strange' },
      items: [
        { n: { zh: '它在中港溪流域', en: 'It sits in the Zhonggang basin' }, l: { zh: '在分水嶺另一邊的谷地裡', en: 'in a valley on the other side of the divide' } },
        { n: { zh: '水是頭前溪的', en: "The water is Touqian's" }, l: { zh: '從上坪溪引過來', en: 'diverted from the Shangping River' } },
        { n: { zh: '枯水期跟人借', en: 'Borrowed in dry years' }, l: { zh: '由石門水庫和永和山水庫調補', en: 'topped up from Shihmen and Yonghe Shan' } },
        { n: { zh: '17 口井', en: '17 wells' }, l: { zh: '缺水時抽隆恩堰底下的地下水', en: "groundwater below Long'en Weir in shortages" } },
      ] },

    { type: 'lab', lab: 'basin',
      title: { zh: '跨流域配置', en: 'Across the divide' },
      body: { zh: '在地圖上把分水嶺打開，看水怎麼跨過去。', en: 'Open the divide on the map and see how the water crosses.' } },

    { type: 'ask',
      q: { zh: '為什麼一個流域的谷地，要裝另一個流域的水？', en: 'Why should a valley in one basin hold water from another?' },
      note: { zh: '完全合法，也很有效率。那為什麼還值得問？', en: 'It is entirely legal and efficient. So why is it still worth asking?' } },

    { type: 'task', id: 't4-1',
      tid: 'Task 4-1',
      title: { zh: '講給一個完全沒聽過的人聽', en: 'Explain it to someone who has never heard of it' },
      steps: [
        { zh: '兩人一組。一個當老師，一個當沒上過這門課的人。', en: 'Pairs. One is the teacher, one has never taken this course.' },
        { zh: '聽的人只能一直問為什麼，不可以幫忙補話。', en: 'The listener may only keep asking why, and may not help out.' },
        { zh: '當老師的要讓對方能複述整條路線，並說出誰受影響。', en: 'The teacher must get them to retell the whole route and name who is affected.' },
        { zh: '交換角色，然後寫下你最後用的版本。', en: 'Swap roles, then write down your final version.' },
      ],
      mins: 25,
      hand: { zh: '各寫一份', en: 'One write-up each' },
      done: { zh: '你的夥伴能自己把路線講一遍', en: 'Your partner can retell the route unaided' } },

    { type: 'prose',
      head: { zh: '你講了幾次才成功？', en: 'How many attempts did it take?' },
      body: { zh: '把你最後用的那個版本貼上來。通常那個版本，才是你真的懂的。', en: 'Post the version you used last. That is usually the one you actually understand.' } },

    { type: 'bridge',
      said: [
        { zh: '蓋在那裡比較便宜', en: 'It was cheaper to build there' },
        { zh: '地形適合', en: 'The terrain suited it' },
        { zh: '合法又有效率', en: 'Legal and efficient' },
      ],
      next: { zh: '水可以取走，那工廠的廢水可以排進別人的溪嗎？', en: "If water can be taken out, can factory wastewater be put into someone else's river?" },
      lead: { zh: '為了供應更多人，水可以搬、水庫可以蓋過分水嶺。那一條河還能被拿來做什麼？', en: 'To serve more people, water can be moved and reservoirs built across a divide. What else can a river be used for?' } },
  ],
},

/* ========================= 第 5 節 ========================= */
{
  id: 's5', n: 5,
  title: { zh: '一條溪，很多人在用', en: 'One creek, many users' },
  sub:   { zh: '霄裡溪・新埔', en: 'Xiaoli Creek · Xinpu' },
  mins: 90,
  slot: 'xinpu',
  blocks: [
    { type: 'facts',
      head: { zh: '霄裡溪，新埔人叫它母親之河', en: 'Xiaoli Creek, called the mother river in Xinpu' },
      items: [
        { n: { zh: '最乾淨的等級', en: 'Cleanest classification' }, l: { zh: '曾經是全臺灣水質最高等級', en: "once rated at Taiwan's highest water quality grade" } },
        { n: { zh: '1999 年起', en: 'From 1999' }, l: { zh: '上游的面板廠開始排放', en: 'display panel plants upstream began discharging' } },
        { n: { zh: '3 萬 5 千人', en: '35,000 people' }, l: { zh: '新埔居民從這條溪取飲用水', en: 'in Xinpu drew drinking water from it' } },
        { n: { zh: '1,400 公頃', en: '1,400 hectares' }, l: { zh: '靠它灌溉的農田', en: 'of farmland irrigated by it' } },
      ] },

    { type: 'facts',
      head: { zh: '兩個常被跳過的細節', en: 'Two details that get skipped' },
      tone: 'clay',
      items: [
        { n: { zh: '只有一半多', en: 'Just over half' }, l: { zh: '當時新埔家戶有自來水的比例', en: 'of Xinpu households had piped water then' } },
        { n: { zh: '井是通的', en: 'Wells are connected' }, l: { zh: '地下水和溪水相通，溪髒了井就髒了', en: 'groundwater and creek water mix; a dirty creek means dirty wells' } },
        { n: { zh: '最高四成', en: 'Up to 40 percent' }, l: { zh: '溪流量裡是放流水的比例', en: "the share of the creek's flow that was effluent" } },
        { n: { zh: '2015 年底', en: 'By late 2015' }, l: { zh: '兩廠達成全回收，不再排放', en: 'the plants achieved full recycling, no discharge' } },
      ] },

    { type: 'lab', lab: 'effluent',
      title: { zh: '放流比例模擬', en: 'Effluent share' },
      body: { zh: '調整排放量，看溪水裡有多少不是溪水。', en: 'Adjust the discharge and see how much of the creek is not creek.' } },

    { type: 'ask',
      q: { zh: '一條溪，工廠要用，居民也要用。該怎麼分？', en: 'One creek, and both the plants and the residents need it. How should it be shared?' },
      note: { zh: '當年真正吵的是：廢水該排進哪一條溪。', en: 'What people actually argued about was which creek the wastewater should go into.' } },

    { type: 'task', id: 't5-1', lab: 'hearing',
      tid: 'Task 5-1',
      title: { zh: '霄裡溪聽證會', en: 'The Xiaoli Creek hearing' },
      steps: [
        { zh: '五個角色：新埔居民、廠方工程師、政府官員、下游農民、鄰溪居民。', en: 'Five roles: Xinpu resident, plant engineer, government official, downstream farmer, neighbouring resident.' },
        { zh: '只討論一個問題：廢水該排進哪一條溪？', en: 'One question only: which creek should the wastewater go into?' },
        { zh: '每個角色都要說出「怎樣才能接受」，不能只反對。', en: 'Every role must state what would make it acceptable, not just object.' },
        { zh: '全班投票，並記下反對的人為什麼反對。', en: 'Vote as a class and record why the dissenters dissented.' },
      ],
      mins: 90,
      hand: { zh: '角色稿與投票記錄', en: 'Role scripts and vote record' },
      done: { zh: '每個角色都說出了可接受的條件', en: 'Every role stated acceptable terms' } },

    { type: 'slotfill',
      head: { zh: '倒數第二個虛線空位', en: 'The last dashed box but one' },
      body: { zh: '新埔居民最在意的是什麼？寫下來，放進那個空位。', en: 'What did Xinpu residents care about most? Write it and place it in that box.' } },

    { type: 'bridge',
      said: [
        { zh: '新埔人是事後才知道的', en: 'Xinpu residents found out afterwards' },
        { zh: '溪不會說話', en: 'A creek cannot speak' },
        { zh: '廠方後來確實改了，但花了很多年', en: 'The plants did fix it, after years' },
      ],
      next: { zh: '缺水時抽地下水，那是跟誰借的？他能有意見嗎？', en: 'Pumping groundwater in a shortage: who is that borrowed from, and can they have a say?' },
      lead: { zh: '到目前為止的五個案例，被借的那一方都沒有參與決定。那如果他還沒出生呢？', en: 'In each of the five cases so far, the borrowed-from side had no say in the decision. What if they are not even born yet?' } },
  ],
},

/* ========================= 第 6 節 ========================= */
{
  id: 's6', n: 6,
  title: { zh: '一句話，把整件事裝進去', en: 'One sentence that holds it all' },
  sub:   { zh: '第一部分的最後一節', en: 'The last session of part one' },
  mins: 50,
  slot: 'unborn',
  blocks: [
    { type: 'facts',
      head: { zh: '新加坡以五十年為單位做規劃', en: 'Singapore plans in units of fifty years' },
      items: [
        { n: { zh: '五十年', en: 'Fifty years' }, l: { zh: '他們概念規劃的時間尺度', en: 'the horizon of their concept plan' } },
        { n: { zh: '還沒出生', en: 'Not yet born' }, l: { zh: '那時候住在那裡的人', en: 'the people who will live there then' } },
        { n: { zh: '已經決定了', en: 'Already decided' }, l: { zh: '他們沒得表示意見，但安排已經做好', en: 'they had no say, but arrangements are made' } },
        { n: { zh: '這樣好嗎？', en: 'Is that good?' }, l: { zh: '是負責任的規劃，還是替別人決定？', en: 'responsible planning, or deciding for others?' } },
      ] },

    { type: 'ask',
      q: { zh: '缺水時抽地下水，那是跟誰借的？', en: 'Pumping groundwater in a shortage: who is that borrowed from?' },
      note: { zh: '抽掉之後，含水層要幾十年才回得來。', en: 'Once pumped, an aquifer takes decades to recover.' } },

    { type: 'list',
      head: { zh: '不是總結，是綜合', en: 'Not a summary. A synthesis.' },
      lead: { zh: '一句站得住的話，要同時做到三件事：', en: 'A sentence that holds up has to do three things at once:' },
      items: [
        { t: { zh: '裝得下對立的兩邊', en: 'Hold both sides of an argument' },
          d: { zh: '不是選一邊，是兩邊的理由都放得進去。', en: 'Not pick one. Both reasons fit inside it.' } },
        { t: { zh: '站得比兩邊都高', en: 'Stand higher than either' },
          d: { zh: '原本那兩句話，變成你這句話的例子。', en: 'The two original sentences become examples of yours.' } },
        { t: { zh: '還可以被改', en: 'Stay open to revision' },
          d: { zh: '不是句點。別人還能往上加東西。', en: 'Not a full stop. Someone can still add to it.' } },
      ],
      note: { zh: '第三件最難。要留位置給別人回話，不然這句話就死了。', en: 'The third is hardest. Leave room for someone to reply, or the sentence dies.' } },

    { type: 'task', id: 't6-1', lab: 'synthesis',
      tid: 'Task 6-1',
      title: { zh: '每一組寫出一句話', en: 'Each group writes one sentence' },
      steps: [
        { zh: '看過觀點畫布上的每一則貼文。', en: 'Look at every note on the perspective canvas.' },
        { zh: '挑出互相矛盾的兩則。', en: 'Pick two that contradict each other.' },
        { zh: '寫一句話，讓那兩則都變成它的例子。', en: 'Write one sentence that makes both of them examples of it.' },
      ],
      mins: 20,
      hand: { zh: '一組一則貼文', en: '1 group post' },
      done: { zh: '你指得出它吸收了哪兩則', en: 'You can point to the two it absorbs' } },

    { type: 'example',
      head: { zh: '卡住的話，這裡有個例子', en: "If you're stuck, here is an example" },
      pair: [
        { zh: '賠了錢就算還清了', en: 'Paying for it settles the debt' },
        { zh: '回不去的東西，賠再多也沒還清', en: "If it can't be restored, nothing is settled" },
      ],
      body: { zh: '借跟拿的差別，不在於有沒有還，而在於對方有沒有機會說話。溪不會講話，被徵地的人不在場，新埔人是事後才知道的。新竹的水，其實是一個關於誰有資格決定的故事。',
              en: 'Borrowing differs from taking not in whether it is repaid, but in whether the other side had a say. The river cannot speak, the landowners were not in the room, and Xinpu residents found out afterwards. Hsinchu&rsquo;s water is a story about who gets to decide.' },
      gap: { zh: '這個例子也有漏洞：住在城裡的我們，有被問過嗎？', en: 'This example has a gap too: were those of us in the city ever asked?' } },

    { type: 'task', id: 't6-2',
      tid: 'Task 6-2',
      title: { zh: '幫另一組把他們的話補得更完整', en: 'Help another group make theirs more complete' },
      steps: [
        { zh: '讀另一組寫的那句話。', en: "Read another group's sentence." },
        { zh: '指出一件它還沒解決的事。', en: 'Name one thing it has not settled yet.' },
        { zh: '只講一件，而且要具體。', en: 'One thing only, and be specific.' },
      ],
      mins: 12,
      hand: { zh: '一則回覆', en: '1 reply post' },
      done: { zh: '你指出的是沒解決的事，不是你不同意的事', en: 'You named an unsettled point, not a disagreement' } },

    { type: 'task', id: 't6-3', lab: 'shift',
      tid: 'Task 6-3',
      title: { zh: '回頭看你一開始畫的那張', en: 'Look back at your first drawing' },
      steps: [
        { zh: '找出你那張「我一開始以為」的照片。', en: 'Find your "What I thought at the start" photo.' },
        { zh: '寫一句：我以前以為＿＿＿，現在我會說＿＿＿。', en: 'Write one line: I used to think ___, now I would say ___.' },
        { zh: '貼上去。', en: 'Post it.' },
      ],
      mins: 10,
      hand: { zh: '個人一則貼文', en: '1 individual post' },
      done: { zh: '你講得出改變了什麼', en: 'You can say what changed' } },

    { type: 'ask',
      q: { zh: '新竹在對外宣傳自己的時候，裡面有水嗎？', en: 'Is there any water in how Hsinchu is advertised?' },
      note: { zh: '科技城、風城、米粉貢丸。水好像從來不是重點。', en: 'Tech city, windy city, rice noodles and fishballs. Water never seems to be the story.' } },

    { type: 'task', id: 't6-4',
      tid: 'Task 6-4',
      title: { zh: '快速提案：三個站', en: 'A quick pitch: three stops' },
      steps: [
        { zh: '如果有人在新竹只有三小時，你要帶他去哪裡看水？', en: 'If someone had three hours in Hsinchu, where would you take them to see water?' },
        { zh: '講出三個地點。其中一個必須是不好看的地方。', en: 'Name three stops. One of them must be somewhere unattractive.' },
        { zh: '加一句：這條路線讓人看見誰，又讓誰留在鏡頭外？', en: 'Add one line: who does this route show, and who stays out of frame?' },
      ],
      mins: 15,
      hand: { zh: '口頭提案', en: 'Spoken pitch' },
      done: { zh: '你說得出誰被留在鏡頭外', en: 'You can name who stays out of frame' } },
  ],
},

/* ========================= 第 7 節 ========================= */
{
  id: 's7', n: 7,
  part: 2,
  title: { zh: '別人都怎麼寫', en: 'How other people write it' },
  sub:   { zh: '三種文本，同一件事', en: 'Three texts, one subject' },
  mins: 50,
  blocks: [
    { type: 'prose',
      head: { zh: '讀來的，寫的時候要用得上', en: 'What you learn reading, you use writing' },
      pairs: [
        [{ zh: '找出重點，其他丟掉', en: 'Find the main point, drop the rest' }, { zh: '把十節課壓成一個短短的產品名', en: 'Compress ten sessions into a short product name' }],
        [{ zh: '看出作者站在哪一邊', en: 'See which side the author is on' }, { zh: '選定你的立場，而且讓人看得出來', en: 'Choose your position and make it visible' }],
        [{ zh: '推測作者略過了什麼', en: 'Infer what the author left out' }, { zh: '故意略過一些東西', en: 'Leave something out on purpose' }],
        [{ zh: '看懂一篇文章怎麼組起來的', en: 'See how a text is put together' }, { zh: '選一個結構，並說明為什麼', en: 'Pick a structure and say why' }],
        [{ zh: '比較兩篇寫同一件事的文章', en: 'Compare two texts on one subject' }, { zh: '讓你的文案跟別人的擺在一起也站得住', en: "Make your copy hold up next to someone else's" }],
      ] },

    { type: 'facts',
      head: { zh: '今天讀三種文本', en: 'Three kinds of text today' },
      items: [
        { n: { zh: '官方介紹', en: 'Official description' }, l: { zh: '水庫自己的網站怎麼描述它', en: "how the reservoir's own website describes it" } },
        { n: { zh: '新聞報導', en: 'News report' }, l: { zh: '霄裡溪那幾年是怎麼被報導的', en: 'how the Xiaoli Creek years were reported' } },
        { n: { zh: '觀光文案', en: 'Tourism copy' }, l: { zh: '新加坡或新竹怎麼宣傳自己', en: 'how Singapore or Hsinchu is advertised' } },
        { n: { zh: '同一件事', en: 'Same subject' }, l: { zh: '都在講水，寫法完全不一樣', en: 'all about water, written in completely different ways' } },
      ] },

    { type: 'ask',
      q: { zh: '同一件事，為什麼可以有三種寫法？', en: 'Why can one subject be written three different ways?' },
      note: { zh: '不是誰對，是各自想達成什麼。', en: 'Not who is right, but what each is trying to achieve.' } },

    { type: 'task', id: 't7-1', lab: 'table3',
      tid: 'Task 7-1',
      title: { zh: '填一張三欄表', en: 'Fill in a three-column table' },
      steps: [
        { zh: '每一種文本填三欄。', en: 'For each text, fill three columns.' },
        { zh: '第一欄：它要我知道什麼？', en: 'One: what does it want me to know?' },
        { zh: '第二欄：它要我覺得怎樣？', en: 'Two: what does it want me to feel?' },
        { zh: '第三欄：它沒有提到誰？', en: 'Three: who does it not mention?' },
      ],
      mins: 20,
      hand: { zh: '一張表', en: '1 table' },
      done: { zh: '三種文本的第三欄都填了', en: 'Column three filled for all three texts' } },

    { type: 'task', id: 't7-2',
      tid: 'Task 7-2',
      title: { zh: '把文章拆開', en: 'Take the texts apart' },
      steps: [
        { zh: '圈出轉折：語氣改變的那一句。', en: 'Circle the turn, the sentence where the tone changes.' },
        { zh: '每一段下一個五個字以內的標題。', en: 'Give each paragraph a heading of five words or fewer.' },
        { zh: '分組比對：官方文案和觀光文案，結構是不是一樣的？', en: 'Compare in groups: do the official text and the tourism copy share a structure?' },
      ],
      mins: 20,
      hand: { zh: '你畫過記號的文本', en: 'Your marked-up texts' },
      done: { zh: '每一段都有標題', en: 'Every paragraph has a heading' } },

    { type: 'prose',
      head: { zh: '你現在手上有兩種寫法', en: 'You now have two ways of writing' },
      body: { zh: '官方的寫法，和觀光的寫法。下一節你要選一種，或者兩種都不要。', en: 'The official way and the tourism way. Next session you pick one, or refuse both.' } },
  ],
},

/* ========================= 第 8 節 ========================= */
{
  id: 's8', n: 8,
  part: 2,
  title: { zh: '三版草稿', en: 'Three drafts' },
  sub:   { zh: '寫作', en: 'Writing' },
  mins: 50,
  blocks: [
    { type: 'ask',
      q: { zh: '三版都要留著。我看的是它們之間的距離。', en: 'Keep all three drafts. What I read is the distance between them.' },
      note: { zh: '最後一版有多好，沒有你想的那麼重要。', en: 'How good the last one is matters less than you think.' } },

    { type: 'task', id: 't8', lab: 'drafts',
      tid: 'Task 8-1 → 8-3',
      title: { zh: '一百字、三十字、留一個問題', en: 'A hundred words, thirty words, one question' },
      steps: [
        { zh: '第一版：想到什麼寫什麼，不要停下來改。寫滿一百字。', en: "Draft one: write whatever comes. Don't stop to fix anything. Fill a hundred words." },
        { zh: '第二版：用三個方法砍到三十字，每砍一次在旁邊註明砍掉了什麼。', en: 'Draft two: apply the three methods and cut to thirty words, noting in the margin what you cut.' },
        { zh: '第三版：留一個缺口，讓讀的人想問問題。寫下你希望他問什麼。', en: 'Draft three: leave a gap so the reader is left with a question. Write down the question you hope they ask.' },
      ],
      mins: 39,
      hand: { zh: '三版草稿加一個問題', en: 'Three drafts plus a question' },
      done: { zh: '你講得出你希望對方問什麼', en: 'You can name the question you want asked' } },

    { type: 'list',
      head: { zh: '砍到三十字的三個方法', en: 'Three ways to cut it to thirty words' },
      items: [
        { t: { zh: '把形容詞全部刪掉', en: 'Delete every adjective' },
          d: { zh: '看剩下什麼。剩下的才是你要講的。', en: 'See what survives. What survives is what you meant.' } },
        { t: { zh: '抽象換具體', en: 'Swap abstractions for specifics' },
          d: { zh: '不要寫「珍貴」。試試「157 公頃，2006 年」。', en: 'Not "precious". Try "157 hectares, 2006".' } },
        { t: { zh: '動詞放在名詞前面', en: 'Verbs before nouns' },
          d: { zh: '「水被取走了」贏過「水資源配置議題」。', en: '"The water was taken" beats "water resource allocation issues".' } },
      ],
      note: { zh: '這三招你以後寫任何東西都用得上，不只這一次。', en: 'These three work on anything you ever write, not just this.' } },

    { type: 'prose',
      head: { zh: '這些字不准用', en: 'These words are not allowed' },
      banned: true,
      body: { zh: '這些字放到哪裡都通，所以它們什麼都沒說。把「美麗的溪」換成「1999 年以前可以直接喝的溪」，差別就出來了。',
              en: 'These words fit anywhere, which is why they say nothing. Swap "beautiful creek" for "a creek you could drink from before 1999" and the difference appears.' } },

    { type: 'prose',
      head: { zh: '三版並排看一次', en: 'Lay all three drafts side by side' },
      body: { zh: '從第一版到第三版，你丟掉了什麼？留下來的，才是你真正想講的。', en: 'From draft one to draft three, what did you throw away? What stayed is what you actually meant.' } },
  ],
},

/* ========================= 第 9 節 ========================= */
{
  id: 's9', n: 9,
  part: 2,
  title: { zh: '把東西做出來', en: 'Make the thing' },
  sub:   { zh: '產品設計', en: 'Product design' },
  mins: 90,
  blocks: [
    { type: 'ask',
      q: { zh: '拿到它的人要問出一個問題，而不是覺得新竹好漂亮。', en: 'It should make whoever holds it ask a question, not think Hsinchu looks nice.' },
      note: { zh: '好看是附加的，不是重點。', en: 'Looking good is a bonus, not the point.' } },

    { type: 'task', id: 't9-1', lab: 'make',
      tid: 'Task 9-1',
      title: { zh: '做一個東西出來', en: 'Make something' },
      steps: [
        { zh: '上面要有一個具體的地點、數字，或人。', en: 'It must carry a specific place, number, or person.' },
        { zh: '不准出現禁用字。', en: 'No words from the banned list.' },
        { zh: '至少用到三個科目，而且要寫下用在哪裡。', en: 'Use at least three subjects and write down where.' },
        { zh: '你要說得出它把誰留在外面。', en: 'You must be able to say who it leaves out.' },
      ],
      mins: 90,
      hand: { zh: '成品或設計稿', en: 'The object or a design' },
      done: { zh: '三個科目都指得出用在哪', en: 'All three subjects located' } },

    { type: 'list',
      head: { zh: '沒靈感的話', en: "If you're short of ideas" },
      items: [
        { t: { zh: '借據明信片', en: 'Loan-note postcard' }, d: { zh: '正面是攔河堰，背面是一張空白借據，讓收到的人自己填。', en: 'The weir on the front. On the back, a blank loan note for the recipient to fill in' } },
        { t: { zh: '一套六張', en: 'A set of six' }, d: { zh: '一次借水一張。第六張是空白的。', en: 'One for each borrowing. The sixth is blank' } },
        { t: { zh: '年份杯墊', en: 'Year coaster' }, d: { zh: '一個年份，一個數字。不解釋。', en: 'A single year and a single number. No explanation' } },
        { t: { zh: '空白徽章', en: 'Blank badge' }, d: { zh: '完全沒有圖。卡片上寫：還沒有人替他說話。', en: 'No image at all. The card reads: nobody speaks for this one yet' } },
      ],
      note: { zh: '最後一個吵最兇，也最看得出誰真的懂了這門課。', en: 'The last one starts the most arguments, and shows most clearly who understood the course.' } },

    { type: 'task', id: 't9-2',
      tid: 'Task 9-2',
      title: { zh: '寫說明卡', en: 'Write the card' },
      steps: [
        { zh: '一百字，說明這個東西在講什麼。', en: 'A hundred words on what this object is about.' },
        { zh: '列出三個科目，各用在哪裡。', en: 'List the three subjects and where each was used.' },
        { zh: '最後一行：這個東西把誰留在外面。', en: 'Last line: who this object leaves out.' },
      ],
      mins: 20,
      hand: { zh: '一張說明卡', en: '1 card' },
      done: { zh: '科目和被留下的人都寫了', en: 'Subjects and omission both stated' } },
  ],
},

/* ========================= 第 10 節 ========================= */
{
  id: 's10', n: 10,
  part: 2,
  title: { zh: '拿給沒上過這門課的人看', en: "Show it to someone who wasn't here" },
  sub:   { zh: '交換測試', en: 'Exchange test' },
  mins: 90,
  blocks: [
    { type: 'ask',
      q: { zh: '沒上過這門課的人，看得懂嗎？', en: "Can someone who never took this course understand it?" },
      note: { zh: '看不懂就是還沒做完。那不是他的問題。', en: "If they can't, it isn't finished. That is not their fault." } },

    { type: 'task', id: 't10-1', lab: 'testing',
      tid: 'Task 10-1',
      title: { zh: '找人來測試', en: 'Find testers' },
      steps: [
        { zh: '把成品和文案拿給別班、家人，或另一位老師看。', en: 'Show the object and copy to another class, family, or another teacher.' },
        { zh: '不要解釋。讓他們自己看。', en: "Don't explain. Let them look." },
        { zh: '只問一個問題：你覺得這在講什麼？', en: 'Ask one question: what do you think this is about?' },
        { zh: '把他們的回答一字不改記下來。', en: 'Write down their answer word for word.' },
      ],
      mins: 25,
      hand: { zh: '3 份測試記錄', en: '3 test records' },
      done: { zh: '三個人的原話都記下來了', en: "Three people's exact words" } },

    { type: 'task', id: 't10-2',
      tid: 'Task 10-2',
      title: { zh: '回去改', en: 'Go back and revise' },
      steps: [
        { zh: '他們誤讀了什麼？寫下來。', en: 'What did they misread? Write it down.' },
        { zh: '那是東西的問題，還是文案的問題？', en: "Is that the object's problem or the copy's?" },
        { zh: '改一次，再測一次。', en: 'Revise once, then test again.' },
      ],
      mins: 25,
      hand: { zh: '修改前後對照', en: 'Before and after' },
      done: { zh: '你說得出被誤讀的是什麼', en: 'You can name what was misread' } },

    { type: 'task', id: 't10-3', lab: 'ballot',
      tid: 'Task 10-3',
      title: { zh: '如果只能留一個', en: 'If only one could stay' },
      steps: [
        { zh: '把全班的成品排成一列。', en: 'Line up every object in the class.' },
        { zh: '如果只能留一個代表新竹，你留誰的？', en: 'If one had to represent Hsinchu, whose would you keep?' },
        { zh: '寫下理由。「比較好看」不算。', en: 'Write your reason. "It looks best" is not allowed.' },
        { zh: '得票最高的那組要回答：你的東西把誰留在外面？', en: 'The group with the most votes answers: who does yours leave out?' },
      ],
      mins: 20,
      hand: { zh: '每人一票', en: '1 ballot each' },
      done: { zh: '理由跟外觀無關', en: 'The reason is not about appearance' } },

    { type: 'prose',
      head: { zh: '你剛剛做的事，新加坡也做', en: 'What you just did, Singapore does too' },
      body: { zh: '他們選了魚尾獅，你們選了自己的東西。差別在於，你們說得出它把誰留在外面。', en: 'They chose the Merlion. You chose your own thing. The difference is that you can say who it leaves out.' } },

    { type: 'prose', tone: 'big',
      body: { zh: '新加坡把自己的形象做成一個看得見的東西。<br>新竹的水，還沒有人講過它的故事。<br>這一次，我們來講。',
              en: 'Singapore made its own image something you can look at.<br>Nobody has told the story of Hsinchu&rsquo;s water.<br>This time, we tell it.' },
      note: { zh: '你可以寫一個更好的版本。誰要試？', en: 'You are welcome to write a better version. Who wants to try?' } },
  ],
},
];

/* 節次索引 */
export const BY_ID = Object.fromEntries(SESSIONS.map(s => [s.id, s]));

/* 借水的六個節點，供水流模擬與流域地圖共用 */
export const ROUTE = [
  { id: 'shangping', name: { zh: '上坪溪', en: 'Shangping River' },   role: { zh: '水從這裡開始', en: 'where it starts' } },
  { id: 'weir',      name: { zh: '上坪攔河堰', en: 'Shangping Weir' }, role: { zh: '在這裡被攔下', en: 'held back here' } },
  { id: 'canal',     name: { zh: '竹東大圳', en: 'Zhudong Canal' },    role: { zh: '沿渠道送過去', en: 'carried across' } },
  { id: 'baoshan',   name: { zh: '寶山水庫', en: 'Baoshan Reservoir' },role: { zh: '存起來', en: 'stored' } },
  { id: 'tap',       name: { zh: '你家水龍頭', en: 'Your tap' },       role: { zh: '用掉', en: 'used' } },
];
