import React, { useState } from 'react';
import { C } from '../tokens.js';
import { Icon } from '../icons.jsx';
import { Btn, SectionLabel, TopBar } from '../components.jsx';
import { CATALOG, CATEGORIES } from '../model.js';

/* ─── PREENCHER O QUE TEM NO ARMÁRIO ──────────────────────── */
export default function ArmarioScreen({ products, onBack, onSave, onboarding }) {
  const [sel, setSel] = useState(() => new Set());
  const existing = new Set(products.map(p => p.name.toLowerCase()));
  const toggle = name => setSel(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });

  return (
    <>
      <TopBar title="Seu armário" sub="O que você já tem em casa" onBack={onboarding ? undefined : onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 14px', background: C.green50, borderRadius: 14, marginBottom: 18 }}>
          <Icon name="box" size={20} color={C.green600} />
          <span style={{ font: '500 12.5px/1.45 ' + C.font, color: C.green700 }}>Marque o que já está na sua despensa. Assim o app começa a prever quando cada item vai acabar — sem esperar a próxima compra.</span>
        </div>

        {CATEGORIES.map(g => {
          const items = CATALOG.filter(c => c.cat === g);
          if (!items.length) return null;
          return (
            <div key={g} style={{ marginBottom: 16 }}>
              <SectionLabel>{g}</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {items.map((it, idx) => {
                  const already = existing.has(it.name.toLowerCase());
                  const on = already || sel.has(it.name);
                  return (
                    <button key={it.name + idx} onClick={() => !already && toggle(it.name)} disabled={already} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 14, cursor: already ? 'default' : 'pointer', textAlign: 'left',
                      opacity: already ? .55 : 1,
                      border: `1.5px solid ${on ? C.green500 : C.n200}`, background: on ? C.green50 : C.n0, transition: `all .2s ${C.ease}` }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: on ? C.green100 : C.n100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{it.emoji}</div>
                      <span style={{ flex: 1, font: '600 13px ' + C.font, color: on ? C.green700 : C.n800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</span>
                      <div style={{ width: 20, height: 20, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: on ? C.green500 : 'transparent', border: `1.5px solid ${on ? C.green500 : C.n300}` }}>
                        {on && <Icon name="check" size={13} color="#fff" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ flexShrink: 0, padding: '12px 20px calc(20px + env(safe-area-inset-bottom))', borderTop: `1px solid ${C.n100}`, display: 'flex', gap: 10, alignItems: 'center' }}>
        <Btn variant="ghost" onClick={onBack}>Pular</Btn>
        <Btn full size="lg" icon="check" onClick={() => onSave(CATALOG.filter(c => sel.has(c.name)))}>
          Adicionar {sel.size > 0 ? `(${sel.size})` : ''}
        </Btn>
      </div>
    </>
  );
}
