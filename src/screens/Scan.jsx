import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { C } from '../tokens.js';
import { Icon } from '../icons.jsx';
import { Btn, SectionLabel, TopBar } from '../components.jsx';
import { DEMO_NOTE, nfceDate, parseNfceQr } from '../nfce.js';
import { CATALOG, estimate, today } from '../model.js';

/* ===========================================================
   Leitura do QR Code da NFC-e com a câmera do aparelho.
   1. fase "aim": vídeo + decodificação (BarcodeDetector quando
      disponível, senão jsQR sobre canvas)
   2. fase "confirm": a chave de acesso foi lida; sem backend o
      portal da SEFAZ não pode ser consultado daqui, então o
      usuário confirma quais itens estavam na compra
   3. modo demo: simula uma nota completa com itens
   =========================================================== */

function useQrScanner(onCode, active) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const stopRef = useRef(() => {});

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

    stopRef.current = () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach(t => t.stop());
    };
    return stopRef.current;
  }, [active]);

  return { videoRef, error };
}

export default function ScanScreen({ products, onBack, onConfirm }) {
  const [phase, setPhase] = useState('aim');      // aim | confirm
  const [note, setNote] = useState(null);          // dados parseados do QR
  const [demo, setDemo] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const handleCode = (text) => {
    const parsed = parseNfceQr(text);
    if (!parsed) { setInvalid(true); setTimeout(() => setInvalid(false), 2500); return; }
    setNote(parsed);
    setDemo(false);
    setPhase('confirm');
  };

  const { videoRef, error } = useQrScanner(handleCode, phase === 'aim');

  const startDemo = () => {
    setNote({ ...parseNfceQr(DEMO_NOTE.key), total: DEMO_NOTE.total, store: DEMO_NOTE.store });
    setDemo(true);
    setPhase('confirm');
  };

  if (phase === 'confirm') {
    return <ConfirmNote note={note} demo={demo} products={products} onBack={() => setPhase('aim')} onConfirm={onConfirm} />;
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.n900 }}>
      <TopBar title="Escanear nota" sub="NFC-e" onBack={onBack} light />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 30px', position: 'relative' }}>
        <div style={{ width: 260, height: 260, position: 'relative' }}>
          {/* vídeo da câmera */}
          <video ref={videoRef} muted playsInline style={{ position: 'absolute', inset: 10, width: 'calc(100% - 20px)', height: 'calc(100% - 20px)', objectFit: 'cover', borderRadius: 16, background: 'rgba(255,255,255,.06)' }} />
          {/* cantos da mira */}
          {[[0, 0], [1, 0], [0, 1], [1, 1]].map((c, i) => (
            <div key={i} style={{ position: 'absolute', width: 42, height: 42,
              left: c[0] ? 'auto' : 0, right: c[0] ? 0 : 'auto', top: c[1] ? 'auto' : 0, bottom: c[1] ? 0 : 'auto',
              borderTop: c[1] ? 'none' : `3px solid ${C.green400}`, borderBottom: c[1] ? `3px solid ${C.green400}` : 'none',
              borderLeft: c[0] ? 'none' : `3px solid ${C.green400}`, borderRight: c[0] ? `3px solid ${C.green400}` : 'none',
              borderRadius: i === 0 ? '14px 0 0 0' : i === 1 ? '0 14px 0 0' : i === 2 ? '0 0 0 14px' : '0 0 14px 0' }}></div>
          ))}
          {/* linha de varredura */}
          {!error && <div style={{ position: 'absolute', left: 14, right: 14, height: 3, background: C.green400, boxShadow: `0 0 16px ${C.green400}`, borderRadius: 999, animation: 'scanmove 1.6s ease-in-out infinite' }}></div>}
          {error && (
            <div style={{ position: 'absolute', inset: 10, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="camera" size={64} color="rgba(255,255,255,.2)" />
            </div>
          )}
        </div>

        <div style={{ font: '600 15px ' + C.font, color: '#fff', marginTop: 30, textAlign: 'center' }}>
          {error || (invalid ? 'Esse QR Code não parece ser de uma nota fiscal' : 'Aponte para o QR Code da nota fiscal')}
        </div>
        <div style={{ font: '500 13px/1.5 ' + C.font, color: 'rgba(255,255,255,.55)', marginTop: 8, textAlign: 'center', maxWidth: 270 }}>
          O QR Code fica no rodapé do cupom fiscal (NFC-e), emitido em qualquer mercado.
        </div>

        <button onClick={startDemo} style={{ marginTop: 26, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 999, border: '1.5px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.08)', color: '#fff', font: '700 13.5px ' + C.font, cursor: 'pointer' }}>
          <Icon name="sparkles" size={16} color="#fff" /> Simular leitura de nota
        </button>
      </div>
    </div>
  );
}

