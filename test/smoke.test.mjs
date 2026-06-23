/* Smoke test: monta o app num DOM simulado (jsdom) e percorre o
   fluxo principal — login demo → despensa com alertas → lista
   pré-populada. Roda com `npm test` (sem browser). */
import { JSDOM } from 'jsdom';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// gera um bundle de produção em memória de disco e injeta no jsdom
await build({ root, logLevel: 'error', build: { outDir: 'dist-test', minify: false } });
const js = fs.readFileSync(path.join(root, 'dist-test/assets',
  fs.readdirSync(path.join(root, 'dist-test/assets')).find(f => f.endsWith('.js'))), 'utf8');

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: 'https://localhost/', pretendToBeVisual: true, runScripts: 'outside-only',
});
const { window } = dom;
let failed = 0;
const check = (name, cond) => {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) failed = 1;
};

window.eval(js);
await new Promise(r => setTimeout(r, 80));

const body = () => window.document.body.textContent;
check('tela de login renderiza a marca', body().includes('Esqueci'));
check('teaser da Nota Fiscal aparece no login', body().includes('Nota Fiscal'));

// #8 — UI deixa claro que o login social é demonstrativo (não é auth real)
check('#8 login social sinalizado como demonstrativo', body().includes('demonstrativo'));

// #4 — "Esqueci a senha" deixou de ser botão morto: responde com mensagem
const forgotLink = [...window.document.querySelectorAll('span')]
  .find(el => el.textContent.includes('Esqueci a senha'));
check('link "Esqueci a senha" existe', !!forgotLink);
forgotLink.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await new Promise(r => setTimeout(r, 40));
check('#4 "Esqueci a senha" responde com mensagem', body().includes('e-mail acima'));

// entra com dados de exemplo
const demoLink = [...window.document.querySelectorAll('span')]
  .find(el => el.textContent.includes('Explorar com dados de exemplo'));
check('link de demo existe', !!demoLink);
demoLink.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await new Promise(r => setTimeout(r, 80));

check('home mostra a despensa', body().includes('despensa'));
check('seção de atenção aparece (itens acabando)', body().includes('Atenção'));
check('previsão visível ("Deve acabar")', /Deve (acabar|ter acabado)|Acabou há/.test(body()));

// abre a lista — itens que acabaram entram sozinhos como "previsto"
const listaTab = [...window.document.querySelectorAll('span')]
  .find(el => el.textContent === 'Lista');
listaTab.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
await new Promise(r => setTimeout(r, 80));
check('lista pré-populada pela previsão', body().includes('Sugeridos pela previsão'));

fs.rmSync(path.join(root, 'dist-test'), { recursive: true, force: true });
process.exit(failed);
