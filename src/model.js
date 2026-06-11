/* ===========================================================
   Não Esqueci — Motor de previsão de consumo
   O app estima quando cada produto vai acabar a partir das
   datas de compra. A partir da 2ª compra, o ritmo real é
   aprendido com uma média móvel dos intervalos entre compras.
   =========================================================== */

export const DAY = 86400000;
export const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

export const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
export const addDays = (d, n) => new Date(d.getTime() + n * DAY);
export const daysBetween = (a, b) => Math.round((b - a) / DAY);
export const fmtShort = d => `${d.getDate()} ${MESES[d.getMonth()]}`;
export const iso = d => d.toISOString().slice(0, 10);
export const fromIso = s => { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd); };

export const FREQS = [
  ['semanal',   'Toda semana',     7],
  ['quinzenal', 'A cada 15 dias', 15],
  ['mensal',    'Todo mês',       30],
  ['bimestral', 'A cada 2 meses', 60],
];
export const freqDays = key => (FREQS.find(f => f[0] === key) || FREQS[2])[2];

/* Média móvel dos intervalos entre compras (até as 5 últimas).
   Antes da 2ª compra usamos o "chute" inicial do cadastro. */
export function learnedInterval(p) {
  const dates = (p.purchases || []).map(fromIso).sort((a, b) => a - b);
  if (dates.length < 2) return p.initialInterval || 30;
  const gaps = [];
  for (let i = 1; i < dates.length; i++) {
    const g = daysBetween(dates[i - 1], dates[i]);
    if (g > 0) gaps.push(g);
  }
  if (!gaps.length) return p.initialInterval || 30;
  const recent = gaps.slice(-5);
  return Math.max(1, Math.round(recent.reduce((a, b) => a + b, 0) / recent.length));
}

export function lastPurchase(p) {
  const dates = (p.purchases || []).map(fromIso).sort((a, b) => a - b);
  return dates.length ? dates[dates.length - 1] : null;
}

export function isSnoozed(p, now = today()) {
  return p.snoozedUntil ? fromIso(p.snoozedUntil) > now : false;
}

/* Estimativa principal: dias restantes, status e data prevista do fim. */
export function estimate(p, now = today()) {
  const last = lastPurchase(p);
  if (!last) return { daysLeft: null, status: 'new', endDate: null, interval: null, boughtDaysAgo: null };
  const interval = learnedInterval(p);
  const boughtDaysAgo = daysBetween(last, now);
  const daysLeft = interval - boughtDaysAgo;
  let status = 'ok';
  if (daysLeft <= 0) status = 'out';
  else if (daysLeft <= Math.max(2, interval * 0.18)) status = 'low';
  return { daysLeft, status, endDate: addDays(now, daysLeft), interval, boughtDaysAgo };
}

export function etaLabel(p, now = today()) {
  const { daysLeft, status } = estimate(p, now);
  if (daysLeft == null) return 'Aprendendo o padrão…';
  if (status === 'out') {
    const over = Math.abs(daysLeft);
    return over === 0 ? 'Deve ter acabado hoje' : `Acabou há ~${over} ${over === 1 ? 'dia' : 'dias'}`;
  }
  if (daysLeft === 0) return 'Deve acabar hoje';
  if (daysLeft === 1) return 'Deve acabar amanhã';
  return `Deve acabar em ~${daysLeft} dias`;
}

/* % de "nível" estimado restante na despensa (sutil, só visual) */
export function levelPct(p, now = today()) {
  const { interval, boughtDaysAgo } = estimate(p, now);
  if (interval == null) return 100;
  return Math.max(0, Math.min(100, Math.round((1 - boughtDaysAgo / interval) * 100)));
}

/* nível de confiança da previsão pelo nº de compras registradas */
export function confidenceLevel(p) {
  const n = (p.purchases || []).length;
  return n <= 1 ? 0 : n === 2 ? 1 : n <= 4 ? 2 : 3;
}
export const CONFIDENCE_LABELS = ['Sem dados', 'Aprendendo', 'Previsão boa', 'Previsão precisa'];

