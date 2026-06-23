/* ===========================================================
   Parser da página de consulta pública da NFC-e.
   A maioria das SEFAZs estaduais usa o layout "portal nacional"
   (DANFE NFC-e online): itens em #tabResult com spans
   .txtTit / .Rqtd / .RUN / .RvlUnit / .valor, totais em
   #totalNota e emitente em .txtTopo.
   =========================================================== */
import { parse } from 'node-html-parser';

const num = s => {
  if (s == null) return null;
  const m = String(s).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const v = parseFloat(m);
  return Number.isFinite(v) ? v : null;
};

const clean = s => (s || '').replace(/\s+/g, ' ').trim();

export function parseNfcePage(html) {
  const root = parse(html);

  const items = [];
  for (const row of root.querySelectorAll('#tabResult tr')) {
    const name = clean(row.querySelector('.txtTit')?.text);
    if (!name) continue;
    const qty = num(clean(row.querySelector('.Rqtd')?.text).replace(/qtde\.?:/i, ''));
    const unit = clean(row.querySelector('.RUN')?.text).replace(/un:?/i, '').trim().toUpperCase() || 'UN';
    const unitPrice = num(clean(row.querySelector('.RvlUnit')?.text).replace(/vl\.?\s*unit\.?:/i, ''));
    const total = num(row.querySelector('.valor')?.text);
    items.push({ name, qty: qty ?? 1, unit, unitPrice, total });
  }

  // dedup: alguns layouts repetem o item numa linha de detalhe.
  // A chave inclui qty/unitPrice além de total — assim, quando o
  // layout não traz o total por item (total: null), duas linhas do
  // mesmo produto com quantidades/preços distintos não colidem.
  const seen = new Set();
  const unique = items.filter(it => {
    const k = `${it.name}|${it.total}|${it.qty}|${it.unitPrice}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const store = clean(
    root.querySelector('#u20')?.text ||
    root.querySelector('.txtTopo')?.text
  ) || null;

  let total = null;
  for (const line of root.querySelectorAll('#totalNota #linhaTotal, #totalNota .linhaShade, #linhaTotal')) {
    const label = clean(line.querySelector('label')?.text).toLowerCase();
    if (label.includes('valor a pagar') || label.includes('valor total')) {
      total = num(line.querySelector('.totalNumb')?.text) ?? total;
    }
  }
  if (total == null) total = num(root.querySelector('.totalNumb.txtMax')?.text);

  // data de emissão: "Emissão: 11/06/2026 10:31:22"
  let date = null;
  const m = html.match(/Emiss[ãa]o[^0-9]*(\d{2})\/(\d{2})\/(\d{4})/i);
  if (m) date = `${m[3]}-${m[2]}-${m[1]}`;

  if (!unique.length) return null;
  return { store, date, total, items: unique };
}
