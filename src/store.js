/* ===========================================================
   Não Esqueci — Estado global + persistência (localStorage)
   v2: múltiplas listas de compras com quantidades e preços.
   =========================================================== */
import { useEffect, useReducer } from 'react';
import { addDays, demoProducts, estimate, freqDays, iso, isSnoozed, makeProduct, newId, today } from './model.js';

const KEY = 'nao-esqueci-v2';
const OLD_KEY = 'nao-esqueci-v1';

const makeList = (name, emoji = '🛒') => ({ id: newId(), name, emoji });

const initial = () => ({
  user: null,            // { name, email, nfpConnected }
  products: [],
  lists: [],             // [{ id, name, emoji }]
  items: [],             // [{ id, listId, productId|null, name, emoji, cat, qty, unit, predicted, checked }]
  activeListId: null,
  settings: { alertStyle: 'cards', showLevel: true }, // cards | compact | banner
  receipts: [],          // notas lidas: { key, store, total, date, itemCount }
  onboarded: false,
});

function migrateV1(v1) {
  const s = { ...initial(), ...v1 };
  const def = makeList('Mercado');
  s.lists = [def];
  s.activeListId = def.id;
  s.items = (v1.products || []).filter(p => p.onList).map(p => ({
    id: newId(), listId: def.id, productId: p.id, name: p.name, emoji: p.emoji, cat: p.cat,
    qty: 1, unit: 'un', predicted: !p.manualList, checked: false,
  }));
  s.products = (v1.products || []).map(({ onList, manualList, ...p }) => p);
  return s;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial(), ...JSON.parse(raw) };
    const old = localStorage.getItem(OLD_KEY);
    if (old) return migrateV1(JSON.parse(old));
  } catch { /* estado corrompido → começa limpo */ }
  return initial();
}

const defaultListId = s => s.activeListId && s.lists.some(l => l.id === s.activeListId)
  ? s.activeListId
  : s.lists[0]?.id || null;

/* Itens que acabaram entram sozinhos na lista padrão (previstos).
   - `isSnoozed`: dispensa temporal ("ainda tenho") → volta sozinho ao vencer o prazo.
   - `dismissedAuto`: dispensa permanente (removeu o previsto à mão) → só volta após nova compra. */
export function autoPopulate(state) {
  const listId = state.lists[0]?.id;
  if (!listId) return state;
  const inAnyList = new Set(state.items.map(i => i.productId).filter(Boolean));
  const add = [];
  for (const p of state.products) {
    if (inAnyList.has(p.id) || isSnoozed(p) || p.dismissedAuto) continue;
    if (estimate(p).status === 'out') {
      add.push({ id: newId(), listId, productId: p.id, name: p.name, emoji: p.emoji, cat: p.cat, qty: 1, unit: 'un', predicted: true, checked: false });
    }
  }
  return add.length ? { ...state, items: [...state.items, ...add] } : state;
}

function applyPurchase(p, date, price) {
  const d = iso(date || today());
  const purchases = [...(p.purchases || [])];
  if (!purchases.includes(d)) purchases.push(d);
  purchases.sort();
  return { ...p, purchases, snoozedUntil: null, dismissedAuto: false, lastPrice: price ?? p.lastPrice ?? null };
}

function ensureLists(state) {
  if (state.lists.length) return state;
  const def = makeList('Mercado');
  return { ...state, lists: [def], activeListId: def.id };
}

