# PedeZap SaaS

Aplicacao Next.js (admin + painel restaurante + catalogo) com Stripe + Neon.

## Requisitos

- Node.js 20+
- NPM
- Banco Postgres (Neon recomendado)

## Rodar local

1. Instale dependencias: `npm install`
2. Crie `.env.local` com base em `.env.example`
3. Defina `DATABASE_URL` (Neon)
4. Execute schema no banco: `npx prisma db push`
5. Rode: `npm run dev`

## Build de producao

- `npm run build`
- `npm run start`

## Deploy no Render

O repositorio inclui `render.yaml`.

### 1) Subir no GitHub

- Commit/push do projeto atualizado.

### 2) Criar servico no Render

- Render -> `New` -> `Blueprint`
- Selecione o repo para ler o `render.yaml`

### 3) Configurar variaveis de ambiente

Obrigatorias:

- `DATABASE_URL` (Neon Postgres)
- `NEXT_PUBLIC_APP_URL` (ex: `https://pedezap.site`)
- `AUTH_SESSION_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `LEADS_NOTIFY_EMAIL` (ex: `support@pedezap.site`)
- `LEADS_FROM_EMAIL` (dominio validado no Resend)

Legado/opcional:

- `ABACATEPAY_API_KEY`
- `ABACATEPAY_PUBLIC_KEY`
- `ABACATEPAY_WEBHOOK_SECRET`

### 4) Webhooks

- Stripe: `https://SEU-DOMINIO/api/webhooks/stripe`
- AbacatePay (legado): `https://SEU-DOMINIO/api/webhooks/abacatepay`

### 5) Acessos

- Admin: `/awserver/login`
- Restaurante: `/master/login`
