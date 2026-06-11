import React, { useEffect, useMemo, useState } from 'react';
import { C, STATUS } from '../tokens.js';
import { Icon } from '../icons.jsx';
import { Btn, Confidence, Field, LevelBar, SectionLabel, StatusBadge, TopBar } from '../components.jsx';
import { CATALOG, CATEGORIES, EMOJIS, FREQS, estimate, etaLabel, fmtShort, fromIso, levelPct } from '../model.js';

/* ─── CADASTRO DE PRODUTO ─────────────────────────────────────
   Jornada simplificada (inspirada em Listonic / Google Tasks):
   digitou → sugestões do catálogo completam tudo → 1 toque.
   Detalhes (ícone, embalagem, frequência) ficam opcionais. */
export default function AddProductScreen({ products, onBack, onSave, onScan, prefillName = '' }) {
  const [name, setName] = useState(prefillName);
  const [emoji, setEmoji] = useState('🛒');
  const [pack, setPack] = useState('');
  const [cat, setCat] = useState('Mercearia');
  const [freq, setFreq] = useState('mensal');
  const [haveIt, setHaveIt] = useState(true);
  const [details, setDetails] = useState(false);

  const existing = new Set(products.map(p => p.name.toLowerCase()));
  const suggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (q.length < 1) return [];
    return CATALOG.filter(c => c.name.toLowerCase().includes(q) && !existing.has(c.name.toLowerCase())).slice(0, 4);
  }, [name]);

  const matched = CATALOG.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
  useEffect(() => {
    if (matched) {
      setEmoji(matched.emoji); setCat(matched.cat);
      if (!pack) setPack(matched.pack);
    }
  }, [matched?.name]);

  const pickSuggestion = s => {
    setName(s.name); setEmoji(s.emoji); setCat(s.cat); setPack(s.pack);
    const f = FREQS.reduce((best, cur) => Math.abs(cur[2] - s.interval) < Math.abs(best[2] - s.interval) ? cur : best);
    setFreq(f[0]);
  };

  const save = () => {
    if (!name.trim()) return;
    onSave({ emoji, name: name.trim(), pack: pack || '1 un', cat, freq, haveIt });
  };

  return (
    <>
      <TopBar title="Novo produto" sub="Cadastro" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 28px' }}>
        {/* NFC-e atalho */}
        <div onClick={onScan} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: C.n900, borderRadius: 16, cursor: 'pointer', marginBottom: 18 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="qr" size={22} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: '700 14px ' + C.font, color: '#fff' }}>Escanear nota fiscal (NFC-e)</div>
            <div style={{ font: '500 12px ' + C.font, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>Cadastra vários produtos de uma vez</div>
          </div>
          <Icon name="chevronR" size={18} color="rgba(255,255,255,.5)" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 18px' }}>
          <div style={{ flex: 1, height: 1, background: C.n200 }}></div>
          <span style={{ font: '500 12px ' + C.font, color: C.n400 }}>ou cadastre manualmente</span>
          <div style={{ flex: 1, height: 1, background: C.n200 }}></div>
        </div>

        <Field label="O que é?" icon="package" value={name} onChange={setName} placeholder="Ex: Café, Leite, Detergente…" autoFocus />

        {/* sugestões do catálogo — preenchem tudo com 1 toque */}
        {suggestions.length > 0 && !matched && (
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: -6, marginBottom: 14 }}>
            {suggestions.map(s => (
              <button key={s.name} onClick={() => pickSuggestion(s)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
                border: `1.5px solid ${C.green200}`, background: C.green50, font: '600 13px ' + C.font, color: C.green700 }}>
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Já tenho em casa */}
        <div onClick={() => setHaveIt(h => !h)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', background: haveIt ? C.green50 : C.n0, border: `1.5px solid ${haveIt ? C.green500 : C.n200}`, borderRadius: 14, cursor: 'pointer', marginBottom: 16, transition: `all .2s ${C.ease}` }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: haveIt ? C.green500 : 'transparent', border: `1.5px solid ${haveIt ? C.green500 : C.n300}` }}>
            {haveIt && <Icon name="check" size={14} color="#fff" strokeWidth={3} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 14px ' + C.font, color: haveIt ? C.green700 : C.n800 }}>Já tenho em casa</div>
            <div style={{ font: '500 11.5px ' + C.font, color: C.n400, marginTop: 1 }}>A previsão começa a contar a partir de hoje</div>
          </div>
        </div>

        {/* Detalhes opcionais */}
        <div onClick={() => setDetails(d => !d)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
          <Icon name={details ? 'chevronD' : 'chevronR'} size={16} color={C.n500} />
          <span style={{ font: '700 13px ' + C.font, color: C.n600 }}>Detalhes (opcional)</span>
          <span style={{ font: '500 12px ' + C.font, color: C.n400 }}>{emoji} · {cat}{pack ? ` · ${pack}` : ''}</span>
        </div>

        {details && (
          <div className="fade-in-up">
            <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 78 }}>
                <div style={{ font: '600 12px ' + C.font, color: C.n600, marginBottom: 7 }}>Ícone</div>
                <div style={{ height: 52, borderRadius: 14, border: `1.5px solid ${C.n200}`, background: C.n0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{emoji}</div>
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Quantidade da embalagem" value={pack} onChange={setPack} placeholder="Ex: 500g, 1 L, 12 un" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 18 }}>
              {EMOJIS.map((e, i) => (
                <button key={i} onClick={() => setEmoji(e)} style={{ width: 38, height: 38, borderRadius: 11, fontSize: 19, cursor: 'pointer',
                  border: `1.5px solid ${emoji === e ? C.green500 : C.n200}`, background: emoji === e ? C.green50 : C.n0 }}>{e}</button>
              ))}
            </div>

            <div style={{ font: '600 12px ' + C.font, color: C.n600, marginBottom: 8 }}>Categoria</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 20 }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCat(c)} style={{ padding: '8px 14px', borderRadius: 999, cursor: 'pointer', font: '600 13px ' + C.font,
                  border: `1.5px solid ${cat === c ? 'transparent' : C.n200}`, background: cat === c ? C.grad : C.n0, color: cat === c ? '#fff' : C.n600 }}>{c}</button>
              ))}
            </div>

            <div style={{ font: '600 12px ' + C.font, color: C.n600, marginBottom: 8 }}>Com que frequência você compra?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              {FREQS.map(([k, l, d]) => (
                <button key={k} onClick={() => setFreq(k)} style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                  border: `1.5px solid ${freq === k ? C.green500 : C.n200}`, background: freq === k ? C.green50 : C.n0 }}>
                  <div style={{ font: '700 13.5px ' + C.font, color: freq === k ? C.green700 : C.n800 }}>{l}</div>
                  <div style={{ font: '500 11.5px ' + C.font, color: C.n400, marginTop: 2 }}>~{d} dias</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '11px 13px', background: C.blue50, borderRadius: 13, marginTop: 8 }}>
          <Icon name="sparkles" size={16} color={C.blue600} />
          <span style={{ font: '500 12px/1.45 ' + C.font, color: C.blue600 }}>Isso é só um chute inicial. A partir da 2ª compra o app aprende seu ritmo real e ajusta sozinho.</span>
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '12px 20px calc(20px + env(safe-area-inset-bottom))', background: 'linear-gradient(to top, #F8FAFC 70%, transparent)', borderTop: `1px solid ${C.n100}` }}>
        <Btn full size="lg" icon="check" disabled={!name.trim()} onClick={save}>Salvar produto</Btn>
      </div>
    </>
  );
}