export function reducer(state, action) {
  switch (action.type) {
    case 'login': {
      const s = ensureLists(state);
      return autoPopulate({
        ...s,
        user: { name: action.name, email: action.email, nfpConnected: false },
        products: action.demo ? demoProducts() : s.products,
        onboarded: action.demo ? true : s.onboarded,
      });
    }
    case 'logout':
      return initial();
    case 'onboarded':
      return { ...state, onboarded: true };

    /* ── produtos / despensa ── */
    case 'add-product': {
      const p = makeProduct({
        emoji: action.emoji, name: action.name, pack: action.pack, cat: action.cat,
        initialInterval: action.freq ? freqDays(action.freq) : (action.interval || 30),
        purchases: action.haveIt ? [iso(today())] : [],
      });
      return { ...state, products: [...state.products, p] };
    }
    case 'add-many': {
      const added = action.items.map(it => ({
        ...makeProduct({
          emoji: it.emoji, name: it.name, pack: it.pack, cat: it.cat,
          initialInterval: it.interval || 30,
          purchases: [iso(action.date || today())],
        }),
        lastPrice: it.price ?? null,
      }));
      return { ...state, products: [...state.products, ...added] };
    }
    case 'delete-product':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.id),
        items: state.items.filter(i => i.productId !== action.id),
      };
    case 'mark-bought':
      return autoPopulate({
        ...state,
        products: state.products.map(p => p.id === action.id ? applyPurchase(p, action.date, action.price) : p),
        items: state.items.filter(i => i.productId !== action.id),
      });
    case 'mark-bought-many': {
      const prices = action.prices || {};
      return autoPopulate({
        ...state,
        products: state.products.map(p => action.ids.includes(p.id) ? applyPurchase(p, action.date, prices[p.id]) : p),
        items: state.items.filter(i => !action.ids.includes(i.productId)),
      });
    }
    case 'snooze': {
      return {
        ...state,
        products: state.products.map(p => {
          if (p.id !== action.id) return p;
          const { interval } = estimate(p);
          const days = Math.max(2, Math.round((interval || 14) * 0.15));
          // snooze é temporal: ao vencer o prazo, o item volta sozinho à lista (#5).
          return { ...p, snoozedUntil: iso(addDays(today(), days)), dismissedAuto: false };
        }),
        items: state.items.filter(i => !(i.productId === action.id && i.predicted)),
      };
    }

    /* ── listas de compras ── */
    case 'list-create': {
      const l = makeList(action.name || 'Nova lista', action.emoji || '🛒');
      return { ...state, lists: [...state.lists, l], activeListId: l.id };
    }
    case 'list-rename':
      return { ...state, lists: state.lists.map(l => l.id === action.id ? { ...l, name: action.name, emoji: action.emoji ?? l.emoji } : l) };
    case 'list-delete': {
      if (state.lists.length <= 1) return state; // sempre sobra uma
      const lists = state.lists.filter(l => l.id !== action.id);
      return {
        ...state, lists,
        items: state.items.filter(i => i.listId !== action.id),
        activeListId: state.activeListId === action.id ? lists[0].id : state.activeListId,
      };
    }
    case 'list-select':
      return { ...state, activeListId: action.id };

    case 'item-add': {
      const listId = action.listId || defaultListId(state);
      if (!listId) return state;
      const it = {
        id: newId(), listId, productId: action.productId || null,
        name: action.name, emoji: action.emoji || '🛒', cat: action.cat || 'Outros',
        qty: action.qty || 1, unit: action.unit || 'un', predicted: !!action.predicted, checked: false,
      };
      return { ...state, items: [...state.items, it] };
    }
    case 'item-update':
      return { ...state, items: state.items.map(i => i.id === action.id ? { ...i, ...action.patch } : i) };
    case 'item-remove': {
      const it = state.items.find(i => i.id === action.id);
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.id),
        // tirar um item previsto da lista = "não quero ver de novo por ora"
        products: it?.predicted && it.productId
          ? state.products.map(p => p.id === it.productId ? { ...p, dismissedAuto: true } : p)
          : state.products,
      };
    }
    /* conveniência: alterna o produto na lista padrão (home/status) */
    case 'toggle-list': {
      const p = state.products.find(x => x.id === action.id);
      if (!p) return state;
      const existing = state.items.find(i => i.productId === p.id);
      if (existing) return reducer(state, { type: 'item-remove', id: existing.id });
      return reducer(state, {
        type: 'item-add',
        productId: p.id, name: p.name, emoji: p.emoji, cat: p.cat,
      });
    }
    /* fecha a compra: itens marcados viram compras datadas */
    case 'finish-shopping': {
      const done = state.items.filter(i => i.listId === action.listId && i.checked);
      const ids = done.map(i => i.productId).filter(Boolean);
      return autoPopulate({
        ...state,
        products: state.products.map(p => ids.includes(p.id) ? applyPurchase(p, action.date) : p),
        items: state.items.filter(i => !(i.listId === action.listId && i.checked)),
      });
    }

    /* ── nota fiscal / preferências ── */
    case 'receipt': {
      const receipts = [{ ...action.receipt, date: iso(action.receipt.date || today()) }, ...state.receipts].slice(0, 30);
      return { ...state, receipts };
    }
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'connect-nfp':
      return { ...state, user: { ...state.user, nfpConnected: action.on } };
    case 'refresh':
      return autoPopulate(state);
    default:
      return state;
  }
}

export function useStore() {
  const [state, dispatch] = useReducer(reducer, undefined, () => autoPopulate(ensureLists(load())));
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* quota */ }
  }, [state]);
  return [state, dispatch];
}

/* decora produtos com onList (derivado das listas) para os
   componentes que mostram o estado "na lista" */
export const withOnList = (products, items) => {
  const inList = new Set(items.map(i => i.productId).filter(Boolean));
  return products.map(p => ({ ...p, onList: inList.has(p.id) }));
};