/* ─── CONFIRMAÇÃO DOS ITENS DA NOTA ───────────────────────── */
function ConfirmNote({ note, demo, products, onBack, onConfirm }) {
  const date = nfceDate(note) || today();

  // demo: itens vêm "reconhecidos" da nota; real: usuário marca o que comprou
  const demoItems = demo ? DEMO_NOTE.items : null;
  const [sel, setSel] = useState(() => {
    if (demo) return null;
    // pré-seleciona o que a previsão diz que estava na hora de comprar
    return new Set(products.filter(p => { const st = estimate(p).status; return st === 'low' || st === 'out' || p.onList; }).map(p => p.id));
  });
  const [extra, setExtra] = useState(() => new Set()); // nomes do catálogo a criar

  const toggleSel = id => setSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleExtra = name => setExtra(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });

  const existingNames = new Set(products.map(p => p.name.toLowerCase()));
  const catalogExtras = CATALOG.filter(c => !existingNames.has(c.name.toLowerCase()));

  const confirm = () => {
    if (demo) {
      const matchIds = [], newItems = [];
      for (const it of demoItems) {
        const found = products.find(p => p.name.toLowerCase() === it.name.toLowerCase());
        if (found) matchIds.push(found.id); else newItems.push(it);
      }
      onConfirm({ ids: matchIds, newItems, date, note: { ...note, itemCount: demoItems.length } });
    } else {
      const newItems = catalogExtras.filter(c => extra.has(c.name));
      onConfirm({ ids: [...sel], newItems, date, note: { ...note, itemCount: sel.size + newItems.length } });
    }
  };

  const count = demo ? demoItems.length : sel.size + extra.size;

  return (
    <>
      <TopBar title="Nota lida ✓" sub={note?.store || `NFC-e · ${note?.uf || 'BR'}${note?.total ? ` · R$ ${note.total.toFixed(2).replace('.', ',')}` : ''}`} onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 24px' }}>
        {/* chave de acesso */}
        <div style={{ padding: '12px 14px', background: C.n0, border: `1px solid ${C.n100}`, borderRadius: 14, boxShadow: C.shadowCard, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Icon name="receipt" size={16} color={C.green600} />
            <span style={{ font: '700 12px ' + C.font, color: C.n600 }}>Chave de acesso</span>
            {note?.uf && <span style={{ font: '700 10.5px ' + C.font, color: C.green700, background: C.green100, padding: '2px 8px', borderRadius: 999 }}>{note.uf}</span>}
          </div>
          <div style={{ font: '500 11.5px/1.6 ' + C.font, color: C.n500, fontFeatureSettings: '"tnum"', wordBreak: 'break-all' }}>{note?.keyFmt}</div>
        </div>

        {demo ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', background: C.green50, borderRadius: 14, marginBottom: 16, border: `1px solid ${C.green200}` }}>
              <Icon name="checkCircle" size={22} color={C.green600} />
              <div style={{ font: '600 13.5px/1.4 ' + C.font, color: C.green700 }}>{demoItems.length} produtos reconhecidos e datados automaticamente.</div>
            </div>
            <SectionLabel>Itens da nota</SectionLabel>
            {demoItems.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', background: C.n0, borderRadius: 14, boxShadow: C.shadowCard, marginBottom: 8, border: `1px solid ${C.n100}` }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: C.green50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{f.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '600 14px ' + C.font, color: C.n900 }}>{f.name} <span style={{ font: '500 11px ' + C.font, color: C.n400 }}>{f.pack}</span></div>
                  <div style={{ font: '500 12px ' + C.font, color: C.n400, marginTop: 1 }}>R$ {f.price.toFixed(2).replace('.', ',')}</div>
                </div>
                <Icon name="check" size={18} color={C.green600} strokeWidth={2.4} />
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '12px 13px', background: C.blue50, borderRadius: 13, marginBottom: 16 }}>
              <Icon name="info" size={16} color={C.blue600} />
              <span style={{ font: '500 12px/1.45 ' + C.font, color: C.blue600 }}>Chave lida com sucesso. Confirme o que estava nessa compra — a data da nota vale para todos os itens marcados.</span>
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

            {catalogExtras.length > 0 && (
              <>
                <div style={{ height: 10 }}></div>
                <SectionLabel>Comprou algo novo? Toque para incluir</SectionLabel>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {catalogExtras.slice(0, 12).map(c => {
                    const on = extra.has(c.name);
                    return (
                      <button key={c.name} onClick={() => toggleExtra(c.name)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
                        border: `1.5px solid ${on ? 'transparent' : C.n200}`, background: on ? C.grad : C.n0,
                        font: '600 13px ' + C.font, color: on ? '#fff' : C.n600 }}>
                        {c.emoji} {c.name}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '12px 13px', background: C.blue50, borderRadius: 13, marginTop: 14 }}>
          <Icon name="info" size={16} color={C.blue600} />
          <span style={{ font: '500 12px/1.45 ' + C.font, color: C.blue600 }}>Você também pode conectar a Nota Fiscal Paulista no Perfil — aí todo histórico entra sozinho, sem escanear.</span>
        </div>
      </div>
      <div style={{ flexShrink: 0, padding: '12px 20px calc(20px + env(safe-area-inset-bottom))', borderTop: `1px solid ${C.n100}` }}>
        <Btn full size="lg" icon="check" disabled={count === 0} onClick={confirm}>
          {demo ? 'Adicionar à despensa' : `Registrar compra${count ? ` (${count})` : ''}`}
        </Btn>
      </div>
    </>
  );
}
