# Não Esqueci — Lista Inteligente

> ## ⚠️ TEMPORÁRIO — REMOVER ASSIM QUE POSSÍVEL: bypass de review na `main`
>
> Em **2026-06-22** o ruleset `protect-main` recebeu um **bypass para o papel
> "Repository admin"** (`bypass_mode: always`). Motivo: o time tem apenas 2 admins e o
> GitHub não permite aprovar o próprio PR, o que impedia o merge do release `dev → main`
> (regra exige 1 aprovação humana).
>
> **Isto enfraquece a proteção de produção.** Remover o bypass assim que houver um
> revisor disponível (terceiro colaborador ou aprovação do outro admin):
> `Settings → Rules → Rulesets → protect-main → Bypass list → remover "Repository admin"`
> (ou `gh api --method PUT repos/ForjaDosDias/NaoEsqueci2/rulesets/17845759` com `"bypass_actors": []`).

Lista de compras que te lembra do que está acabando. Um clone do Listonic com dois diferenciais:

1. **Previsão automática de estoque** — você marca quando compra e o app estima quando cada produto vai acabar. A partir da 2ª compra ele aprende seu ritmo real (média móvel dos intervalos entre compras) e ajusta a previsão sozinho.
2. **Leitura de QR Code da nota fiscal (NFC-e)** — escaneie o cupom fiscal com a câmera; o backend consulta a página pública da nota na SEFAZ e devolve **itens, quantidades e preços** para você confirmar com 1 toque.

## O loop do usuário

1. **Comprou** → registra com 1 toque (a data é salva) ou escaneando a nota
2. O app **estima quando acaba** (status: em dia · acabando · acabou)
3. **Avisa** e pré-popula a próxima lista de compras automaticamente

## Funcionalidades

**Despensa e previsão**
- Home com resumo, seção "Atenção" (*Adicionar à lista* / *Ainda tenho*) e barra de nível estimado
- Cadastro simplificado estilo Listonic: autocomplete do catálogo preenche tudo com 1 toque
- "Comprei" com 1 toque · Armário inicial · Status com filtros (Acabou / Acabando / Em dia)
- Medidor de confiança da previsão (melhora a cada compra registrada)

**Listas de compras (paridade com o Listonic)**
- **Múltiplas listas** (criar, renomear, excluir) com emoji
- **Quantidades por item** com stepper (+/−)
- **Adicionar item livre** com autocomplete (despensa + catálogo)
- **Agrupamento por categoria** (corredores do mercado)
- **Preço estimado da lista** — preços aprendidos das notas fiscais lidas
- **Compartilhar lista** (Web Share API / copiar como texto)
- Itens que acabaram entram sozinhos como "previstos"; "Finalizei as compras" reinicia as previsões

**Nota fiscal (NFC-e)**
- Scanner com câmera real (`BarcodeDetector` nativo ou jsQR)
- Backend consulta a SEFAZ e extrai itens/quantidades/preços (layout "portal nacional", usado pela maioria dos estados)
- Itens da nota são casados com a despensa por similaridade de nome ("CAFE PILAO TRAD 500G VACUO" → Café Pilão); novos produtos ganham emoji/categoria automaticamente
- Se a SEFAZ não responder (fora do ar, captcha, layout diferente), o app cai num fluxo de confirmação manual com a data da nota
- Histórico de notas lidas no Perfil + conexão (mock) com a Nota Fiscal Paulista

## Rodando

```bash
npm install
npm run server   # backend leve da NFC-e (porta 3001)
npm run dev      # frontend em desenvolvimento (http://localhost:5173, com proxy /api)

# produção: build + servidor único (estático + API)
npm start

npm test         # testes: parser da SEFAZ + smoke test do app (jsdom)
```

A câmera para leitura de QR Code exige HTTPS (ou localhost). Os dados do usuário ficam no `localStorage` do aparelho.

### Backend (`server/`)

- `GET /api/nfce?url=<URL do QR Code>` → `{ store, date, total, items: [{ name, qty, unit, unitPrice, total }] }`
- Só consulta hosts `.gov.br` de fazenda/SEFAZ (anti-SSRF), segue redirects validando cada salto, timeout de 12s
- `server/parser.js` entende o layout de consulta usado pela maioria das SEFAZs; estados com captcha ou layout próprio caem no fluxo manual do app

## Stack

- React 18 + Vite (frontend) · Node 22 puro + node-html-parser (backend)
- [jsQR](https://github.com/cozmo/jsQR) para decodificar QR Codes (com `BarcodeDetector` nativo quando disponível)
- Design system "Não Esqueci": verde `#22C55E`, Fraunces + DM Sans, neutros slate
