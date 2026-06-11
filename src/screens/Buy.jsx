import React, { useState } from 'react';
import { C } from '../tokens.js';
import { Icon } from '../icons.jsx';
import { SectionLabel, TopBar } from '../components.jsx';
import { estimate, fmtShort, today } from '../model.js';

/* ─── MARCAÇÃO DE COMPRA (1 toque) ────────────────────────── */
export default function BuyScreen({ products, onBack, onMarkBought, onScan, onAddNew }) {
  const [q, setQ] = useState('');
  const [bought, setBought] = useState(() => new Set());

  const list = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <TopBar title="Comprei" sub="Marcação de compra" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 28px' }}>
        {/* hero NFC-e */}
        <div onClick={onScan} style={{ background: C.grad, borderRadius: 20, padding: '18px', boxShadow: C.shadowFab, marginBottom: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -18, top: -18, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
            <div style={{ width: 54, height: 54, borderRadius: 15, background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="qr" size={28} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 16px ' + C.font, color: '#fff' }}>Escanear QR da nota</div>
              <div style={{ font: '500 12.5px/1.4 ' + C.font, color: 'rgba(255,255,255,.85)', marginTop: 3 }}>Registra tudo que você comprou automaticamente</div>
            </div>
          </div>
        </div>

        <SectionLabel>Ou marque manualmente · 1 toque</SectionLabel>
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><Icon name="search" size={18} color={C.n400} /></div>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar produto…"
            style={{ width: '100%', height: 48, paddingLeft: 42, paddingRight: 14, border: `1.5px solid ${C.n200}`, borderRadius: 14, font: '500 15px ' + C.font, color: C.n900, outline: 'none', background: C.n0 }} />
        </div>

        {list.map(p => {
          const done = bought.has(p.id);
          const { boughtDaysAgo } = estimate(p);
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', background: done ? C.green50 : C.n0,
              borderRadius: 15, boxShadow: C.shadowCard, border: `1px solid ${done ? C.green200 : C.n100}`, marginBottom: 8, transition: `all .3s ${C.ease}` }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: done ? C.green100 : C.n100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0 }}>{p.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '600 14.5px ' + C.font, color: C.n900 }}>{p.name} <span style={{ font: '500 11px ' + C.font, color: C.n400 }}>{p.pack}</span></div>
                <div style={{ font: '500 12px ' + C.font, color: done ? C.green700 : C.n400, marginTop: 2 }}>
                  {done ? `✓ Comprado em ${fmtShort(today())}`
                    : boughtDaysAgo != null ? `Última: há ${boughtDaysAgo} ${boughtDaysAgo === 1 ? 'dia' : 'dias'}` : 'Sem compras registradas'}
                </div>
              </div>
              <button onClick={() => { if (!done) { setBought(prev => new Set(prev).add(p.id)); onMarkBought(p); } }} disabled={done} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12, border: 'none', cursor: done ? 'default' : 'pointer',
                font: '700 13.5px ' + C.font, color: '#fff', background: done ? C.green500 : C.grad, boxShadow: done ? 'none' : '0 5px 14px rgba(34,197,94,.25)',
                flexShrink: 0, transition: `all .25s ${C.ease}`, transform: done ? 'scale(.96)' : 'scale(1)' }}
                className={done ? 'check-pop' : ''}>
                <Icon name={done ? 'check' : 'plus'} size={16} color="#fff" strokeWidth={2.4} />
                {done ? 'Feito' : 'Comprei'}
              </button>
            </div>
          );
        })}

        {q.trim() && list.length === 0 && (
          <div onClick={() => onAddNew(q.trim())} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: C.green50, borderRadius: 15, cursor: 'pointer', border: `1.5px dashed ${C.green200}` }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="plus" size={18} color="#fff" strokeWidth={2.2} />
            </div>
            <div style={{ font: '600 14px ' + C.font, color: C.green700 }}>Cadastrar “{q.trim()}” na despensa</div>
          </div>
        )}

        {bought.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 14px', background: C.green50, borderRadius: 14, marginTop: 6, border: `1px solid ${C.green200}` }} className="fade-in-up">
            <Icon name="sparkles" size={18} color={C.green600} />
            <div>
              <div style={{ font: '700 13px ' + C.font, color: C.green700 }}>Anotado! Data salva.</div>
              <div style={{ font: '500 12px/1.45 ' + C.font, color: C.green600, marginTop: 2 }}>Atualizamos a previsão de quando esse item vai acabar. Quanto mais você marca, mais preciso fica.</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
