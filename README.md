# BellaAgenda — Backend API

API REST para agendamento de salões de beleza (Node.js + Express + PostgreSQL + Firebase Auth + Stripe).

## Requisitos

- Node.js 20+
- PostgreSQL 16+

## Configuração local

```bash
cp .env.example .env
npm install
npm run migrate
npm start
```

A API fica em `http://localhost:3000/api`.

## Docker Compose (backend completo)

Sobe PostgreSQL 16 + API com migrations automáticas.

```bash
cp .env.example .env
```

No `.env`, use `DATABASE_URL=postgresql://bella:bella@postgres:5432/bellaagenda` para o Compose (o `docker-compose.yml` já define essa variável no serviço `api`; o `.env` serve para Firebase, Stripe e demais credenciais).

```bash
npm run docker:up
```

Comandos úteis:

| Comando | Descrição |
|---------|-----------|
| `npm run docker:up` | Sobe postgres + api (foreground) |
| `npm run docker:up:detached` | Sobe em segundo plano |
| `npm run docker:down` | Para e remove containers |
| `npm run docker:logs` | Acompanha logs da API |

Serviços:

| Serviço | URL / porta |
|---------|-------------|
| API | http://localhost:3000/api |
| PostgreSQL | localhost:5432 (user `bella`, senha `bella`, db `bellaagenda`) |

O container `api` aguarda o Postgres ficar saudável, executa `npm run migrate` e inicia o servidor.

Variáveis opcionais de Firebase e Stripe podem ser definidas no `.env` (montado via `env_file`). Rotas públicas como `GET /api/health` e `GET /api/services` funcionam sem essas credenciais.

## Variáveis de ambiente

Ver `.env.example`. Em produção (Vercel), configure `DATABASE_URL`, credenciais Firebase (service account), Stripe e `CORS_ORIGIN` (URL do frontend).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm start` | Servidor local |
| `npm test` | Testes (usa `bellaagenda_test`, não o banco de desenvolvimento) |
| `npm run migrate` | Aplica migrations SQL |
| `npm run lint` | Verificação de sintaxe |
| `npm run docker:up` | Sobe postgres + API via Docker Compose |
| `npm run docker:down` | Para containers do Compose |

## Rotas principais

| Método | Rota | Papel |
|--------|------|-------|
| GET | `/api/health` | Público |
| POST | `/api/auth/sync` | Autenticado (Firebase) |
| GET | `/api/auth/me` | Autenticado |
| GET/POST | `/api/services` | Lista / admin CRUD |
| GET/POST | `/api/professionals` | Lista / admin |
| GET | `/api/appointments/availability` | Autenticado |
| POST | `/api/appointments` | Cliente |
| POST | `/api/payments/checkout` | Cliente |
| POST | `/api/payments/webhook` | Stripe |
| GET | `/api/reports/summary` | Admin |

Envie `Authorization: Bearer <firebase_id_token>` nas rotas protegidas.

## Deploy (Vercel)

- Root Directory: `backend`
- Variáveis de ambiente conforme `.env.example`
- Webhook Stripe: `https://<seu-projeto>.vercel.app/api/payments/webhook`

## Postman

Importe a collection em `postman/BellaAgenda.postman_collection.json`.

Configure as variáveis `baseUrl` (padrão `http://localhost:3000/api`) e `firebaseToken` (ID token do Firebase) antes de testar rotas autenticadas.

## Testes e banco de dados

`npm test` **apaga e recria dados** no banco de teste (`bellaagenda_test` por padrão). Não usa o banco `bellaagenda` de desenvolvimento.

Crie o banco de teste uma vez:

```bash
docker exec -it bellaagenda-postgres psql -U bella -d bellaagenda -c "CREATE DATABASE bellaagenda_test;"
cp .env.test.example .env.test
npm run migrate
DATABASE_URL=postgresql://bella:bella@127.0.0.1:5432/bellaagenda_test npm run migrate
npm test
```

## CI

GitHub Actions em `.github/workflows/ci.yml` — testes com PostgreSQL em container.
