import React, { useState } from 'react';
import { C, STATUS } from './tokens.js';
import { Icon } from './icons.jsx';
import { CONFIDENCE_LABELS, confidenceLevel, estimate, etaLabel, isSnoozed, levelPct } from './model.js';

/* ── BOTTOM NAV ───────────────────────────────────────────── */
export const BottomNav = ({ active, onNav, listCount = 0 }) => {
  const tabs = [
    { id: 'home',    icon: 'home', label: 'Despensa' },
    { id: 'armario', icon: 'box',  label: 'Armário' },
    { id: 'lista',   icon: 'cart', label: 'Lista' },
    { id: 'perfil',  icon: 'user', label: 'Perfil' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'rgba(255,255,255,.86)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      borderTop: `1px solid ${C.n100}`, padding: '10px 10px calc(14px + env(safe-area-inset-bottom))',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 200,
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <div key={t.id} onClick={() => onNav(t.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            cursor: 'pointer', padding: '4px 14px', borderRadius: 14, position: 'relative',
            background: on ? C.green50 : 'transparent', transition: `background .2s ${C.ease}`,
          }}>
            <div style={{ position: 'relative' }}>
              <Icon name={t.icon} size={21} color={on ? C.green600 : C.n400} />
              {t.id === 'lista' && listCount > 0 && (
                <span style={{ position: 'absolute', top: -6, right: -9, minWidth: 16, height: 16, padding: '0 4px',
                  background: C.green500, color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff' }}>{listCount}</span>
              )}
            </div>
            <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '.01em', color: on ? C.green700 : C.n400 }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ── TOP BAR (back + title) ───────────────────────────────── */
export const TopBar = ({ title, sub, onBack, right, light }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 12px', flexShrink: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: onBack ? 'pointer' : 'default', minWidth: 0 }} onClick={onBack}>
      {onBack && (
        <div style={{ width: 38, height: 38, borderRadius: 12, background: light ? 'rgba(255,255,255,.16)' : C.n100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="chevron" size={20} color={light ? '#fff' : C.n600} />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        {sub && <div style={{ fontSize: 11.5, fontWeight: 600, color: light ? 'rgba(255,255,255,.7)' : C.n400, marginBottom: 1 }}>{sub}</div>}
        <div style={{ fontFamily: C.display, fontSize: 21, fontWeight: 700, color: light ? '#fff' : C.n900, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
      </div>
    </div>
    {right}
  </div>
);

/* ── BUTTONS ──────────────────────────────────────────────── */
export const Btn = ({ children, onClick, variant = 'primary', icon, full, size = 'md', disabled, style = {} }) => {
  const sizes = { sm: { p: '8px 14px', f: 13, h: 38 }, md: { p: '13px 20px', f: 15, h: 50 }, lg: { p: '16px 22px', f: 16, h: 56 } };
  const s = sizes[size];
  const variants = {
    primary:   { background: C.grad, color: '#fff', border: 'none', boxShadow: '0 6px 18px rgba(34,197,94,.28)' },
    secondary: { background: C.n0, color: C.n800, border: `1.5px solid ${C.n200}`, boxShadow: C.shadowCard },
    ghost:     { background: 'transparent', color: C.green700, border: 'none', boxShadow: 'none' },
    soft:      { background: C.green50, color: C.green700, border: 'none', boxShadow: 'none' },
    danger:    { background: C.red50, color: C.red600, border: 'none', boxShadow: 'none' },
    dark:      { background: C.n900, color: '#fff', border: 'none', boxShadow: C.shadowCard },
  };
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: s.p, minHeight: s.h, fontFamily: C.font, fontSize: s.f, fontWeight: 700,
        borderRadius: 14, cursor: disabled ? 'default' : 'pointer', width: full ? '100%' : 'auto',
        opacity: disabled ? .5 : 1,
        transition: `transform .2s ${C.ease}, box-shadow .2s ${C.ease}`,
        transform: hover && !disabled ? 'translateY(-2px)' : 'translateY(0)',
        ...variants[variant], ...style,
      }}>
      {icon && <Icon name={icon} size={s.f + 3} color={variants[variant].color} />}
      {children}
    </button>
  );
};

/* ── INPUT FIELD ──────────────────────────────────────────── */
export const Field = ({ label, icon, value, onChange, placeholder, type = 'text', right, autoFocus }) => {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ font: '600 12px/1.4 ' + C.font, color: C.n600, marginBottom: 7, letterSpacing: '.01em' }}>{label}</div>}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, height: 52, padding: '0 14px',
        background: C.n0, borderRadius: 14,
        border: `1.5px solid ${focus ? C.green500 : C.n200}`,
        boxShadow: focus ? '0 0 0 4px rgba(34,197,94,.1)' : 'none',
        transition: `all .2s ${C.ease}`,
      }}>
        {icon && <Icon name={icon} size={19} color={focus ? C.green600 : C.n400} />}
        <input value={value} onChange={e => onChange && onChange(e.target.value)} placeholder={placeholder} type={type} autoFocus={autoFocus}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', font: '500 15px ' + C.font, color: C.n900, minWidth: 0 }} />
        {right}
      </div>
    </div>
  );
};

/* ── STATUS BADGE ─────────────────────────────────────────── */
export const StatusBadge = ({ status, size = 'md' }) => {
  const s = STATUS[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: size === 'sm' ? '3px 9px' : '4px 11px', borderRadius: 999,
      background: s.bgStrong, color: s.color, font: `700 ${size === 'sm' ? 10.5 : 11.5}px ${C.font}`, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }}></span>
      {s.label}
    </span>
  );
};

