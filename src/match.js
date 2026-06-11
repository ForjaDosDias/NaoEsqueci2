/* ===========================================================
   Casamento dos itens da nota fiscal com a despensa.
   Descrições de NFC-e vêm em caixa alta e cheias de ruído
   ("CAFE PILAO TRAD 500G VACUO"); aqui normalizamos, chutamos
   emoji/categoria por palavra-chave e tentamos vincular a um
   produto já cadastrado.
   =========================================================== */

export const normalize = s => (s || '')
  .toUpperCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^A-Z0-9 ]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const KEYWORDS = [
  { k: ['CAFE'],                       emoji: '☕', cat: 'Mercearia',  interval: 21 },
  { k: ['LEITE'],                      emoji: '🥛', cat: 'Laticínios', interval: 4 },
  { k: ['ARROZ'],                      emoji: '🍚', cat: 'Mercearia',  interval: 45 },
  { k: ['FEIJAO'],                     emoji: '🫘', cat: 'Mercearia',  interval: 20 },
  { k: ['MACARRAO', 'ESPAGUETE', 'PARAFUSO'], emoji: '🍝', cat: 'Mercearia', interval: 15 },
  { k: ['ACUCAR'],                     emoji: '🍬', cat: 'Mercearia',  interval: 40 },
  { k: ['SAL '],                       emoji: '🧂', cat: 'Mercearia',  interval: 90 },
  { k: ['OLEO', 'AZEITE'],             emoji: '🫒', cat: 'Mercearia',  interval: 30 },
  { k: ['OVO'],                        emoji: '🥚', cat: 'Mercearia',  interval: 12 },
  { k: ['PAO', 'BISNAGUINHA'],         emoji: '🍞', cat: 'Padaria',    interval: 7 },
  { k: ['QUEIJO', 'MUSSARELA', 'PRATO'], emoji: '🧀', cat: 'Laticínios', interval: 10 },
  { k: ['MANTEIGA', 'MARGARINA'],      emoji: '🧈', cat: 'Laticínios', interval: 20 },
  { k: ['IOGURTE'],                    emoji: '🥛', cat: 'Laticínios', interval: 7 },
  { k: ['PAPEL HIG'],                  emoji: '🧻', cat: 'Limpeza',    interval: 24 },
  { k: ['PAPEL TOALHA'],               emoji: '🧻', cat: 'Limpeza',    interval: 20 },
  { k: ['DETERG'],                     emoji: '🧴', cat: 'Limpeza',    interval: 18 },
  { k: ['SABAO', 'LAVA ROUPA'],        emoji: '🧼', cat: 'Limpeza',    interval: 35 },
  { k: ['AMACIANTE'],                  emoji: '🧴', cat: 'Limpeza',    interval: 35 },
  { k: ['DESINF', 'AGUA SANIT'],       emoji: '🧴', cat: 'Limpeza',    interval: 30 },
  { k: ['ESPONJA'],                    emoji: '🧽', cat: 'Limpeza',    interval: 30 },
  { k: ['CREME DENTAL', 'PASTA DENT'], emoji: '🪥', cat: 'Higiene',    interval: 30 },
  { k: ['SHAMPOO', 'XAMPU', 'CONDICION'], emoji: '🧴', cat: 'Higiene', interval: 35 },
  { k: ['SABONETE'],                   emoji: '🧼', cat: 'Higiene',    interval: 25 },
  { k: ['SUCO'],                       emoji: '🧃', cat: 'Bebidas',    interval: 8 },
  { k: ['REFRIG', 'COCA', 'GUARANA'],  emoji: '🥤', cat: 'Bebidas',    interval: 10 },
  { k: ['CERVEJA'],                    emoji: '🍺', cat: 'Bebidas',    interval: 10 },
  { k: ['AGUA MIN'],                   emoji: '💧', cat: 'Bebidas',    interval: 7 },
  { k: ['BANANA', 'MACA', 'LARANJA', 'MAMAO'], emoji: '🍌', cat: 'Hortifruti', interval: 7 },
  { k: ['TOMATE', 'CEBOLA', 'ALHO', 'BATATA'], emoji: '🍅', cat: 'Hortifruti', interval: 10 },
  { k: ['FRANGO', 'CARNE', 'BOVIN', 'PATINHO', 'ALCATRA', 'LINGUICA'], emoji: '🥩', cat: 'Carnes', interval: 7 },
];

export function guessMeta(rawName) {
  const n = ' ' + normalize(rawName) + ' ';
  for (const kw of KEYWORDS) {
    if (kw.k.some(k => n.includes(' ' + k) || n.includes(k))) return kw;
  }
  return { emoji: '🛒', cat: 'Mercearia', interval: 30 };
}

/* "CAFE PILAO TRAD 500G VACUO" → "500g" */
export function extractPack(rawName) {
  const m = normalize(rawName).match(/(\d+(?:[.,]\d+)?)\s*(KG|G|GR|L|LT|ML|UN|RL|ROLOS?|M)\b/);
  if (!m) return null;
  const unit = { GR: 'g', G: 'g', KG: 'kg', L: 'L', LT: 'L', ML: 'ml', UN: 'un', RL: 'rolos', ROLO: 'rolos', ROLOS: 'rolos', M: 'm' }[m[2]] || m[2].toLowerCase();
  return `${m[1].replace('.', ',')}${unit === 'un' || unit === 'rolos' ? ' ' : ''}${unit}`;
}

/* Caixa alta de nota → Título legível */
export function titleCase(rawName) {
  const small = new Set(['de', 'da', 'do', 'com', 'em', 'e']);
  return normalize(rawName).toLowerCase().split(' ')
    .map((w, i) => small.has(w) && i > 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/* Vincula a descrição da nota a um produto da despensa por
   sobreposição de tokens (ignora tamanhos/números). */
export function matchProduct(products, rawName) {
  const tokens = normalize(rawName).split(' ').filter(t => t.length >= 3 && !/^\d/.test(t));
  if (!tokens.length) return null;
  let best = null, bestScore = 0;
  for (const p of products) {
    const ptokens = new Set(normalize(p.name).split(' ').filter(t => t.length >= 3));
    if (!ptokens.size) continue;
    let hits = 0;
    for (const t of tokens) {
      for (const pt of ptokens) {
        if (t === pt || t.startsWith(pt) || pt.startsWith(t)) { hits++; break; }
      }
    }
    const score = hits / Math.min(tokens.length, ptokens.size);
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return bestScore >= 0.5 ? best : null;
}
