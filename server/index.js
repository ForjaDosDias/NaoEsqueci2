/* ===========================================================
   Não Esqueci — backend leve
   GET /api/nfce?url=<URL do QR Code>
     Consulta a página pública da NFC-e na SEFAZ do estado e
     devolve { store, date, total, items:[{name, qty, unit,
     unitPrice, total}] } para o usuário confirmar no app.
   Também serve o build estático (dist/) em produção.
   =========================================================== */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNfcePage } from './parser.js';

const PORT = process.env.PORT || 3001;
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, 'dist');

/* Só consultamos portais oficiais (.gov.br de fazenda/SEFAZ) —
   evita que o endpoint vire um proxy aberto (SSRF). */
function isAllowedSefazUrl(u) {
  let url;
  try { url = new URL(u); } catch { return false; }
  if (!/^https?:$/.test(url.protocol)) return false;
  if (url.port && url.port !== '443' && url.port !== '80') return false;
  const h = url.hostname.toLowerCase();
  if (!h.endsWith('.gov.br')) return false;
  return /(sefaz|fazenda|nfce|nfe|sefin|sef\.|sat\.|dfe|sped)/.test(h);
}

async function fetchSefaz(rawUrl) {
  let url = rawUrl;
  // segue até 4 redirects validando cada destino
  for (let hop = 0; hop < 4; hop++) {
    if (!isAllowedSefazUrl(url)) {
      const err = new Error('URL fora dos portais oficiais da SEFAZ');
      err.code = 'forbidden_host';
      throw err;
    }
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(12000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location'), url).href;
      continue;
    }
    if (!res.ok) {
      const err = new Error(`SEFAZ respondeu ${res.status}`);
      err.code = 'sefaz_error';
      throw err;
    }
    return await res.text();
  }
  const err = new Error('Redirecionamentos demais');
  err.code = 'sefaz_error';
  throw err;
}

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
};

function serveStatic(req, res) {
  if (!fs.existsSync(DIST)) {
    json(res, 404, { error: 'not_found', message: 'Build não encontrado — rode `npm run build`.' });
    return;
  }
  const reqPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.normalize(path.join(DIST, reqPath));
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(DIST, 'index.html'); // SPA fallback
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');

  if (url.pathname === '/api/health') return json(res, 200, { ok: true });

  if (url.pathname === '/api/nfce') {
    const qrUrl = url.searchParams.get('url');
    if (!qrUrl) return json(res, 400, { error: 'bad_request', message: 'Parâmetro url é obrigatório.' });
    if (!isAllowedSefazUrl(qrUrl)) {
      return json(res, 422, { error: 'forbidden_host', message: 'Esse QR Code não aponta para um portal oficial da SEFAZ.' });
    }
    try {
      const html = await fetchSefaz(qrUrl);
      const note = parseNfcePage(html);
      if (!note) {
        return json(res, 502, { error: 'parse_failed', message: 'A SEFAZ respondeu, mas os itens não vieram nesse formato. Confirme manualmente.' });
      }
      return json(res, 200, note);
    } catch (e) {
      const status = e.code === 'forbidden_host' ? 422 : 502;
      const message = e.name === 'TimeoutError'
        ? 'O portal da SEFAZ demorou para responder. Tente de novo ou confirme manualmente.'
        : (e.message || 'Falha ao consultar a SEFAZ.');
      return json(res, status, { error: e.code || 'sefaz_error', message });
    }
  }

  if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'not_found' });
  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Não Esqueci server on http://localhost:${PORT} (API: /api/nfce)`);
});
