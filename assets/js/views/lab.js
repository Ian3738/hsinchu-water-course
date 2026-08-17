/* 互動工具的分派 */
import { h, eyebrow } from '../ui.js';
import { getLang } from '../i18n.js';

const LABS = {
  flow:      () => import('./labs/flow.js'),
  basin:     () => import('./labs/water.js').then(m => ({ default: m.basin })),
  effluent:  () => import('./labs/water.js').then(m => ({ default: m.effluent })),
  debate:    () => import('./labs/debate.js'),
  invoice:   () => import('./labs/invoice.js'),
  hearing:   () => import('./labs/hearing.js'),
  route:     () => import('./labs/make.js').then(m => ({ default: m.route })),
  make:      () => import('./labs/make.js').then(m => ({ default: m.make })),
  testing:   () => import('./labs/make.js').then(m => ({ default: m.testing })),
  ballot:    () => import('./labs/make.js').then(m => ({ default: m.ballot })),
  table3:    () => import('./labs/writing.js').then(m => ({ default: m.table3 })),
  drafts:    () => import('./labs/writing.js').then(m => ({ default: m.drafts })),
  synthesis: () => import('./labs/writing.js').then(m => ({ default: m.synthesis })),
  shift:     () => import('./labs/writing.js').then(m => ({ default: m.shift })),
};

export default async function lab(root, ctx) {
  const name = ctx.arg;
  const loader = LABS[name];
  if (!loader) {
    root.append(h('.wrap.section.stack', [
      eyebrow('404'),
      h('h1.ask', { text: getLang() === 'zh' ? '沒有這個工具' : 'No such tool' }),
      h('a.btn', { href: '#/' }, getLang() === 'zh' ? '回總覽' : 'Back to map'),
    ]));
    return;
  }
  const mod = await loader();
  const cleanup = await mod.default(root, ctx);

  root.append(h('.toolbar', [
    h('.wrap--wide.toolbar__inner', [
      h('a.btn.btn--sm.btn--ghost', { href: '#/' }, '← ' + (getLang() === 'zh' ? '回總覽' : 'Back to map')),
      h('span.grow'),
      h('a.btn.btn--sm', { href: '#/board' }, getLang() === 'zh' ? '觀點畫布' : 'Perspective Canvas'),
    ]),
  ]));

  return cleanup;
}
