import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { C } from '../tokens.js';
import { Icon } from '../icons.jsx';
import { Btn, SectionLabel, TopBar } from '../components.jsx';
import { DEMO_NOTE, nfceDate, parseNfceQr } from '../nfce.js';
import { estimate, fromIso, today } from '../model.js';
import { extractPack, guessMeta, matchProduct, titleCase } from '../match.js';

/* ===========================================================
   Leitura do QR Code da NFC-e.
   1. "aim": câmera + decodificação (BarcodeDetector ou jsQR)
   2. "fetching": o backend consulta a página pública da nota
      na SEFAZ e devolve os itens com quantidades e preços
   3. "items": usuário confirma itens/quantidades (1 toque)
   4. fallback "manual": se a SEFAZ não responder, o usuário
      marca o que estava na compra
   =========================================================== */

function useQrScanner(onCode, active) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!active) return;
    let stream, raf, stopped = false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const detector = 'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
    let lastScan = 0;

    const tick = async (ts) => {
      if (stopped) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2 && ts - lastScan > 220) {
        lastScan = ts;
        try {
          if (detector) {
            const codes = await detector.detect(video);
            if (codes.length) { onCode(codes[0].rawValue); return; }
          } else {
            const w = Math.min(640, video.videoWidth);
            const h = Math.round(w * video.videoHeight / video.videoWidth) || 480;
            canvas.width = w; canvas.height = h;
            ctx.drawImage(video, 0, 0, w, h);
            const img = ctx.getImageData(0, 0, w, h);
            const code = jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
            if (code?.data) { onCode(code.data); return; }
          }
        } catch { /* frame ruim — tenta o próximo */ }
      }
      raf = requestAnimationFrame(tick);
    };

    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        if (stopped) { s.getTracks().forEach(t => t.stop()); return; }
        stream = s;
        const video = videoRef.current;
        if (video) { video.srcObject = s; video.play().catch(() => {}); }
        raf = requestAnimationFrame(tick);
      })
      .catch(e => setError(e?.name === 'NotAllowedError'
        ? 'Permita o acesso à câmera para escanear a nota.'
        : 'Câmera indisponível neste aparelho/navegador.'));

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [active]);

  return { videoRef, error };
}