/* ── LEVEL BAR (nível estimado restante) ──────────────────── */
export const LevelBar = ({ pct, status }) => (
  <div style={{ height: 6, background: C.n100, borderRadius: 999, overflow: 'hidden' }}>
    <div style={{ height: '100%', width: `${Math.max(4, pct)}%`, background: STATUS[status].grad, borderRadius: 999,
      transition: `width .5s ${C.ease}` }}></div>
  </div>
);

/* ── CONFIDENCE METER ─────────────────────────────────────── */
export const Confidence = ({ product }) => {
  const level = confidenceLevel(product);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', gap: 2.5, alignItems: 'flex-end' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ width: 3.5, height: 6 + i * 3, borderRadius: 2,
            background: i <= level ? C.green500 : C.n200 }}></div>
        ))}
      </div>
      <span style={{ font: '600 11px ' + C.font, color: level >= 2 ? C.green700 : C.n500 }}>{CONFIDENCE_LABELS[level]}</span>
    </div>
  );
};

/* ── BOTTOM SHEET ─────────────────────────────────────────── */
export const Sheet = ({ open, onClose, children, height }) => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 300, pointerEvents: open ? 'auto' : 'none' }}>
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,.42)',
      opacity: open ? 1 : 0, transition: `opacity .3s ${C.ease}` }}></div>
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      background: C.n0, borderRadius: '28px 28px 0 0',
      padding: '10px 20px calc(26px + env(safe-area-inset-bottom))', boxShadow: C.shadowModal,
      transform: open ? 'translateY(0)' : 'translateY(110%)', transition: `transform .4s ${C.ease}`,
      maxHeight: height || '82%', overflowY: 'auto',
    }}>
      <div style={{ width: 40, height: 5, borderRadius: 999, background: C.n200, margin: '0 auto 16px' }}></div>
      {open ? children : null}
    </div>
  </div>
);

