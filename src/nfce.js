/* ===========================================================
   Não Esqueci — Parser do QR Code da NFC-e
   O QR Code do cupom fiscal (NFC-e) aponta para o portal da
   SEFAZ do estado e carrega a chave de acesso de 44 dígitos.
   Formatos suportados:
   - v1: ...?chNFe=<44>&nVersao=...&vNF=...
   - v2: ...?p=<44>|<versão>|<ambiente>|...campos...|<hash>
        (no modo offline inclui dhEmi e vNF)
   =========================================================== */

const UF_BY_CODE = {
  '11':'RO','12':'AC','13':'AM','14':'RR','15':'PA','16':'AP','17':'TO',
  '21':'MA','22':'PI','23':'CE','24':'RN','25':'PB','26':'PE','27':'AL','28':'SE','29':'BA',
  '31':'MG','32':'ES','33':'RJ','35':'SP',
  '41':'PR','42':'SC','43':'RS',
  '50':'MS','51':'MT','52':'GO','53':'DF',
};

const fmtCnpj = c =>
  `${c.slice(0,2)}.${c.slice(2,5)}.${c.slice(5,8)}/${c.slice(8,12)}-${c.slice(12,14)}`;

/* Extrai os dados disponíveis no próprio QR Code (sem backend
   não dá para buscar os itens no portal da SEFAZ — o app pede
   confirmação dos itens ao usuário depois da leitura). */
export function parseNfceQr(text) {
  if (!text) return null;
  const keyMatch = text.replace(/\s/g, '').match(/(\d{44})/);
  if (!keyMatch) return null;
  const key = keyMatch[1];

  const cUF = key.slice(0, 2);
  const yy = key.slice(2, 4);
  const mm = key.slice(4, 6);
  const cnpj = key.slice(6, 20);
  const modelo = key.slice(20, 22); // 65 = NFC-e, 55 = NF-e

  const result = {
    key,
    keyFmt: key.replace(/(\d{4})/g, '$1 ').trim(),
    uf: UF_BY_CODE[cUF] || null,
    cnpj: fmtCnpj(cnpj),
    emissao: `${mm}/20${yy}`,
    isNfce: modelo === '65',
    total: null,
    dhEmi: null,
    url: /^https?:\/\//i.test(text.trim()) ? text.trim() : null,
  };

  // formato v2: p=chave|versao|ambiente|[dhEmi]|[vNF]|...
  const pParam = text.match(/[?&]p=([^&\s]+)/i);
  if (pParam) {
    const fields = decodeURIComponent(pParam[1]).split('|');
    for (const f of fields.slice(1)) {
      if (/^\d{4}-\d{2}-\d{2}T/.test(f) || /^\d{14}$/.test(f)) result.dhEmi = f;
      else if (/^\d+\.\d{2}$/.test(f) && parseFloat(f) > 0) result.total = parseFloat(f);
    }
  }
  // formato v1: vNF=12.34
  const vnf = text.match(/[?&]vNF=([\d.]+)/i);
  if (vnf) result.total = parseFloat(vnf[1]);

  return result;
}

/* Data de emissão como Date (quando o QR a expõe) */
export function nfceDate(parsed) {
  if (!parsed?.dhEmi) return null;
  if (/^\d{14}$/.test(parsed.dhEmi)) {
    const s = parsed.dhEmi;
    return new Date(+s.slice(0,4), +s.slice(4,6) - 1, +s.slice(6,8));
  }
  const d = new Date(parsed.dhEmi);
  return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/* Nota de demonstração para testar o fluxo sem câmera/cupom */
export const DEMO_NOTE = {
  key: '35' + '2606' + '47508411000156' + '65' + '001' + '000123456' + '1' + '12345678' + '0',
  store: 'Mercado São Jorge',
  total: 56.38,
  items: [
    { emoji:'☕', name:'Café Pilão',      pack:'500g',     cat:'Mercearia',  price:18.90, qty:1, unit:'UN', interval:21 },
    { emoji:'🥛', name:'Leite integral',  pack:'1 L',      cat:'Laticínios', price: 5.49, qty:2, unit:'UN', interval:4 },
    { emoji:'🍝', name:'Macarrão',        pack:'500g',     cat:'Mercearia',  price: 4.20, qty:1, unit:'UN', interval:15 },
    { emoji:'🧻', name:'Papel higiênico', pack:'12 rolos', cat:'Limpeza',    price:24.90, qty:1, unit:'UN', interval:24 },
    { emoji:'🧴', name:'Detergente',      pack:'500ml',    cat:'Limpeza',    price: 2.89, qty:3, unit:'UN', interval:18 },
  ],
};
