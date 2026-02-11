# PedeZap SaaS

Aplicacao Next.js (admin + painel restaurante + catalogo) com integracao de pagamentos.

## Requisitos

- Node.js 20+
- NPM

## Rodar local

1. Instale dependencias:
   - `npm install`
2. Crie `.env.local` (baseado em `.env.example`).
3. Rode:
   - `npm run dev`

## Build de producao

- `npm run build`
- `npm run start`

## Deploy no Render

O repositorio ja inclui `render.yaml`.

### 1) Subir no GitHub

- Commit/push do projeto atualizado.

### 2) Criar servico no Render

- Dashboard Render -> `New` -> `Blueprint` (ou `Web Service`).
- Se usar Blueprint, ele le `render.yaml` automaticamente.

### 3) Configurar variaveis de ambiente

Obrigatorias:

- `NEXT_PUBLIC_APP_URL` = URL publica do Render (ex: `https://seuapp.onrender.com`)
- `AUTH_SESSION_SECRET` = segredo longo e aleatorio
- `ABACATEPAY_API_KEY`
- `ABACATEPAY_PUBLIC_KEY`
- `ABACATEPAY_WEBHOOK_SECRET`

Opcional (persistencia do store):

- `STORE_FILE_PATH` = caminho absoluto do arquivo JSON (ex: `/var/data/store.json`)

Observacao: em plano gratuito, sem disco persistente, dados em arquivo podem ser perdidos em restart/redeploy.

### 4) Webhook AbacatePay

Depois do deploy, configure no painel AbacatePay:

- URL: `https://SEU-DOMINIO/api/webhooks/abacatepay`
- Secret: igual ao `ABACATEPAY_WEBHOOK_SECRET`
- Evento recomendado para assinatura: `billing.paid`

### 5) Acesso admin

- Login admin: `/admin/login`
- Login restaurante: `/master/login`

