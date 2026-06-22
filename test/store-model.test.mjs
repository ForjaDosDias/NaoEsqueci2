/* Testes de unidade do estado:
   #5 — item com "Ainda tenho" (snooze) volta sozinho à lista após o prazo;
        remoção manual de previsto continua permanente até nova compra.
   #9 — makeProduct nasce com shape consistente (dismissedAuto/lastPrice). */
import { autoPopulate, reducer } from '../src/store.js';
import { makeProduct, iso, addDays, today } from '../src/model.js';

let failed = 0;
const check = (name, cond) => { console.log(`${cond ? '✓' : '✗'} ${name}`); if (!cond) failed = 1; };

// produto "acabado": comprado há muito tempo, intervalo curto → status 'out'
const outProduct = (over = {}) => ({
  ...makeProduct({ name: 'Café', initialInterval: 7 }),
  purchases: [iso(addDays(today(), -60))],
  ...over,
});
const stateWith = products => ({ lists: [{ id: 'L1', name: 'Mercado' }], items: [], products });

/* ── #9 — shape do makeProduct ── */
{
  const p = makeProduct({ name: 'Arroz' });
  check('#9 makeProduct define dismissedAuto:false', p.dismissedAuto === false);
  check('#9 makeProduct define lastPrice:null', p.lastPrice === null);
  check('#9 makeProduct mantém snoozedUntil:null', p.snoozedUntil === null);
}

/* ── #5 — auto-população respeitando snooze ── */
{
  const s = autoPopulate(stateWith([outProduct()]));
  check('#5 item acabado é auto-inserido na lista', s.items.length === 1 && s.items[0].predicted);
}
{
  const snoozed = outProduct({ snoozedUntil: iso(addDays(today(), 3)) });
  check('#5 snooze ativo não repopula', autoPopulate(stateWith([snoozed])).items.length === 0);
}
{
  const expired = outProduct({ snoozedUntil: iso(addDays(today(), -1)) });
  check('#5 snooze vencido repopula a lista', autoPopulate(stateWith([expired])).items.length === 1);
}

/* ── #5 — fluxo completo via reducer (snooze → expira → volta) ── */
{
  let st = autoPopulate(stateWith([outProduct()]));            // entra na lista
  st = reducer(st, { type: 'snooze', id: st.products[0].id }); // "Ainda tenho"
  check('#5 snooze remove o item previsto da lista', st.items.length === 0);
  check('#5 snooze grava snoozedUntil futuro', !!st.products[0].snoozedUntil);
  check('#5 snooze não marca dismissedAuto permanente', st.products[0].dismissedAuto === false);
  check('#5 enquanto snoozed, autoPopulate não readiciona', autoPopulate(st).items.length === 0);
  st = { ...st, products: st.products.map(p => ({ ...p, snoozedUntil: iso(addDays(today(), -1)) })) };
  check('#5 após expirar o snooze, autoPopulate readiciona', autoPopulate(st).items.length === 1);
}

/* ── remoção manual de previsto continua permanente (não regrediu) ── */
{
  let st = autoPopulate(stateWith([outProduct()]));
  st = reducer(st, { type: 'item-remove', id: st.items[0].id });
  check('item removido à mão não repopula sozinho', autoPopulate(st).items.length === 0);
}

process.exit(failed);
