/* ===========================================================
   Não Esqueci — Estado global + persistência (localStorage)
   =========================================================== */
import { useEffect, useReducer } from 'react';
import { addDays, demoProducts, estimate, freqDays, iso, makeProduct, today } from './model.js';

const KEY = 'nao-esqueci-v1';

const initial = {
  user: null,            // { name, email, nfpConnected }
  products: [],
  settings: { alertStyle: 'cards', showLevel: true }, // cards | compact | banner
  receipts: [],          // notas lidas: { key, store, total, date, itemCount }
  onboarded: false,
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial, ...JSON.parse(raw) };
  } catch { /* estado corrompido → começa limpo */ }
  return initial;
}

/* Itens que acabaram entram sozinhos na lista (previstos);
   o usuário pode tirar quando quiser. */
function autoPopulate(products) {
  return products.map(p => {
    const { status } = estimate(p);
    if (status === 'out' && !p.onList && !p.dismissedAuto) return { ...p, onList: true, manualList: false };
    return p;
  });
}

function markBought(p, date) {
  const d = iso(date || today());
  const purchases = [...(p.purchases || [])];
  if (!purchases.includes(d)) purchases.push(d);
  purchases.sort();
  return { ...p, purchases, onList: false, manualList: false, snoozedUntil: null, dismissedAuto: false };
}

function reducer(state, action) {
  switch (action.type) {
    case 'login': {
      const demo = action.demo;
      return {
        ...state,
        user: { name: action.name, email: action.email, nfpConnected: false },
        products: demo ? autoPopulate(demoProducts()) : state.products,
        onboarded: demo ? true : state.onboarded,
      };
    }
    case 'logout':
      return { ...initial };
    case 'onboarded':
      return { ...state, onboarded: true };
    case 'add-product': {
      const p = makeProduct({
        emoji: action.emoji, name: action.name, pack: action.pack, cat: action.cat,
        initialInterval: action.freq ? freqDays(action.freq) : (action.interval || 30),
        purchases: action.haveIt ? [iso(today())] : [],
      });
      return { ...state, products: [...state.products, p] };
    }
    case 'add-many': {
      const added = action.items.map(it => makeProduct({
        emoji: it.emoji, name: it.name, pack: it.pack, cat: it.cat,
        initialInterval: it.interval || 30,
        purchases: [iso(action.date || today())],
      }));
      return { ...state, products: [...state.products, ...added] };
    }
    case 'delete-product':
      return { ...state, products: state.products.filter(p => p.id !== action.id) };
    case 'mark-bought':
      return { ...state, products: state.products.map(p => p.id === action.id ? markBought(p, action.date) : p) };
    case 'mark-bought-many':
      return {
        ...state,
        products: state.products.map(p => action.ids.includes(p.id) ? markBought(p, action.date) : p),
      };
    case 'toggle-list':
      return {
        ...state,
        products: state.products.map(p => p.id === action.id
          ? (p.onList
              ? { ...p, onList: false, manualList: false, dismissedAuto: !p.manualList }
              : { ...p, onList: true, manualList: true })
          : p),
      };
    case 'snooze': {
      return {
        ...state,
        products: state.products.map(p => {
          if (p.id !== action.id) return p;
          const { interval } = estimate(p);
          const days = Math.max(2, Math.round((interval || 14) * 0.15));
          return { ...p, snoozedUntil: iso(addDays(today(), days)), dismissedAuto: true, onList: p.manualList ? p.onList : false };
        }),
      };
    }
    case 'receipt': {
      const receipts = [{ ...action.receipt, date: iso(action.receipt.date || today()) }, ...state.receipts].slice(0, 30);
      return { ...state, receipts };
    }
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'connect-nfp':
      return { ...state, user: { ...state.user, nfpConnected: action.on } };
    case 'refresh':
      return { ...state, products: autoPopulate(state.products) };
    default:
      return state;
  }
}

export function useStore() {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const s = load();
    return { ...s, products: autoPopulate(s.products) };
  });
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota */ }
  }, [state]);
  return [state, dispatch];
}
