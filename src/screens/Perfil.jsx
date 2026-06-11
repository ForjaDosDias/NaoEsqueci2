import React from 'react';
import { C } from '../tokens.js';
import { Icon } from '../icons.jsx';
import { SectionLabel, TopBar } from '../components.jsx';
import { fmtShort, fromIso } from '../model.js';

/* ─── PERFIL · Nota Fiscal · Preferências ─────────────────── */
export default function PerfilScreen({ user, settings, receipts, dispatch, onLogout }) {
  const row = { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: C.n0, borderRadius: 14, boxShadow: C.shadowCard, border: `1px solid ${C.n100}`, marginBottom: 8 };

  return (
    <>
      <TopBar title="Perfil" sub="Conta e preferências" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 110px' }}>
        {/* usuário */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 16px', background: C.grad, borderRadius: 18, boxShadow: C.shadowFab, marginBottom: 20 }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.display, fontSize: 24, fontWeight: 700, color: '#fff' }}>
            {(user?.name || '?')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: '700 17px ' + C.font, color: '#fff' }}>{user?.name}</div>
            <div style={{ font: '500 12.5px ' + C.font, color: 'rgba(255,255,255,.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
        </div>

        {/* Nota Fiscal — diferencial estratégico */}
        <SectionLabel color={C.green700}>Nota fiscal</SectionLabel>
        <div style={{ ...row, alignItems: 'flex-start' }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: C.green50, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="receipt" size={21} color={C.green600} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: '700 14px ' + C.font, color: C.n900 }}>Nota Fiscal Paulista</div>
            <div style={{ font: '500 12px/1.45 ' + C.font, color: C.n500, marginTop: 2 }}>
              {user?.nfpConnected
                ? 'Conectada — suas compras itemizadas entram sozinhas no histórico.'
                : 'Conecte seu CPF e todo o histórico de compras entra sozinho, sem escanear.'}
            </div>
          </div>
          <button onClick={() => dispatch({ type: 'connect-nfp', on: !user?.nfpConnected })} style={{
            padding: '9px 14px', borderRadius: 11, border: 'none', cursor: 'pointer', flexShrink: 0,
            font: '700 12.5px ' + C.font, color: user?.nfpConnected ? C.green700 : '#fff',
            background: user?.nfpConnected ? C.green100 : C.grad }}>
            {user?.nfpConnected ? '✓ Conectada' : 'Conectar'}
          </button>
        </div>

        {receipts.length > 0 && (
          <>
            <div style={{ height: 10 }}></div>
            <SectionLabel>Notas lidas · {receipts.length}</SectionLabel>
            {receipts.slice(0, 5).map((r, i) => (
              <div key={i} style={row}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: C.n100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="qr" size={18} color={C.n500} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: '600 13.5px ' + C.font, color: C.n900 }}>{r.store || `NFC-e ${r.uf || ''}`.trim()}</div>
                  <div style={{ font: '500 11.5px ' + C.font, color: C.n400, marginTop: 1 }}>
                    {fmtShort(fromIso(r.date))} · {r.itemCount} {r.itemCount === 1 ? 'item' : 'itens'}{r.total ? ` · R$ ${Number(r.total).toFixed(2).replace('.', ',')}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* preferências de alerta */}
        <div style={{ height: 12 }}></div>
        <SectionLabel>Alertas de “acabando”</SectionLabel>
        <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
          {[['cards', 'Cartões'], ['compact', 'Compacto'], ['banner', 'Banner']].map(([k, l]) => (
            <button key={k} onClick={() => dispatch({ type: 'settings', patch: { alertStyle: k } })} style={{
              flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer', font: '700 13px ' + C.font,
              border: `1.5px solid ${settings.alertStyle === k ? 'transparent' : C.n200}`,
              background: settings.alertStyle === k ? C.grad : C.n0,
              color: settings.alertStyle === k ? '#fff' : C.n600 }}>{l}</button>
          ))}
        </div>
        <div style={row}>
          <div style={{ flex: 1 }}>
            <div style={{ font: '600 14px ' + C.font, color: C.n900 }}>Barra de nível nos itens</div>
            <div style={{ font: '500 12px ' + C.font, color: C.n400, marginTop: 1 }}>Mostra o quanto estimamos que resta</div>
          </div>
          <button onClick={() => dispatch({ type: 'settings', patch: { showLevel: !settings.showLevel } })} style={{
            width: 46, height: 27, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
            background: settings.showLevel ? C.green500 : C.n300, transition: `background .2s ${C.ease}` }}>
            <span style={{ position: 'absolute', top: 3, left: settings.showLevel ? 22 : 3, width: 21, height: 21, borderRadius: '50%', background: '#fff', transition: `left .2s ${C.ease}`, boxShadow: C.shadowCard }}></span>
          </button>
        </div>

        <div style={{ height: 12 }}></div>
        <SectionLabel>Conta</SectionLabel>
        <div onClick={onLogout} style={{ ...row, cursor: 'pointer' }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: C.red50, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="logout" size={18} color={C.red600} />
          </div>
          <div style={{ flex: 1, font: '600 14px ' + C.font, color: C.red600 }}>Sair (apaga os dados deste aparelho)</div>
          <Icon name="chevronR" size={17} color={C.n300} />
        </div>
      </div>
    </>
  );
}