/* ── TOAST ────────────────────────────────────────────────── */
export const Toast = ({ msg, icon = 'check', show }) => (
  <div style={{
    position: 'absolute', left: 18, right: 18, bottom: 96, zIndex: 400,
    display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px',
    background: C.n900, color: '#fff', borderRadius: 16, boxShadow: C.shadowModal,
    font: '600 14px ' + C.font,
    opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(16px)',
    transition: `all .35s ${C.ease}`, pointerEvents: 'none',
  }}>
    <div style={{ width: 28, height: 28, borderRadius: 999, background: C.green500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon name={icon} size={16} color="#fff" strokeWidth={2.4} />
    </div>
    {msg}
  </div>
);

/* ── SECTION LABEL ────────────────────────────────────────── */
export const SectionLabel = ({ children, count, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0 9px' }}>
    <span style={{ font: '700 11px ' + C.font, letterSpacing: '.09em', textTransform: 'uppercase', color: color || C.n400 }}>{children}</span>
    {count != null && <span style={{ font: '700 11px ' + C.font, color: C.n300 }}>· {count}</span>}
  </div>
);

/* ── PANTRY ROW (item da despensa) ────────────────────────── */
export const PantryRow = ({ p, onOpen, onQuickAdd, showLevel = true }) => {
  const { status } = estimate(p);
  const s = STATUS[isSnoozed(p) && status !== 'new' ? 'ok' : status];
  const pct = levelPct(p);
  return (
    <div onClick={() => onOpen && onOpen(p)} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px',
      background: C.n0, borderRadius: 16, boxShadow: C.shadowCard, marginBottom: 8, cursor: 'pointer',
      border: `1px solid ${C.n100}`, transition: `transform .2s ${C.ease}`, position: 'relative', overflow: 'hidden',
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateX(3px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: s.grad }}></div>
      <div style={{ width: 44, height: 44, borderRadius: 13, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, marginLeft: 4 }}>{p.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ font: '600 15px ' + C.font, color: C.n900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
          <span style={{ font: '500 11px ' + C.font, color: C.n400, flexShrink: 0, whiteSpace: 'nowrap' }}>{p.pack}</span>
        </div>
        <div style={{ font: '500 12px ' + C.font, color: s.color, marginTop: 3, marginBottom: showLevel && status !== 'new' ? 6 : 0 }}>{etaLabel(p)}</div>
        {showLevel && status !== 'new' && <LevelBar pct={pct} status={status} />}
      </div>
      {onQuickAdd
        ? <div onClick={e => { e.stopPropagation(); onQuickAdd(p); }} style={{ width: 36, height: 36, borderRadius: 11, background: C.green50, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
            <Icon name={p.onList ? 'check' : 'plus'} size={18} color={C.green600} strokeWidth={2} />
          </div>
        : <Icon name="chevronR" size={18} color={C.n300} />}
    </div>
  );
};

/* ── ATTENTION CARD (alerta rico, padrão) ─────────────────── */
export const AttentionCard = ({ p, onAddToList, onStillHave, onOpen }) => {
  const { status } = estimate(p);
  const s = STATUS[status];
  return (
    <div style={{ background: C.n0, borderRadius: 18, boxShadow: C.shadowCard, border: `1px solid ${s.ring}`, overflow: 'hidden', marginBottom: 10 }}>
      <div style={{ padding: '14px 14px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 52, height: 52, borderRadius: 15, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{p.emoji}</div>
          <span style={{ position: 'absolute', bottom: -3, right: -3, width: 18, height: 18, borderRadius: 999, background: s.dot, border: '2.5px solid #fff' }}></span>
        </div>
        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onOpen && onOpen(p)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ font: '700 16px ' + C.font, color: C.n900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
            <StatusBadge status={status} size="sm" />
          </div>
          <div style={{ font: '600 13px ' + C.font, color: s.color, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name={status === 'out' ? 'clock' : 'trend'} size={14} color={s.color} />
            {etaLabel(p)}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '0 14px 14px' }}>
        <button onClick={() => onAddToList(p)} disabled={p.onList} style={{
          flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          padding: '11px', borderRadius: 13, border: 'none', cursor: p.onList ? 'default' : 'pointer',
          font: '700 13.5px ' + C.font, color: '#fff', background: p.onList ? C.n300 : s.grad,
          boxShadow: p.onList ? 'none' : `0 5px 14px ${s.ring}`, transition: `all .2s ${C.ease}`,
        }}>
          <Icon name={p.onList ? 'check' : 'cart'} size={16} color="#fff" strokeWidth={2.2} />
          {p.onList ? 'Na lista' : 'Adicionar à lista'}
        </button>
        <button onClick={() => onStillHave(p)} style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '11px 14px', borderRadius: 13, border: `1.5px solid ${C.n200}`, cursor: 'pointer',
          font: '700 13.5px ' + C.font, color: C.n600, background: C.n0,
        }}>
          <Icon name="snooze" size={15} color={C.n500} />
          Ainda tenho
        </button>
      </div>
    </div>
  );
};

/* variante compacta do alerta */
export const AttentionCompact = ({ p, onAddToList, onStillHave, onOpen }) => {
  const { status } = estimate(p);
  const s = STATUS[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', background: C.n0,
      borderRadius: 14, boxShadow: C.shadowCard, borderLeft: `4px solid ${s.dot}`, marginBottom: 8 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0 }}>{p.emoji}</div>
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onOpen && onOpen(p)}>
        <div style={{ font: '600 14.5px ' + C.font, color: C.n900 }}>{p.name}</div>
        <div style={{ font: '500 12px ' + C.font, color: s.color, marginTop: 1 }}>{etaLabel(p)}</div>
      </div>
      <button onClick={() => onStillHave(p)} title="Ainda tenho" style={{ width: 38, height: 38, borderRadius: 11, border: `1.5px solid ${C.n200}`, background: C.n0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        <Icon name="snooze" size={16} color={C.n500} />
      </button>
      <button onClick={() => onAddToList(p)} disabled={p.onList} title="Adicionar à lista" style={{ width: 38, height: 38, borderRadius: 11, border: 'none', background: p.onList ? C.n200 : s.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: p.onList ? 'default' : 'pointer', flexShrink: 0 }}>
        <Icon name={p.onList ? 'check' : 'plus'} size={17} color="#fff" strokeWidth={2.4} />
      </button>
    </div>
  );
};

/* ── FAB ──────────────────────────────────────────────────── */
export const FAB = ({ onClick, icon = 'plus' }) => (
  <div onClick={onClick} style={{ position: 'absolute', bottom: 96, right: 18, width: 56, height: 56, borderRadius: '50%',
    background: C.grad, boxShadow: C.shadowFab, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', zIndex: 100, transition: `transform .25s ${C.ease}` }}
    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
    <Icon name={icon} size={26} color="#fff" strokeWidth={2.2} />
  </div>
);
