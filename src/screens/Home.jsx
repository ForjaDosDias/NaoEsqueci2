import React, { useState } from 'react';
import { C } from '../tokens.js';
import { Icon } from '../icons.jsx';
import { estimate, isSnoozed } from '../model.js';
import { AttentionCard, AttentionCompact, FAB, PantryRow, SectionLabel, Sheet } from '../components.jsx';

export default function HomeScreen({ user, products, settings, onNav, onAddToList, onStillHave, onOpen, onAddProduct }) {
  const attention = products.filter(p => { const st = estimate(p).status; return (st === 'low' || st === 'out') && !isSnoozed(p); });
  const fine = products.filter(p => !attention.includes(p));
  const outCount = attention.filter(p => estimate(p).status === 'out').length;
  const lowCount = attention.filter(p => estimate(p).status === 'low').length;
  const [bannerOpen, setBannerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { alertStyle, showLevel } = settings;

  return (
    <>
      <div style={{ flexShrink: 0, padding: '18px 20px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ font: '500 13px ' + C.font, color: C.n400, marginBottom: 2 }}>Olá, {user?.name || 'você'} 👋</div>
            <div style={{ fontFamily: C.display, fontSize: 28, fontWeight: 700, color: C.n900, lineHeight: 1.1, whiteSpace: 'nowrap' }}>
              Sua <em style={{ fontStyle: 'italic', fontWeight: 400 }}>despensa</em>
            </div>
          </div>
          <div onClick={() => setNotifOpen(true)} style={{ width: 42, height: 42, borderRadius: 13, background: C.n0, boxShadow: C.shadowCard, border: `1px solid ${C.n100}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
            <Icon name="bell" size={20} color={C.n600} />
            {attention.length > 0 && <span style={{ position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 999, background: C.red500, border: '2px solid #fff' }}></span>}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px 110px' }}>
        {/* Resumo */}
        <div style={{ display: 'flex', gap: 9, marginBottom: 18 }}>
          {[
            { n: products.length, l: 'na despensa', c: C.n900, bg: C.n0 },
            { n: lowCount, l: 'acabando', c: C.amber700, bg: C.amber50 },
            { n: outCount, l: 'acabaram', c: C.red700, bg: C.red50 },
          ].map((x, i) => (
            <div key={i} style={{ flex: 1, background: x.bg, borderRadius: 15, padding: '13px 12px', boxShadow: i === 0 ? C.shadowCard : 'none', border: `1px solid ${i === 0 ? C.n100 : 'transparent'}` }}>
              <div style={{ fontFamily: C.display, fontSize: 26, fontWeight: 700, color: x.c, lineHeight: 1 }}>{x.n}</div>
              <div style={{ font: '600 11px ' + C.font, color: x.c, opacity: .8, marginTop: 4 }}>{x.l}</div>
            </div>
          ))}
        </div>

        {/* ATENÇÃO — estilo configurável no Perfil */}
        {attention.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            {alertStyle === 'banner' ? (
              <div onClick={() => setBannerOpen(o => !o)} style={{ background: C.gradAmber, borderRadius: 18, padding: '15px 16px', boxShadow: '0 8px 22px rgba(217,119,6,.26)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="bell" size={22} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ font: '700 15px ' + C.font, color: '#fff' }}>{attention.length} {attention.length === 1 ? 'item precisa' : 'itens precisam'} de atenção</div>
                    <div style={{ font: '500 12.5px ' + C.font, color: 'rgba(255,255,255,.85)', marginTop: 2 }}>{lowCount} acabando · {outCount} já acabaram</div>
                  </div>
                  <Icon name={bannerOpen ? 'chevronD' : 'chevronR'} size={20} color="#fff" />
                </div>
              </div>
            ) : (
              <SectionLabel color={C.amber700}>⚠️ Atenção · precisam de você</SectionLabel>
            )}

            <div style={{ marginTop: alertStyle === 'banner' ? (bannerOpen ? 10 : 0) : 0, maxHeight: alertStyle === 'banner' && !bannerOpen ? 0 : 3000, overflow: 'hidden', transition: `max-height .4s ${C.ease}` }}>
              {attention.map(p => (
                alertStyle === 'compact'
                  ? <AttentionCompact key={p.id} p={p} onAddToList={onAddToList} onStillHave={onStillHave} onOpen={onOpen} />
                  : <AttentionCard key={p.id} p={p} onAddToList={onAddToList} onStillHave={onStillHave} onOpen={onOpen} />
              ))}
            </div>
          </div>
        )}

        {/* Em dia */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2px 0 9px' }}>
          <SectionLabel color={C.green700}>✓ Em dia · {fine.length}</SectionLabel>
          <span onClick={() => onNav('status')} style={{ font: '700 12px ' + C.font, color: C.green700, cursor: 'pointer' }}>Ver status</span>
        </div>
        {fine.map(p => <PantryRow key={p.id} p={p} onOpen={onOpen} showLevel={showLevel} />)}

        {products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '36px 30px' }}>
            <div style={{ fontSize: 46, marginBottom: 12 }}>🧺</div>
            <div style={{ fontFamily: C.display, fontSize: 20, fontWeight: 700, color: C.n900, marginBottom: 6 }}>Despensa vazia</div>
            <div style={{ font: '400 14px/1.5 ' + C.font, color: C.n500 }}>Preencha seu armário ou escaneie uma nota fiscal para o app começar a prever.</div>
            <div onClick={() => onNav('armario')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '11px 18px', background: C.grad, borderRadius: 14, color: '#fff', font: '700 14px ' + C.font, cursor: 'pointer', boxShadow: C.shadowFab }}>
              <Icon name="box" size={17} color="#fff" /> Preencher o armário
            </div>
          </div>
        )}

        {/* registrar compra rápida */}
        {products.length > 0 && (
          <div onClick={() => onNav('buy')} style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', background: C.green50, borderRadius: 18, cursor: 'pointer', border: `1.5px dashed ${C.green200}` }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: C.shadowFab }}>
              <Icon name="cart" size={21} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ font: '700 14.5px ' + C.font, color: C.green700 }}>Comprou algo? Registre com 1 toque</div>
              <div style={{ font: '500 12px ' + C.font, color: C.green600, marginTop: 2 }}>Ou escaneie o QR da nota fiscal</div>
            </div>
            <Icon name="chevronR" size={18} color={C.green600} />
          </div>
        )}
      </div>

      <FAB onClick={onAddProduct} />

      {/* Notificações */}
      <Sheet open={notifOpen} onClose={() => setNotifOpen(false)}>
        <div style={{ fontFamily: C.display, fontSize: 22, fontWeight: 700, color: C.n900, marginBottom: 4 }}>Notificações</div>
        <div style={{ font: '500 13px ' + C.font, color: C.n500, marginBottom: 16 }}>
          {attention.length === 0 ? 'Tudo em dia por aqui 🎉' : 'Pelo seu ritmo de consumo, estes itens precisam de você:'}
        </div>
        {attention.map(p => (
          <AttentionCompact key={p.id} p={p}
            onAddToList={x => { onAddToList(x); }}
            onStillHave={x => { onStillHave(x); }}
            onOpen={x => { setNotifOpen(false); onOpen(x); }} />
        ))}
      </Sheet>
    </>
  );
}