/* ── Catálogo para cadastro rápido e "preencher o armário" ── */
export const CATALOG = [
  { emoji:'🍚', name:'Arroz tipo 1',     cat:'Mercearia',  pack:'5kg',      interval:45 },
  { emoji:'🫘', name:'Feijão carioca',   cat:'Mercearia',  pack:'1kg',      interval:20 },
  { emoji:'☕', name:'Café',             cat:'Mercearia',  pack:'500g',     interval:21 },
  { emoji:'🍝', name:'Macarrão',         cat:'Mercearia',  pack:'500g',     interval:15 },
  { emoji:'🧂', name:'Sal',              cat:'Mercearia',  pack:'1kg',      interval:90 },
  { emoji:'🫒', name:'Óleo de soja',     cat:'Mercearia',  pack:'900ml',    interval:30 },
  { emoji:'🥚', name:'Ovos',             cat:'Mercearia',  pack:'30 un',    interval:12 },
  { emoji:'🍬', name:'Açúcar',           cat:'Mercearia',  pack:'1kg',      interval:40 },
  { emoji:'🍞', name:'Pão de forma',     cat:'Padaria',    pack:'500g',     interval:7 },
  { emoji:'🥛', name:'Leite',            cat:'Laticínios', pack:'1 L',      interval:4 },
  { emoji:'🧀', name:'Queijo',           cat:'Laticínios', pack:'400g',     interval:10 },
  { emoji:'🧈', name:'Manteiga',         cat:'Laticínios', pack:'200g',     interval:20 },
  { emoji:'🧻', name:'Papel higiênico',  cat:'Limpeza',    pack:'12 rolos', interval:24 },
  { emoji:'🧴', name:'Detergente',       cat:'Limpeza',    pack:'500ml',    interval:18 },
  { emoji:'🧼', name:'Sabão em pó',      cat:'Limpeza',    pack:'1,6kg',    interval:35 },
  { emoji:'🧽', name:'Esponja',          cat:'Limpeza',    pack:'3 un',     interval:30 },
  { emoji:'🪥', name:'Creme dental',     cat:'Higiene',    pack:'90g',      interval:30 },
  { emoji:'🧴', name:'Shampoo',          cat:'Higiene',    pack:'350ml',    interval:35 },
  { emoji:'🧻', name:'Papel toalha',     cat:'Limpeza',    pack:'2 rolos',  interval:20 },
  { emoji:'🧃', name:'Suco',             cat:'Bebidas',    pack:'1 L',      interval:8 },
];

export const CATEGORIES = ['Mercearia', 'Laticínios', 'Padaria', 'Limpeza', 'Higiene', 'Bebidas'];

export const EMOJIS = ['🛒','☕','🥛','🍚','🫘','🧻','🧴','🧼','🪥','🥚','🍞','🧀','🧈','🍝','🧂','🧃','🍬','🧽','🥩','🍌','🍅','🥦'];

let seq = 0;
export const newId = () => `p${Date.now().toString(36)}${(seq++).toString(36)}`;

export function makeProduct({ emoji = '🛒', name, pack = '1 un', cat = 'Mercearia', initialInterval = 30, purchases = [] }) {
  return { id: newId(), emoji, name, pack, cat, initialInterval, purchases, onList: false, manualList: false, snoozedUntil: null };
}

/* Despensa de demonstração — histórico de compras realista para
   o modo demo, com itens em todos os estados. */
export function demoProducts() {
  const t = today();
  const hist = (interval, daysAgo, n) => {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const jitter = i === 0 ? 0 : Math.round((i % 2 ? 1 : -1) * interval * 0.12);
      out.push(iso(addDays(t, -(daysAgo + i * interval + jitter))));
    }
    return out;
  };
  const mk = (emoji, name, pack, cat, interval, daysAgo, n, price) =>
    ({ ...makeProduct({ emoji, name, pack, cat, initialInterval: interval }), purchases: hist(interval, daysAgo, n), lastPrice: price ?? null });
  return [
    mk('☕', 'Café Pilão',       '500g',     'Mercearia',  21, 19, 4, 18.90),
    mk('🥛', 'Leite integral',   '1 L',      'Laticínios',  4,  5, 6,  5.49),
    mk('🧻', 'Papel higiênico',  '12 rolos', 'Limpeza',    24, 22, 3, 24.90),
    mk('🧴', 'Detergente',       '500ml',    'Limpeza',    18, 16, 5,  2.89),
    mk('🍚', 'Arroz tipo 1',     '5kg',      'Mercearia',  45,  6, 3, 27.50),
    mk('🫘', 'Feijão carioca',   '1kg',      'Mercearia',  20,  4, 4,  8.79),
    mk('🪥', 'Creme dental',     '90g',      'Higiene',    30, 31, 2,  6.99),
    mk('🧼', 'Sabão em pó',      '1,6kg',    'Limpeza',    35,  9, 3, 21.90),
    mk('🥚', 'Ovos',             '30 un',    'Mercearia',  12,  3, 5, 19.90),
  ];
}
