import React, { useState } from 'react';
import { C, STATUS } from '../tokens.js';
import { Icon } from '../icons.jsx';
import { Btn, SectionLabel, TopBar } from '../components.jsx';
import { estimate, etaLabel } from '../model.js';

/* ─── LISTA DE COMPRAS PRÉ-POPULADA ───────────────────────── */
export default function ListaScreen({ products, onBack, onToggleList, onFinish }) {
  const onList = products.filter(p => p.onList);
  const predicted = onList.filter(p => !p.manualList);
  const manual = onList.filter(p => p.manualList);
  const [checked, setChecked] = useState(() => new Set());
  const toggle = id => setChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const Row = ({ p }) => {
    const on = checked.has(p.id);
    const { status } = estimate(p);
    const s = STATUS[status];
    const alert = status === 'low' || status === 'out';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', background: on ? C.n50 : C.n0, borderRadius: 14, boxShadow: on ? 'none' : C.shadowCard, border: `1px solid ${C.n100}`, marginBottom: 8, opacity: on ? .6 : 1, transition: `all .25s ${C.ease}` }}>
        <button onClick={() => toggle(p.id)} style={{ width: 26, height: 26, borderRadius: 9, flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: on ? C.green500 : 'transparent', border: `2px solid ${on ? C.green500 : C.n300}`, transition: `all .2s ${C.ease}` }}
          className={on ? 'check-pop' : ''}>
          {on && <Icon name="check" size={15} color="#fff" strokeWidth={3} />}
        </button>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: C.n100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0, filter: on ? 'grayscale(1)' : 'none' }}>{p.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '600 14.5px ' + C.font, color: C.n900, textDecoration: on ? 'line-through' : 'none' }}>{p.name} <span style={{ font: '500 11px ' + C.font, color: C.n400 }}>{p.pack}</span></div>
          {!on && alert && <div style={{ font: '500 11.5px ' + C.font, color: s.color, marginTop: 1 }}>{etaLabel(p)}</div>}
        </div>
        {!on && !p.manualList && <span style={{ font: '700 10px ' + C.font, color: C.green700, background: C.green50, padding: '3px 8px', borderRadius: 999, flexShrink: 0 }}>previsto</span>}
        <button onClick={() => onToggleList(p)} style={{ width: 30, height: 30, borderRadius: 9, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="x" size={16} color={C.n300} />
        </button>
      </div>
    );
  };

  return (
    <>
      <TopBar title="Lista de compras" sub={`${onList.length} ${onList.length === 1 ? 'item' : 'itens'}`} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '2px 16px 110px' }}>
        {onList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 30px' }}>
            <div style={{ fontSize: 46, marginBottom: 12 }}>🛒</div>
            <div style={{ fontFamily: C.display, fontSize: 20, fontWeight: 700, color: C.n900, marginBottom: 6 }}>Lista vazia</div>
            <div style={{ font: '400 14px/1.5 ' + C.font, color: C.n500 }}>Quando algo estiver acabando, é só tocar em “Adicionar à lista” que aparece aqui.</div>
          </div>
        ) : (
          <>
            {predicted.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', background: C.gradSoft, borderRadius: 16, marginBottom: 18 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="sparkles" size={20} color={C.green700} />
                </div>
                <span style={{ font: '600 12.5px/1.45 ' + C.font, color: C.green700 }}>Montamos sua lista automaticamente com o que deve acabar nos próximos dias.</span>
              </div>
            )}

            {predicted.length > 0 && <>
              <SectionLabel color={C.green700}>✨ Sugeridos pela previsão · {predicted.length}</SectionLabel>
              {predicted.map(p => <Row key={p.id} p={p} />)}
            </>}
            {manual.length > 0 && <>
              <div style={{ height: 8 }}></div>
              <SectionLabel>Adicionados por você · {manual.length}</SectionLabel>
              {manual.map(p => <Row key={p.id} p={p} />)}
            </>}

            <div style={{ marginTop: 14 }}>
              <Btn full size="lg" variant="dark" icon="checkCircle" disabled={checked.size === 0}
                onClick={() => { onFinish([...checked]); setChecked(new Set()); }}>
                Finalizei as compras {checked.size > 0 ? `(${checked.size})` : ''}
              </Btn>
              <div style={{ textAlign: 'center', font: '500 11.5px ' + C.font, color: C.n400, marginTop: 10 }}>Ao marcar como comprado, reiniciamos a previsão de cada item.</div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