export default function ScanScreen({ products, onBack, onConfirm }) {
  const [phase, setPhase] = useState('aim');   // aim | fetching | items | manual
  const [note, setNote] = useState(null);       // dados do QR
  const [fetched, setFetched] = useState(null); // resposta do backend { store, date, total, items }
  const [fetchErr, setFetchErr] = useState(null);
  const [invalid, setInvalid] = useState(false);

  const handleCode = async (text) => {
    const parsed = parseNfceQr(text);
    if (!parsed) { setInvalid(true); setTimeout(() => setInvalid(false), 2500); return; }
    setNote(parsed);
    if (!parsed.url) { setFetchErr('O QR Code não trouxe o endereço da SEFAZ.'); setPhase('manual'); return; }
    setPhase('fetching');
    try {
      const res = await fetch(`/api/nfce?url=${encodeURIComponent(parsed.url)}`, { signal: AbortSignal.timeout(18000) });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.items?.length) {
        setFetched(body);
        setPhase('items');
      } else {
        setFetchErr(body?.message || 'A SEFAZ não retornou os itens dessa nota.');
        setPhase('manual');
      }
    } catch {
      setFetchErr('Não consegui falar com o servidor. Confirme os itens manualmente.');
      setPhase('manual');
    }
  };

  const { videoRef, error } = useQrScanner(handleCode, phase === 'aim');

  const startDemo = () => {
    setNote({ ...parseNfceQr(DEMO_NOTE.key), total: DEMO_NOTE.total, store: DEMO_NOTE.store });
    setFetched({ store: DEMO_NOTE.store, date: null, total: DEMO_NOTE.total, items: DEMO_NOTE.items });
    setPhase('items');
  };

  if (phase === 'items') {
    return <ConfirmItems note={note} fetched={fetched} products={products} onBack={() => setPhase('aim')} onConfirm={onConfirm} />;
  }
  if (phase === 'manual') {
    return <ConfirmManual note={note} reason={fetchErr} products={products} onBack={() => setPhase('aim')} onConfirm={onConfirm} />;
  }

  const fetching = phase === 'fetching';
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.n900 }}>
      <TopBar title="Escanear nota" sub="NFC-e" onBack={onBack} light />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 30px', position: 'relative' }}>
        <div style={{ width: 260, height: 260, position: 'relative' }}>
          <video ref={videoRef} muted playsInline style={{ position: 'absolute', inset: 10, width: 'calc(100% - 20px)', height: 'calc(100% - 20px)', objectFit: 'cover', borderRadius: 16, background: 'rgba(255,255,255,.06)', opacity: fetching ? .3 : 1 }} />
          {[[0, 0], [1, 0], [0, 1], [1, 1]].map((c, i) => (
            <div key={i} style={{ position: 'absolute', width: 42, height: 42,
              left: c[0] ? 'auto' : 0, right: c[0] ? 0 : 'auto', top: c[1] ? 'auto' : 0, bottom: c[1] ? 0 : 'auto',
              borderTop: c[1] ? 'none' : `3px solid ${C.green400}`, borderBottom: c[1] ? `3px solid ${C.green400}` : 'none',
              borderLeft: c[0] ? 'none' : `3px solid ${C.green400}`, borderRight: c[0] ? `3px solid ${C.green400}` : 'none',
              borderRadius: i === 0 ? '14px 0 0 0' : i === 1 ? '0 14px 0 0' : i === 2 ? '0 0 0 14px' : '0 0 14px 0' }}></div>
          ))}
          {!error && !fetching && <div style={{ position: 'absolute', left: 14, right: 14, height: 3, background: C.green400, boxShadow: `0 0 16px ${C.green400}`, borderRadius: 999, animation: 'scanmove 1.6s ease-in-out infinite' }}></div>}
          {fetching && (
            <div style={{ position: 'absolute', inset: 10, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="receipt" size={64} color={C.green400} />
            </div>
          )}
          {error && (
            <div style={{ position: 'absolute', inset: 10, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="camera" size={64} color="rgba(255,255,255,.2)" />
            </div>
          )}
        </div>

        <div style={{ font: '600 15px ' + C.font, color: '#fff', marginTop: 30, textAlign: 'center' }}>
          {fetching ? 'Consultando a nota na SEFAZ…'
            : error || (invalid ? 'Esse QR Code não parece ser de uma nota fiscal' : 'Aponte para o QR Code da nota fiscal')}
        </div>
        <div style={{ font: '500 13px/1.5 ' + C.font, color: 'rgba(255,255,255,.55)', marginTop: 8, textAlign: 'center', maxWidth: 270 }}>
          {fetching ? 'Buscando itens, quantidades e preços direto do portal oficial.'
            : 'O QR Code fica no rodapé do cupom fiscal (NFC-e), emitido em qualquer mercado.'}
        </div>

        {!fetching && (
          <button onClick={startDemo} style={{ marginTop: 26, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 999, border: '1.5px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.08)', color: '#fff', font: '700 13.5px ' + C.font, cursor: 'pointer' }}>
            <Icon name="sparkles" size={16} color="#fff" /> Simular leitura de nota
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── CONFIRMAÇÃO: itens vindos da SEFAZ ──────────────────── */
function ConfirmItems({ note, fetched, products, onBack, onConfirm }) {
  const date = (fetched.date && fromIso(fetched.date)) || nfceDate(note) || today();

  // prepara linhas: casa com a despensa, limpa nome, chuta emoji
  const [rows, setRows] = useState(() => fetched.items.map((it, i) => {
    const isDemo = !!it.emoji; // itens da demo já vêm prontos
    const matched = matchProduct(products, it.name);
    const meta = isDemo ? it : guessMeta(it.name);
    return {
      key: i,
      raw: it.name,
      name: matched ? matched.name : (isDemo ? it.name : titleCase(it.name)),
      emoji: matched ? matched.emoji : meta.emoji,
      cat: matched ? matched.cat : meta.cat,
      interval: meta.interval || 30,
      pack: matched ? matched.pack : (it.pack || extractPack(it.name) || '1 un'),
      qty: Math.max(1, Math.round(it.qty || 1)),
      qtyRaw: it.qty || 1,
      unit: (it.unit || 'UN').toLowerCase(),
      price: it.unitPrice ?? it.price ?? null,
      productId: matched?.id || null,
      checked: true,
    };
  }));

  const toggle = key => setRows(rs => rs.map(r => r.key === key ? { ...r, checked: !r.checked } : r));
  const setQty = (key, d) => setRows(rs => rs.map(r => r.key === key ? { ...r, qty: Math.max(1, r.qty + d) } : r));

  const selected = rows.filter(r => r.checked);
  const linked = selected.filter(r => r.productId).length;
  const novos = selected.length - linked;

  const confirm = () => {
    const ids = [], prices = {}, newItems = [];
    for (const r of selected) {
      if (r.productId) { ids.push(r.productId); if (r.price != null) prices[r.productId] = r.price; }
      else newItems.push({ emoji: r.emoji, name: r.name, pack: r.pack, cat: r.cat, interval: r.interval, price: r.price });
    }
    onConfirm({ ids, prices, newItems, date, note: { ...note, store: fetched.store || note?.store, total: fetched.total ?? note?.total, itemCount: selected.length } });
  };

  const money = v => `R$ ${v.toFixed(2).replace('.', ',')}`;

  return (
    <>
      <TopBar title="Nota lida ✓" onBack={onBack}
        sub={`${fetched.store || 'NFC-e'}${fetched.total ? ` · ${money(fetched.total)}` : ''}`} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', background: C.green50, borderRadius: 14, marginBottom: 16, border: `1px solid ${C.green200}` }}>
          <Icon name="checkCircle" size={22} color={C.green600} />
          <div style={{ font: '600 13.5px/1.4 ' + C.font, color: C.green700 }}>
            {rows.length} {rows.length === 1 ? 'produto reconhecido' : 'produtos reconhecidos'} na nota.
            {linked > 0 && ` ${linked} ${linked === 1 ? 'casa' : 'casam'} com sua despensa.`}
          </div>
        </div>

        <SectionLabel>Confirme itens e quantidades</SectionLabel>
        {rows.map(r => (
          <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, marginBottom: 8,
            border: `1.5px solid ${r.checked ? C.green200 : C.n200}`, background: r.checked ? C.n0 : C.n50, opacity: r.checked ? 1 : .55,
            boxShadow: r.checked ? C.shadowCard : 'none', transition: `all .2s ${C.ease}` }}>
            <button onClick={() => toggle(r.key)} style={{ width: 24, height: 24, borderRadius: 8, flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: r.checked ? C.green500 : 'transparent', border: `1.5px solid ${r.checked ? C.green500 : C.n300}` }}>
              {r.checked && <Icon name="check" size={14} color="#fff" strokeWidth={3} />}
            </button>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: C.green50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{r.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: '600 13.5px ' + C.font, color: C.n900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1, minWidth: 0 }}>
                {r.price != null && <span style={{ font: '500 11.5px ' + C.font, color: C.n400, flexShrink: 0 }}>{money(r.price)}{r.qtyRaw !== 1 ? ` × ${String(r.qtyRaw).replace('.', ',')} ${r.unit}` : ''}</span>}
                <span style={{ font: '700 10px ' + C.font, color: r.productId ? C.green700 : C.blue600, background: r.productId ? C.green50 : C.blue50, padding: '2px 7px', borderRadius: 999, flexShrink: 0 }}>
                  {r.productId ? 'já na despensa' : 'novo'}
                </span>
              </div>
            </div>
            {r.checked && (
              <div style={{ display: 'flex', alignItems: 'center', background: C.n100, borderRadius: 10, flexShrink: 0 }}>
                <button onClick={() => setQty(r.key, -1)} style={{ width: 26, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="minus" size={13} color={C.n500} strokeWidth={2.4} />
                </button>
                <span style={{ font: '700 12.5px ' + C.font, color: C.n800, minWidth: 22, textAlign: 'center' }}>{r.qty}</span>
                <button onClick={() => setQty(r.key, 1)} style={{ width: 26, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="plus" size={13} color={C.n500} strokeWidth={2.4} />
                </button>
              </div>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '12px 13px', background: C.blue50, borderRadius: 13, marginTop: 8 }}>
          <Icon name="sparkles" size={16} color={C.blue600} />
          <span style={{ font: '500 12px/1.45 ' + C.font, color: C.blue600 }}>
            Tudo será datado em {date.toLocaleDateString('pt-BR')}. {novos > 0 ? `${novos} ${novos === 1 ? 'item novo entra' : 'itens novos entram'} na despensa e ` : 'Os '}preços ficam salvos para estimar suas próximas listas.
          </span>
        </div>
      </div>
      <div style={{ flexShrink: 0, padding: '12px 20px calc(20px + env(safe-area-inset-bottom))', borderTop: `1px solid ${C.n100}` }}>
        <Btn full size="lg" icon="check" disabled={selected.length === 0} onClick={confirm}>
          Registrar compra ({selected.length})
        </Btn>
      </div>
    </>
  );
}

/* ─── FALLBACK: SEFAZ indisponível → confirmação manual ───── */
function ConfirmManual({ note, reason, products, onBack, onConfirm }) {
  const date = nfceDate(note) || today();
  const [sel, setSel] = useState(() =>
    new Set(products.filter(p => { const st = estimate(p).status; return st === 'low' || st === 'out' || p.onList; }).map(p => p.id)));
  const toggleSel = id => setSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <>
      <TopBar title="Nota lida ✓" sub={`NFC-e · ${note?.uf || 'BR'}${note?.total ? ` · R$ ${note.total.toFixed(2).replace('.', ',')}` : ''}`} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 24px' }}>
        <div style={{ padding: '12px 14px', background: C.n0, border: `1px solid ${C.n100}`, borderRadius: 14, boxShadow: C.shadowCard, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Icon name="receipt" size={16} color={C.green600} />
            <span style={{ font: '700 12px ' + C.font, color: C.n600 }}>Chave de acesso</span>
            {note?.uf && <span style={{ font: '700 10.5px ' + C.font, color: C.green700, background: C.green100, padding: '2px 8px', borderRadius: 999 }}>{note.uf}</span>}
          </div>
          <div style={{ font: '500 11.5px/1.6 ' + C.font, color: C.n500, fontFeatureSettings: '"tnum"', wordBreak: 'break-all' }}>{note?.keyFmt}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '12px 13px', background: C.amber50, borderRadius: 13, marginBottom: 16, border: `1px solid ${C.amber200}` }}>
          <Icon name="info" size={16} color={C.amber700} />
          <span style={{ font: '500 12px/1.45 ' + C.font, color: C.amber700 }}>{reason} Marque abaixo o que estava na compra — a data da nota vale para todos.</span>
        </div>

        <SectionLabel>O que estava na compra? · {sel.size}</SectionLabel>
        {products.map(p => {
          const on = sel.has(p.id);
          return (
            <button key={p.id} onClick={() => toggleSel(p.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 14, cursor: 'pointer', textAlign: 'left', marginBottom: 7,
              border: `1.5px solid ${on ? C.green500 : C.n200}`, background: on ? C.green50 : C.n0, transition: `all .2s ${C.ease}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: on ? C.green100 : C.n100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{p.emoji}</div>
              <span style={{ flex: 1, font: '600 14px ' + C.font, color: on ? C.green700 : C.n800 }}>{p.name} <span style={{ font: '500 11px ' + C.font, color: C.n400 }}>{p.pack}</span></span>
              <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: on ? C.green500 : 'transparent', border: `1.5px solid ${on ? C.green500 : C.n300}` }}>
                {on && <Icon name="check" size={14} color="#fff" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ flexShrink: 0, padding: '12px 20px calc(20px + env(safe-area-inset-bottom))', borderTop: `1px solid ${C.n100}` }}>
        <Btn full size="lg" icon="check" disabled={sel.size === 0}
          onClick={() => onConfirm({ ids: [...sel], prices: {}, newItems: [], date, note: { ...note, itemCount: sel.size } })}>
          Registrar compra ({sel.size})
        </Btn>
      </div>
    </>
  );
}
