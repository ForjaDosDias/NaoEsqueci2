import React, { useMemo, useState } from 'react';
import { C, STATUS } from '../tokens.js';
import { Icon } from '../icons.jsx';
import { Btn, Field, SectionLabel, Sheet, TopBar } from '../components.jsx';
import { CATALOG, estimate, etaLabel } from '../model.js';

const money = v => `R$ ${v.toFixed(2).replace('.', ',')}`;

/* ─── LISTA DE COMPRAS (multi-listas, qtd, preços) ────────── */
export default function ListaScreen({ lists, items, activeListId, products, dispatch, onToast }) {
  const active = lists.find(l => l.id === activeListId) || lists[0];
  const listItems = items.filter(i => i.listId === active?.id);
  const checkedCount = listItems.filter(i => i.checked).length;

  const [q, setQ] = useState('');
  const [manageOpen, setManageOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const priceOf = it => {
    if (it.productId) {
      const p = products.find(x => x.id === it.productId);
      if (p?.lastPrice) return p.lastPrice * (it.qty || 1);
    }
    return null;
  };
  const known = listItems.map(priceOf).filter(v => v != null);
  const total = known.reduce((a, b) => a + b, 0);

  /* sugestões: despensa primeiro, depois catálogo */
  const suggestions = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const inList = new Set(listItems.map(i => (i.name || '').toLowerCase()));
    const fromPantry = products
      .filter(p => p.name.toLowerCase().includes(query) && !inList.has(p.name.toLowerCase()))
      .map(p => ({ productId: p.id, name: p.name, emoji: p.emoji, cat: p.cat }));
    const names = new Set(fromPantry.map(s => s.name.toLowerCase()));
    const fromCatalog = CATALOG
      .filter(c => c.name.toLowerCase().includes(query) && !names.has(c.name.toLowerCase()) && !inList.has(c.name.toLowerCase()))
      .map(c => ({ productId: null, name: c.name, emoji: c.emoji, cat: c.cat }));
    return [...fromPantry, ...fromCatalog].slice(0, 5);
  }, [q, products, listItems]);

  const addItem = (s) => {
    dispatch({ type: 'item-add', listId: active.id, ...s });
    setQ('');
  };
  const addFree = () => {
    if (!q.trim()) return;
    addItem({ name: q.trim().replace(/^./, c => c.toUpperCase()), emoji: '🛒', cat: 'Outros' });
  };

  const share = async () => {
    const lines = listItems.map(i => `${i.checked ? '✅' : '⬜'} ${i.name}${i.qty > 1 || i.unit !== 'un' ? ` — ${i.qty} ${i.unit}` : ''}`);
    const text = `🛒 ${active.name} (Não Esqueci)\n\n${lines.join('\n')}`;
    try {
      if (navigator.share) { await navigator.share({ title: active.name, text }); return; }
      await navigator.clipboard.writeText(text);
      onToast('Lista copiada — cole onde quiser');
    } catch { /* usuário cancelou */ }
  };

  const predicted = listItems.filter(i => i.predicted && !i.checked);
  const rest = listItems.filter(i => !i.predicted && !i.checked);
  const done = listItems.filter(i => i.checked);
  const byCat = {};
  for (const it of rest) (byCat[it.cat || 'Outros'] ||= []).push(it);

  const Row = ({ it }) => {
    const p = it.productId ? products.find(x => x.id === it.productId) : null;
    const st = p ? estimate(p).status : null;
    const alert = st === 'low' || st === 'out';
    const price = priceOf(it);
    const on = it.checked;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', background: on ? C.n50 : C.n0, borderRadius: 14, boxShadow: on ? 'none' : C.shadowCard, border: `1px solid ${C.n100}`, marginBottom: 8, opacity: on ? .6 : 1, transition: `all .25s ${C.ease}` }}>
        <button onClick={() => dispatch({ type: 'item-update', id: it.id, patch: { checked: !on } })}
          style={{ width: 26, height: 26, borderRadius: 9, flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: on ? C.green500 : 'transparent', border: `2px solid ${on ? C.green500 : C.n300}`, transition: `all .2s ${C.ease}` }}
          className={on ? 'check-pop' : ''}>
          {on && <Icon name="check" size={15} color="#fff" strokeWidth={3} />}
        </button>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: C.n100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, filter: on ? 'grayscale(1)' : 'none' }}>{it.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '600 14px ' + C.font, color: C.n900, textDecoration: on ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
            {!on && alert && <span style={{ font: '500 11px ' + C.font, color: STATUS[st].color }}>{etaLabel(p)}</span>}
            {price != null && <span style={{ font: '600 11px ' + C.font, color: C.n400 }}>{money(price)}</span>}
          </div>
        </div>
        {!on && it.predicted && <span style={{ font: '700 10px ' + C.font, color: C.green700, background: C.green50, padding: '3px 8px', borderRadius: 999, flexShrink: 0 }}>previsto</span>}
        {/* stepper de quantidade */}
        {!on && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: C.n100, borderRadius: 10, flexShrink: 0 }}>
            <button onClick={() => dispatch({ type: 'item-update', id: it.id, patch: { qty: Math.max(1, (it.qty || 1) - 1) } })}
              style={{ width: 26, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="minus" size={13} color={C.n500} strokeWidth={2.4} />
            </button>
            <span style={{ font: '700 12.5px ' + C.font, color: C.n800, minWidth: 26, textAlign: 'center' }}>
              {it.qty}{it.unit !== 'un' ? ` ${it.unit}` : ''}
            </span>
            <button onClick={() => dispatch({ type: 'item-update', id: it.id, patch: { qty: (it.qty || 1) + 1 } })}
              style={{ width: 26, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={13} color={C.n500} strokeWidth={2.4} />
            </button>
          </div>
        )}
        <button onClick={() => dispatch({ type: 'item-remove', id: it.id })} style={{ width: 28, height: 28, borderRadius: 9, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="x" size={15} color={C.n300} />
        </button>
      </div>
    );
  };

  return (
    <>
      <TopBar title={active ? `${active.emoji} ${active.name}` : 'Lista'}
        sub={`${listItems.length} ${listItems.length === 1 ? 'item' : 'itens'}${total > 0 ? ` · estimado ${money(total)}` : ''}`}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <div onClick={share} style={{ width: 38, height: 38, borderRadius: 12, background: C.n100, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Compartilhar">
              <Icon name="share" size={17} color={C.n600} />
            </div>
            <div onClick={() => setManageOpen(true)} style={{ width: 38, height: 38, borderRadius: 12, background: C.n100, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Editar lista">
              <Icon name="edit" size={17} color={C.n600} />
            </div>
          </div>
        } />

      {/* seletor de listas */}
      <div style={{ flexShrink: 0, padding: '0 18px 10px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {lists.map(l => {
          const on = l.id === active?.id;
          const n = items.filter(i => i.listId === l.id).length;
          return (
            <button key={l.id} onClick={() => dispatch({ type: 'list-select', id: l.id })} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              border: `1.5px solid ${on ? 'transparent' : C.n200}`, background: on ? C.grad : C.n0, color: on ? '#fff' : C.n600, font: '700 12.5px ' + C.font,
              boxShadow: on ? '0 4px 12px rgba(34,197,94,.2)' : 'none' }}>
              {l.emoji} {l.name}{n > 0 && <span style={{ opacity: .7 }}>{n}</span>}
            </button>
          );
        })}
        <button onClick={() => setNewOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
          border: `1.5px dashed ${C.n300}`, background: 'transparent', color: C.n500, font: '700 12.5px ' + C.font }}>
          <Icon name="plus" size={13} color={C.n500} strokeWidth={2.4} /> Nova
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 16px 110px' }}>
        {/* adicionar item livre */}
        <div style={{ position: 'relative', marginBottom: suggestions.length ? 4 : 14 }}>
          <div style={{ position: 'absolute', left: 14, top: 14 }}><Icon name="plus" size={18} color={C.n400} /></div>
          <input value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') (suggestions[0] ? addItem(suggestions[0]) : addFree()); }}
            placeholder="Adicionar item… (ex: pão, pilha, 🥑)"
            style={{ width: '100%', height: 46, paddingLeft: 42, paddingRight: 14, border: `1.5px solid ${C.n200}`, borderRadius: 14, font: '500 14.5px ' + C.font, color: C.n900, outline: 'none', background: C.n0 }} />
        </div>
        {suggestions.length > 0 && (
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => addItem(s)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
                border: `1.5px solid ${C.green200}`, background: C.green50, font: '600 13px ' + C.font, color: C.green700 }}>
                {s.emoji} {s.name}{s.productId ? '' : ' +'}
              </button>
            ))}
            <button onClick={addFree} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
              border: `1.5px dashed ${C.n300}`, background: C.n0, font: '600 13px ' + C.font, color: C.n500 }}>
              Criar “{q.trim()}”
            </button>
          </div>
        )}

        {listItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 30px' }}>
            <div style={{ fontSize: 46, marginBottom: 12 }}>🛒</div>
            <div style={{ fontFamily: C.display, fontSize: 20, fontWeight: 700, color: C.n900, marginBottom: 6 }}>Lista vazia</div>
            <div style={{ font: '400 14px/1.5 ' + C.font, color: C.n500 }}>Digite acima para adicionar, ou espere a previsão sugerir o que está acabando.</div>
          </div>
        ) : (
          <>
            {predicted.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', background: C.gradSoft, borderRadius: 16, marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="sparkles" size={20} color={C.green700} />
                  </div>
                  <span style={{ font: '600 12.5px/1.45 ' + C.font, color: C.green700 }}>Montamos sua lista automaticamente com o que deve acabar nos próximos dias.</span>
                </div>
                <SectionLabel color={C.green700}>✨ Sugeridos pela previsão · {predicted.length}</SectionLabel>
                {predicted.map(it => <Row key={it.id} it={it} />)}
              </>
            )}

            {Object.entries(byCat).map(([cat, group]) => (
              <div key={cat}>
                <div style={{ height: 6 }}></div>
                <SectionLabel>{cat} · {group.length}</SectionLabel>
                {group.map(it => <Row key={it.id} it={it} />)}
              </div>
            ))}

            {done.length > 0 && (
              <>
                <div style={{ height: 6 }}></div>
                <SectionLabel>No carrinho · {done.length}</SectionLabel>
                {done.map(it => <Row key={it.id} it={it} />)}
              </>
            )}

            <div style={{ marginTop: 14 }}>
              <Btn full size="lg" variant="dark" icon="checkCircle" disabled={checkedCount === 0}
                onClick={() => { dispatch({ type: 'finish-shopping', listId: active.id }); onToast('Compra registrada! Previsões reiniciadas.'); }}>
                Finalizei as compras {checkedCount > 0 ? `(${checkedCount})` : ''}
              </Btn>
              <div style={{ textAlign: 'center', font: '500 11.5px ' + C.font, color: C.n400, marginTop: 10 }}>Ao marcar como comprado, reiniciamos a previsão de cada item.</div>
            </div>
          </>
        )}
      </div>

      {/* nova lista */}
      <Sheet open={newOpen} onClose={() => setNewOpen(false)} height="46%">
        <NewListForm onCreate={(name, emoji) => { dispatch({ type: 'list-create', name, emoji }); setNewOpen(false); }} />
      </Sheet>

      {/* gerenciar lista ativa */}
      <Sheet open={manageOpen} onClose={() => setManageOpen(false)} height="52%">
        {active && <ManageListForm key={active.id} list={active} canDelete={lists.length > 1}
          onSave={(name, emoji) => { dispatch({ type: 'list-rename', id: active.id, name, emoji }); setManageOpen(false); }}
          onDelete={() => { dispatch({ type: 'list-delete', id: active.id }); setManageOpen(false); }} />}
      </Sheet>
    </>
  );
}

