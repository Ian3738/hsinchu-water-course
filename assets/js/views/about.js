/* 關於這門課 */
import { h, eyebrow } from '../ui.js';
import { getLang } from '../i18n.js';
import { SLOTS } from '../../data/personas.js';

export default function about(root) {
  const zh = getLang() === 'zh';

  root.append(h('section.wrap.section.stack.enter', [
    eyebrow(zh ? '關於這門課' : 'ABOUT'),
    h('h1.ask.ask--wide', { text: zh ? '為什麼要問「跟誰借的」' : 'Why ask whom it was borrowed from' }),
    h('p.lede', { text: zh
      ? '公共議題的課堂討論裡，受影響最深的一方往往不在現場。溪不會說話，遷居的人已經離開，還沒出生的人無從表達。學習者因此很容易把議題化約成在場者之間的意見分歧。'
      : 'In classroom discussion of public issues, those most affected are usually not in the room. A river cannot speak, displaced households have left, and the unborn cannot testify. Learners then reduce the issue to disagreement among those present.' }),
    h('p', { text: zh
      ? '這門課的作法很具體：在課堂討論工具上留幾個空位，標示「還沒有人替他說話」，然後一節一節把它們填起來。'
      : 'This course does one concrete thing: it leaves positions on the discussion tool marked "nobody speaks for this one yet", and fills them in one session at a time.' }),
  ]));

  root.append(h('section.wrap.section--tight.stack', [
    eyebrow(zh ? '六個空位' : 'THE SIX POSITIONS'),
    h('.cols-2', SLOTS.map(s => h('.card', [
      h('p.mono', { style: { margin: 0, fontSize: 'var(--t-micro)', letterSpacing: '.18em', color: 'var(--water-lit)' },
                    text: `${zh ? '第' : 'SESSION'} ${s.unlock} ${zh ? '節' : ''}` }),
      h('p.card__title', { text: s.who[zh ? 'zh' : 'en'] }),
      h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: s.tag[zh ? 'zh' : 'en'] }),
    ]))),
  ]));

  root.append(h('section.wrap.section--tight.stack', [
    eyebrow(zh ? '幾件要說清楚的事' : 'A FEW THINGS TO BE CLEAR ABOUT'),
    h('.stack-sm', [
      ['模擬器不是水文推估', 'The simulators are not hydrological estimates',
       '引水與放流的模擬用相對比例呈現取捨，讓「取走多少、下游剩多少」看得見。真實數字要去水利署與環境部查。',
       'They show trade-offs in relative terms so the cost downstream is visible. Real figures come from the water and environment agencies.'],
      ['AI 說的話不是事實來源', "The agent's words are not a source",
       'agent 只講自己的處境。學生要事實，得自己查。腳本模式的回應是預先寫好的，連線模式則由伺服器端的模型生成，兩者都受同一套守則約束。',
       'It speaks only to its own situation. Facts are for the learners to look up. Scripted replies are pre-written; live replies come from a server-side model. Both follow the same guardrails.'],
      ['資料存在哪裡', 'Where the data lives',
       '沒有設定同步時，所有作答只存在這台裝置的瀏覽器裡，清除瀏覽資料就會消失。要保留請用教師控制台匯出。',
       'Without sync configured, everything stays in this browser and disappears if you clear site data. Export from the console to keep it.'],
    ].map(([zt, et, zd, ed]) => h('.card', [
      h('p.card__title', { text: zh ? zt : et }),
      h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh ? zd : ed }),
    ]))),
  ]));

  root.append(h('section.wrap.section--tight.stack', [
    h('.card.card--clay', [
      h('p.card__title', { text: zh ? '快捷鍵' : 'Keyboard' }),
      h('p.muted', { style: { margin: 0, fontSize: 'var(--t-sm)' }, text: zh
        ? 'P 投影模式（字級放大）　·　B 跳到觀點畫布　·　節次頁用左右方向鍵換節'
        : 'P projection mode · B the canvas · arrow keys move between sessions' }),
    ]),
  ]));
}
