import React, { useState } from 'react';
import { C, STATUS } from '../tokens.js';
import { PantryRow, SectionLabel, TopBar } from '../components.jsx';
import { estimate } from '../model.js';

/* ─── STATUS DOS ITENS ────────────────────────────────────── */
export default function StatusScreen({ products, onBack, onOpen, onAddToList }) {
  const [filter, setFilter] = useState('all');
  const withStatus = products.map(p => ({ ...p, _st: estimate(p).status }));
  const order = { out: 0, low: 1, new: 2, ok: 3 };
  const filtered = withStatus
    .filter(p => filter === 'all' || p._st === filter)
    .sort((a, b) => order[a._st] - order[b._st]);

  const filters = [['all', 'Todos', C.n700], ['out', 'Acabou', C.red600], ['low', 'Acabando', C.amber600], ['ok', 'Em dia', C.green600]];
  const counts = {
    out: withStatus.filter(p => p._st === 'out').length,
    low: withStatus.filter(p => p._st === 'low').length,
    ok: withStatus.filter(p => p._st === 'ok' || p._st === 'new').length,
  };

  return (
    <>
      <TopBar title="Status dos itens" sub="Sua despensa em tempo real" onBack={onBack} />
      <div style={{ flexShrink: 0, padding: '0 18px 12px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {filters.map(([k, l, c]) => {
          const on = filter === k;
          const n = k === 'all' ? products.length : counts[k];
          return (
            <button key={k} onClick={() => setFilter(k)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              border: `1.5px solid ${on ? 'transparent' : C.n200}`, background: on ? c : C.n0, color: on ? '#fff' : C.n600, font: '700 12.5px ' + C.font }}>
              {k !== 'all' && <span style={{ width: 7, height: 7, borderRadius: 999, background: on ? '#fff' : c }}></span>}
              {l} <span style={{ opacity: .7 }}>{n}</span>
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 16px 110px' }}>
        {['out', 'low', 'ok', 'new'].filter(st => filter === 'all' || filter === st || (filter === 'ok' && st === 'new')).map(st => {
          const group = filtered.filter(p => p._st === st);
          if (!group.length) return null;
          const s = STATUS[st];
          const titles = { out: 'Acabou — reponha', low: 'Deve estar acabando', ok: 'Acabou de comprar / em dia', new: 'Aprendendo o padrão' };
          return (
            <div key={st} style={{ marginBottom: 16 }}>
              <SectionLabel color={s.color}>{titles[st]} · {group.length}</SectionLabel>
              {group.map(p => (
                <PantryRow key={p.id} p={p} onOpen={onOpen} onQuickAdd={st === 'out' || st === 'low' ? onAddToList : undefined} />
              ))}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 30px', font: '400 14px/1.5 ' + C.font, color: C.n500 }}>
            Nada por aqui com esse filtro.
          </div>
        )}
      </div>
    </>
  );
}
