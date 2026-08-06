# NaoEsqueci — Instruções para Claude Code

## O que é

App de consulta de NFC-e. Vite + React (front) e um servidor Node leve (`server/index.js`) num único
container, servindo o `dist/` estático mais `/api/nfce` e `/api/health` na porta 3001.

- **Domínio:** naoesqueci.forjadosdias.tech
- **Repo:** https://github.com/ForjaDosDias/NaoEsqueci2
- **Compose:** `/home/victor/Projetos/vps-infra/naoesqueci/` (não fica no repo da app)
- **Sem volume persistente** — o estado do usuário vive no `localStorage` do navegador
- **Sem variável obrigatória** (`PORT=3001` é opcional; a consulta usa os portais públicos da SEFAZ)

## Fluxo de trabalho e Git

> Regra da frota — idêntica nos 5 projetos da VPS. Atualizada em 2026-08-06.

**Todo trabalho começa por um plano.** Levantar o que já existe, decidir a abordagem e só então
implementar.

**Ao final de todo plano, sincronizar tudo:**
```bash
git add -A && git commit -m "tipo: descrição"
git push origin main        # push direto — é o fluxo atual
git push origin main:dev    # mantém a dev alinhada
```

⚠️ **Commitar ANTES de qualquer push.** Este diretório é o alvo do deploy: todo push na `main`
dispara o workflow, que faz `git reset --hard FETCH_HEAD` aqui. Qualquer alteração não commitada
é **destruída** — aconteceu em 06/08/2026 com uma edição de CLAUDE.md.

**Por que push direto na `main`:** nenhuma aplicação da VPS tem cliente hoje, e o gate de aprovação
humana do fluxo `feature → dev → main` só atrasa o desenvolvimento. Os `bypass_actors` de admin nos
rulesets são **intencionais**, não descuido.

**A `dev` é mantida em dia de propósito.** Ela não está em uso, mas fica idêntica à `main` para que
o fluxo com PR volte sem migração no dia em que houver cliente.

**Quando houver cliente:** remover os bypasses dos rulesets e voltar para `feature → dev → main` com
PR, check `test` verde e 1 aprovação humana. A esteira já está montada — só o bypass precisa sair.

Push na `main` dispara o deploy automático na VPS (self-hosted runner).

⚠️ **O checkout de produção está na branch `feature/auth-fixes`, não na `main`.** Como o deploy faz
`git reset --hard FETCH_HEAD` (que é sempre a `main`), cada deploy vem movendo o ponteiro dessa
branch local em silêncio. O conteúdo está idêntico à `main` — não há trabalho perdido —, mas vale
`git checkout main` aqui para parar de sujar a branch.
