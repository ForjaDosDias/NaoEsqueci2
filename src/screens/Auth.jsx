import React, { useState } from 'react';
import { C } from '../tokens.js';
import { Icon } from '../icons.jsx';
import { Btn, Field } from '../components.jsx';
import { validateCredentials } from '../auth.js';

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | signup
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  const submit = () => {
    setInfo('');
    const error = validateCredentials({ mode, name, email, pw });
    if (error) { setErr(error); return; }
    setErr('');
    const userName = mode === 'signup' ? name.trim() : email.split('@')[0].replace(/^./, c => c.toUpperCase());
    onLogin({ name: userName, email: email.trim(), signup: mode === 'signup' });
  };

  const forgotPassword = () => {
    setInfo('');
    if (!email.trim() || !email.includes('@')) { setErr('Informe seu e-mail acima para recuperar a senha.'); return; }
    setErr('');
    setInfo('Recuperação de senha chega em breve. Por enquanto, entre com seu e-mail ou explore com dados de exemplo.');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 24px 24px', overflowY: 'auto' }} className="fade-in-up">
      {/* Marca */}
      <div style={{ marginTop: 18, marginBottom: 26 }}>
        <div style={{ width: 58, height: 58, borderRadius: 18, background: C.grad, boxShadow: C.shadowFab,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Icon name="checkCircle" size={30} color="#fff" strokeWidth={2} />
        </div>
        <div style={{ fontFamily: C.display, fontSize: 34, fontWeight: 700, color: C.n900, lineHeight: 1.08, letterSpacing: '-.01em' }}>
          Não <em style={{ fontStyle: 'italic', fontWeight: 400, color: C.green600 }}>Esqueci</em>
        </div>
        <div style={{ font: '400 15px/1.5 ' + C.font, color: C.n500, marginTop: 8, maxWidth: 290 }}>
          {mode === 'login'
            ? 'Bem-vindo de volta. Sua despensa está te esperando.'
            : 'O app que prevê quando seus produtos vão acabar — antes de você precisar.'}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: C.n100, borderRadius: 14, padding: 4, marginBottom: 20 }}>
        {[['login', 'Entrar'], ['signup', 'Criar conta']].map(([m, l]) => (
          <button key={m} onClick={() => { setMode(m); setErr(''); }} style={{
            flex: 1, padding: '10px', borderRadius: 11, border: 'none', cursor: 'pointer',
            font: '700 14px ' + C.font,
            background: mode === m ? C.n0 : 'transparent',
            color: mode === m ? C.n900 : C.n500,
            boxShadow: mode === m ? C.shadowCard : 'none', transition: `all .2s ${C.ease}`,
          }}>{l}</button>
        ))}
      </div>

      {mode === 'signup' && <Field label="Nome" icon="user" value={name} onChange={setName} placeholder="Como te chamamos?" />}
      <Field label="E-mail" icon="mail" value={email} onChange={setEmail} placeholder="seu@email.com" type="email" />
      <Field label="Senha" icon="lock" value={pw} onChange={setPw} type={showPw ? 'text' : 'password'} placeholder="••••••••"
        right={<div onClick={() => setShowPw(s => !s)} style={{ cursor: 'pointer' }}><Icon name={showPw ? 'eyeOff' : 'eye'} size={18} color={C.n400} /></div>} />

      {err && <div style={{ font: '600 12.5px ' + C.font, color: C.red600, marginTop: -6, marginBottom: 12 }}>{err}</div>}
      {info && <div style={{ font: '600 12.5px ' + C.font, color: C.green700, marginTop: -6, marginBottom: 12 }}>{info}</div>}

      {mode === 'login' && <div style={{ textAlign: 'right', marginTop: -4, marginBottom: 14 }}>
        <span onClick={forgotPassword} style={{ font: '600 13px ' + C.font, color: C.green700, cursor: 'pointer' }}>Esqueci a senha</span>
      </div>}

      <Btn full size="lg" icon="arrowRight" onClick={submit} style={{ marginTop: mode === 'signup' ? 8 : 0 }}>
        {mode === 'login' ? 'Entrar' : 'Criar minha conta'}
      </Btn>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: C.n200 }}></div>
        <span style={{ font: '500 12px ' + C.font, color: C.n400 }}>ou continue com</span>
        <div style={{ flex: 1, height: 1, background: C.n200 }}></div>
      </div>

      <Btn full variant="secondary" icon="google"
        onClick={() => onLogin({ name: 'Felipe', email: 'felipe@gmail.com', signup: false, demo: true })}>
        Google
      </Btn>
      <div style={{ font: '500 11.5px ' + C.font, color: C.n400, textAlign: 'center', marginTop: 8 }}>
        Login social é demonstrativo neste protótipo — entra com dados de exemplo.
      </div>

      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <span onClick={() => onLogin({ name: 'Felipe', email: 'demo@naoesqueci.app', demo: true })}
          style={{ font: '600 13px ' + C.font, color: C.n500, cursor: 'pointer', textDecoration: 'underline' }}>
          Explorar com dados de exemplo
        </span>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 22, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', background: C.green50, borderRadius: 999 }}>
          <Icon name="qr" size={15} color={C.green600} />
          <span style={{ font: '600 11.5px ' + C.font, color: C.green700 }}>Conecte sua Nota Fiscal depois do cadastro</span>
        </div>
      </div>
    </div>
  );
}