const LIST_EMOJIS = ['🛒', '🥩', '🎂', '🏖️', '🏠', '💊', '🐶', '🎁'];

function NewListForm({ onCreate }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🛒');
  return (
    <div>
      <div style={{ fontFamily: C.display, fontSize: 22, fontWeight: 700, color: C.n900, marginBottom: 14 }}>Nova lista</div>
      <Field label="Nome" value={name} onChange={setName} placeholder="Ex: Churrasco, Farmácia…" autoFocus />
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 18 }}>
        {LIST_EMOJIS.map(e => (
          <button key={e} onClick={() => setEmoji(e)} style={{ width: 40, height: 40, borderRadius: 11, fontSize: 20, cursor: 'pointer',
            border: `1.5px solid ${emoji === e ? C.green500 : C.n200}`, background: emoji === e ? C.green50 : C.n0 }}>{e}</button>
        ))}
      </div>
      <Btn full size="lg" icon="check" disabled={!name.trim()} onClick={() => onCreate(name.trim(), emoji)}>Criar lista</Btn>
    </div>
  );
}

function ManageListForm({ list, canDelete, onSave, onDelete }) {
  const [name, setName] = useState(list.name);
  const [emoji, setEmoji] = useState(list.emoji);
  return (
    <div>
      <div style={{ fontFamily: C.display, fontSize: 22, fontWeight: 700, color: C.n900, marginBottom: 14 }}>Editar lista</div>
      <Field label="Nome" value={name} onChange={setName} />
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 18 }}>
        {LIST_EMOJIS.map(e => (
          <button key={e} onClick={() => setEmoji(e)} style={{ width: 40, height: 40, borderRadius: 11, fontSize: 20, cursor: 'pointer',
            border: `1.5px solid ${emoji === e ? C.green500 : C.n200}`, background: emoji === e ? C.green50 : C.n0 }}>{e}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {canDelete && <Btn variant="danger" icon="trash" onClick={onDelete}>Excluir</Btn>}
        <Btn full icon="check" disabled={!name.trim()} onClick={() => onSave(name.trim(), emoji)}>Salvar</Btn>
      </div>
    </div>
  );
}