/* ─── DETALHE DO PRODUTO (conteúdo de Sheet) ─────────────── */
export function ProductDetail({ p, onMarkBought, onAddToList, onDelete, onClose }) {
  if (!p) return null;
  const { status, endDate } = estimate(p);
  const s = STATUS[status];
  const pct = levelPct(p);
  const last = p.purchases?.length ? p.purchases[p.purchases.length - 1] : null;
  const history = (p.purchases || []).slice(-6).reverse();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <div style={{ width: 60, height: 60, borderRadius: 17, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>{p.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: C.display, fontSize: 22, fontWeight: 700, color: C.n900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
          <div style={{ font: '500 13px ' + C.font, color: C.n400 }}>{p.pack} · {p.cat}</div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div style={{ background: C.n50, borderRadius: 16, padding: '15px 16px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
          <span style={{ font: '600 13px ' + C.font, color: C.n600 }}>Nível estimado</span>
          <span style={{ font: '700 14px ' + C.font, color: s.color }}>{etaLabel(p)}</span>
        </div>
        {status !== 'new' && <LevelBar pct={pct} status={status} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.n200}` }}>
          <div>
            <div style={{ font: '500 11px ' + C.font, color: C.n400 }}>Última compra</div>
            <div style={{ font: '700 14px ' + C.font, color: C.n800, marginTop: 2 }}>{last ? fmtShort(fromIso(last)) : '—'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ font: '500 11px ' + C.font, color: C.n400 }}>Ritmo aprendido</div>
            <div style={{ font: '700 14px ' + C.font, color: C.n800, marginTop: 2 }}>{estimate(p).interval ? `~${estimate(p).interval} dias` : '—'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ font: '500 11px ' + C.font, color: C.n400 }}>Compras</div>
            <div style={{ font: '700 14px ' + C.font, color: C.n800, marginTop: 2 }}>{(p.purchases || []).length}×</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: 16 }}>
        <Confidence product={p} />
        {endDate && <span style={{ font: '500 12px ' + C.font, color: C.n400 }}>previsão: {fmtShort(endDate)}</span>}
      </div>

      {history.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionLabel>Histórico de compras</SectionLabel>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {history.map(d => (
              <span key={d} style={{ font: '600 12px ' + C.font, color: C.n600, background: C.n100, padding: '5px 11px', borderRadius: 999 }}>
                {fmtShort(fromIso(d))}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <Btn full variant="secondary" icon={p.onList ? 'check' : 'cart'} onClick={() => onAddToList(p)}>{p.onList ? 'Na lista' : 'À lista'}</Btn>
        <Btn full icon="check" onClick={() => { onMarkBought(p); onClose(); }}>Comprei agora</Btn>
      </div>
      <Btn full variant="danger" icon="trash" onClick={() => { onDelete(p); onClose(); }}>Remover da despensa</Btn>
    </div>
  );
}
