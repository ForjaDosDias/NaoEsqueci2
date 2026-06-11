# Não Esqueci — Lista Inteligente

Lista de compras que te lembra do que está acabando. Um clone do Listonic com dois diferenciais:

1. **Previsão automática de estoque** — você marca quando compra e o app estima quando cada produto vai acabar. A partir da 2ª compra ele aprende seu ritmo real (média móvel dos intervalos entre compras) e ajusta a previsão sozinho.
2. **Leitura de QR Code da nota fiscal (NFC-e)** — escaneie o cupom fiscal com a câmera e registre a compra inteira de uma vez. O app extrai a chave de acesso, a UF e o valor da nota direto do QR Code.

## O loop do usuário

1. **Comprou** → registra com 1 toque (a data é salva) ou escaneando a nota
2. O app **estima quando acaba** (status: em dia · acabando · acabou)
3. **Avisa** e pré-popula a próxima lista de compras automaticamente

## Telas

- **Cadastro e Login** — e-mail/senha, Google e modo demo com dados de exemplo
- **Despensa (home)** — resumo, seção "Atenção" com botões *Adicionar à lista* / *Ainda tenho*, itens em dia com barra de nível
- **Cadastro de produto** — simplificado estilo Listonic: autocomplete do catálogo preenche tudo com 1 toque; detalhes são opcionais
- **Comprei** — marcação de compra com 1 toque + atalho para o scanner
- **Escanear nota (NFC-e)** — câmera real (BarcodeDetector ou jsQR), parser da chave de acesso, confirmação dos itens e modo "simular leitura" para testar sem cupom
- **Armário** — preencha o que já tem em casa para a previsão começar hoje
- **Status dos itens** — filtros Acabou / Acabando / Em dia
- **Lista de compras** — itens *sugeridos pela previsão* vs *adicionados por você*; "Finalizei as compras" reinicia as previsões
- **Perfil** — conexão com a Nota Fiscal Paulista, histórico de notas lidas, estilo dos alertas (cartões / compacto / banner)

## Rodando

```bash
npm install
npm run dev      # desenvolvimento (http://localhost:5173)
npm run build    # produção (dist/)
npm test         # smoke test (jsdom, sem browser)
```

A câmera para leitura de QR Code exige HTTPS (ou localhost). Os dados ficam no `localStorage` do aparelho — sem backend.

> Sem backend, o portal da SEFAZ não pode ser consultado para puxar os itens da nota (CORS); após ler a chave, o app pede confirmação dos itens comprados. A integração futura com a Nota Fiscal Paulista resolveria isso server-side.

## Stack

- React 18 + Vite
- [jsQR](https://github.com/cozmo/jsQR) para decodificar QR Codes (com `BarcodeDetector` nativo quando disponível)
- Design system "Não Esqueci": verde `#22C55E`, Fraunces + DM Sans, neutros slate
