# Pipeline CI/CD

Fluxo: `feature/*` → `dev` (auto-merge com testes verdes) → `main` (aprovação humana + testes) → deploy automático na VPS via runner self-hosted.

Disparado por commit de teste da esteira.
