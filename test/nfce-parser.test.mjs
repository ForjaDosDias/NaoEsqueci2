/* Teste do parser da página de consulta da NFC-e (layout
   "portal nacional" usado pela maioria das SEFAZs). */
import { parseNfcePage } from '../server/parser.js';

const FIXTURE = `
<!DOCTYPE html><html><head><title>NFC-e</title></head><body>
<div id="conteudo">
  <div class="txtCenter">
    <div id="u20" class="txtTopo">MERCADO SAO JORGE LTDA</div>
    <div class="text">CNPJ: 47.508.411/0001-56</div>
    <div class="text">AV BRASIL, 1000, CENTRO, SAO PAULO, SP</div>
  </div>
  <table id="tabResult">
    <tr id="Item1"><td valign="top">
      <span class="txtTit">CAFE PILAO TRAD 500G VACUO</span>
      <span class="Rqtd"><strong>Qtde.:</strong>1</span>
      <span class="RUN"><strong>UN: </strong>UN</span>
      <span class="RvlUnit"><strong>Vl. Unit.:</strong>&nbsp;&nbsp;18,90</span>
    </td><td align="right"><span class="valor">18,90</span></td></tr>
    <tr id="Item2"><td valign="top">
      <span class="txtTit">LEITE UHT INT ITALAC 1L</span>
      <span class="Rqtd"><strong>Qtde.:</strong>2</span>
      <span class="RUN"><strong>UN: </strong>UN</span>
      <span class="RvlUnit"><strong>Vl. Unit.:</strong>&nbsp;&nbsp;5,49</span>
    </td><td align="right"><span class="valor">10,98</span></td></tr>
    <tr id="Item3"><td valign="top">
      <span class="txtTit">BANANA PRATA KG</span>
      <span class="Rqtd"><strong>Qtde.:</strong>1,355</span>
      <span class="RUN"><strong>UN: </strong>KG</span>
      <span class="RvlUnit"><strong>Vl. Unit.:</strong>&nbsp;&nbsp;6,99</span>
    </td><td align="right"><span class="valor">9,47</span></td></tr>
  </table>
  <div id="totalNota">
    <div id="linhaTotal"><label>Qtd. total de itens:</label><span class="totalNumb">3</span></div>
    <div id="linhaTotal" class="linhaShade"><label>Valor a pagar R$:</label><span class="totalNumb txtMax">39,35</span></div>
  </div>
  <div class="text">
    <strong>EMISSÃO NORMAL</strong><br>
    Número: 123456 Série: 1 Emissão: 11/06/2026 10:31:22 - Via Consumidor
  </div>
</div>
</body></html>`;

let failed = 0;
const check = (name, cond) => {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) failed = 1;
};

const note = parseNfcePage(FIXTURE);

check('parser retorna a nota', !!note);
check('emitente extraído', note.store === 'MERCADO SAO JORGE LTDA');
check('3 itens extraídos', note.items.length === 3);
check('nome do item', note.items[0].name === 'CAFE PILAO TRAD 500G VACUO');
check('quantidade inteira', note.items[1].qty === 2);
check('quantidade fracionada (kg)', Math.abs(note.items[2].qty - 1.355) < 1e-9);
check('unidade KG', note.items[2].unit === 'KG');
check('preço unitário', note.items[0].unitPrice === 18.9);
check('total do item', note.items[1].total === 10.98);
check('total da nota', note.total === 39.35);
check('data de emissão', note.date === '2026-06-11');
check('HTML sem itens → null', parseNfcePage('<html><body><p>captcha</p></body></html>') === null);

/* #6 — layout sem total por item (.valor ausente): duas linhas do mesmo
   produto com qtd/preço distintos não devem ser fundidas no dedup. */
const FIXTURE_NO_TOTAL = `
<!DOCTYPE html><html><body>
<div id="u20" class="txtTopo">MERCADO SEM TOTAL</div>
<table id="tabResult">
  <tr id="Item1"><td>
    <span class="txtTit">CAFE</span>
    <span class="Rqtd"><strong>Qtde.:</strong>1</span>
    <span class="RUN"><strong>UN: </strong>UN</span>
    <span class="RvlUnit"><strong>Vl. Unit.:</strong>18,90</span>
  </td></tr>
  <tr id="Item2"><td>
    <span class="txtTit">CAFE</span>
    <span class="Rqtd"><strong>Qtde.:</strong>2</span>
    <span class="RUN"><strong>UN: </strong>UN</span>
    <span class="RvlUnit"><strong>Vl. Unit.:</strong>17,50</span>
  </td></tr>
</table></body></html>`;
const noTotal = parseNfcePage(FIXTURE_NO_TOTAL);
check('#6 dedup preserva itens distintos com total nulo', noTotal && noTotal.items.length === 2);
check('#6 totais dos itens são nulos (layout sem .valor)', noTotal && noTotal.items.every(i => i.total === null));

/* #6 — linha de detalhe verdadeiramente duplicada (idêntica) ainda é removida. */
const FIXTURE_DUP = `
<!DOCTYPE html><html><body>
<div id="u20" class="txtTopo">MERCADO DUP</div>
<table id="tabResult">
  <tr id="Item1"><td>
    <span class="txtTit">ARROZ</span>
    <span class="Rqtd"><strong>Qtde.:</strong>1</span>
    <span class="RUN"><strong>UN: </strong>UN</span>
    <span class="RvlUnit"><strong>Vl. Unit.:</strong>22,00</span>
  </td><td align="right"><span class="valor">22,00</span></td></tr>
  <tr id="Item1det"><td>
    <span class="txtTit">ARROZ</span>
    <span class="Rqtd"><strong>Qtde.:</strong>1</span>
    <span class="RUN"><strong>UN: </strong>UN</span>
    <span class="RvlUnit"><strong>Vl. Unit.:</strong>22,00</span>
  </td><td align="right"><span class="valor">22,00</span></td></tr>
</table></body></html>`;
const dup = parseNfcePage(FIXTURE_DUP);
check('#6 dedup remove linha de detalhe idêntica', dup && dup.items.length === 1);

process.exit(failed);
