/* ===========================================================
   Não Esqueci — Design tokens (Design System v1.0)
   Verde #22C55E · Fraunces + DM Sans · neutros slate
   =========================================================== */

export const C = {
  green50:  '#F0FDF4', green100: '#DCFCE7', green200: '#BBF7D0',
  green400: '#4ADE80', green500: '#22C55E', green600: '#16A34A', green700: '#15803D',

  amber50:  '#FFFBEB', amber100: '#FEF3C7', amber200: '#FDE68A',
  amber400: '#FBBF24', amber500: '#F59E0B', amber600: '#D97706', amber700: '#B45309',

  red50:    '#FEF2F2', red100: '#FEE2E2', red200: '#FECACA',
  red400:   '#F87171', red500: '#EF4444', red600: '#DC2626', red700: '#B91C1C',

  blue50:   '#F0F9FF', blue100: '#E0F2FE', blue500: '#0EA5E9', blue600: '#0284C7',

  n0: '#FFFFFF', n50: '#F8FAFC', n100: '#F1F5F9', n200: '#E2E8F0',
  n300: '#CBD5E1', n400: '#94A3B8', n500: '#64748B',
  n600: '#475569', n700: '#334155', n800: '#1E293B', n900: '#0F172A',

  grad: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
  gradSoft: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
  gradAmber: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)',
  gradRed: 'linear-gradient(135deg, #F87171 0%, #DC2626 100%)',

  shadowCard: '0 2px 8px rgba(15,23,42,.08)',
  shadowCardHover: '0 8px 24px rgba(15,23,42,.12)',
  shadowFab:  '0 8px 24px rgba(34,197,94,.28)',
  shadowModal: '0 24px 64px rgba(15,23,42,.18)',

  font: "'DM Sans', system-ui, -apple-system, sans-serif",
  display: "'Fraunces', Georgia, serif",
  ease: 'cubic-bezier(.2,.8,.2,1)',
};

/* status → visual (acabou de comprar / acabando / acabou) */
export const STATUS = {
  ok:   { key:'ok',   label:'Em dia',    color:C.green600, bg:C.green50,  bgStrong:C.green100, ring:C.green200, grad:C.grad,      dot:C.green500 },
  low:  { key:'low',  label:'Acabando',  color:C.amber700, bg:C.amber50,  bgStrong:C.amber100, ring:C.amber200, grad:C.gradAmber, dot:C.amber500 },
  out:  { key:'out',  label:'Acabou',    color:C.red700,   bg:C.red50,    bgStrong:C.red100,   ring:C.red200,   grad:C.gradRed,   dot:C.red500 },
  new:  { key:'new',  label:'Aprendendo',color:C.blue600,  bg:C.blue50,   bgStrong:C.blue100,  ring:C.blue100,  grad:C.grad,      dot:C.blue500 },
};
