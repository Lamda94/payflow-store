# payflow-store

Prueba técnica — tienda con checkout de pago con tarjeta de crédito.

**Stack**: NestJS 11 · TypeScript · TypeORM · PostgreSQL · React Native 0.86 · Redux Toolkit  
**Arquitectura**: Hexagonal (Ports & Adapters) en backend · capas `domain → store → services → ui` en mobile  
**Deploy**: VPS OVH · Docker Compose · Cloudflare Full TLS · GHCR · GitHub Actions  
**APK firmado listo para instalar**: [`mobile/app-release.apk`](mobile/app-release.apk)

---

## Arquitectura hexagonal del backend

```
src/
├── domain/                  ← cero dependencias externas
│   ├── entities/            Product · Transaction · Delivery
│   ├── value-objects/       Money (enteros en centavos, nunca floats)
│   ├── errors/              errores de dominio tipados
│   └── ports/               ProductRepository · TransactionRepository
│                            DeliveryRepository · PaymentGateway · IdGenerator
├── application/
│   └── use-cases/           ListProducts · CreateTransaction
│                            ProcessPayment · GetTransactionStatus
└── infrastructure/
    ├── http/                controllers · DTOs (class-validator + Luhn) · exception filter
    ├── persistence/         entidades TypeORM · mappers dominio↔ORM · migraciones
    ├── psp/                 adaptador HTTP del proveedor de pagos
    └── id/                  UuidIdGenerator (crypto.randomUUID)
```

Regla de dependencias: `infrastructure → application → domain`. Nunca al revés.  
Reforzado en tiempo de lint con `eslint-plugin-import/no-restricted-paths`.

---

## Endpoints

Documentación interactiva (Swagger UI): **[`/docs`](https://payflow.luismendezdev.online/docs)** — spec OpenAPI en `/docs-json`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Healthcheck |
| `GET` | `/products` | Catálogo con stock disponible |
| `POST` | `/transactions` | Crea transacción PENDING |
| `POST` | `/transactions/:id/pay` | Procesa pago con tarjeta |
| `GET` | `/transactions/:id` | Consulta estado actual |

### POST /transactions
```json
{
  "productId": "uuid",
  "quantity": 1,
  "customerEmail": "user@example.com"
}
```
Respuesta `201`:
```json
{
  "transactionId": "uuid",
  "reference": "uuid",
  "amountInCents": 199900,
  "currency": "COP"
}
```

### POST /transactions/:id/pay
```json
{
  "cardNumber": "4111111111111111",
  "holderName": "John Doe",
  "expirationMonth": "12",
  "expirationYear": "2030",
  "cvc": "123",
  "installments": 1
}
```
Los datos de tarjeta nunca se persisten ni se loguean — solo pasan en memoria al proveedor de pagos.

Respuesta de error unificada:
```json
{ "code": "INSUFFICIENT_STOCK", "message": "Insufficient stock: requested 3, available 1" }
```

Códigos de error:

| code | HTTP | Causa |
|------|------|-------|
| `PRODUCT_NOT_FOUND` | 404 | productId no existe |
| `TRANSACTION_NOT_FOUND` | 404 | transactionId no existe |
| `INSUFFICIENT_STOCK` | 422 | stock menor que quantity |
| `TRANSACTION_ALREADY_PROCESSED` | 409 | transacción ya tiene estado final |
| `PAYMENT_GATEWAY_ERROR` | 502 | proveedor de pagos no disponible |

---

## Correr local

### Requisitos
- Docker + Docker Compose

```bash
cp backend/.env.example backend/.env
# completar backend/.env con las llaves sandbox del proveedor de pagos

docker compose -f backend/docker-compose.yml up -d
# API disponible en http://localhost:3000

# Correr migraciones (primera vez)
docker compose -f backend/docker-compose.yml exec api npm run migration:run
```

El servicio `api` levanta con hot-reload. Cualquier cambio en `src/` recarga automáticamente.

---

## Tests

```bash
cd backend
npm ci
npm test              # unit tests (121 tests)
npm run test:cov      # cobertura con umbral global >= 80%
```

### E2E (flujo completo con PSP mockeado)

Requiere un PostgreSQL alcanzable (en CI corre contra un service container efímero):

```bash
docker run -d --rm --name payflow_e2e_pg \
  -e POSTGRES_DB=payflow_e2e -e POSTGRES_USER=payflow \
  -e POSTGRES_HOST_AUTH_METHOD=trust -p 5439:5432 postgres:16-alpine

DB_HOST=localhost DB_PORT=5439 DB_NAME=payflow_e2e DB_USER=payflow DB_PASSWORD= \
  npm run test:e2e

docker stop payflow_e2e_pg
```

### Resultados de cobertura (121 tests unit + 8 e2e)

| Métrica | Umbral | Resultado |
|---------|--------|-----------|
| Statements | 80% | 98.52% |
| Branches | 80% | 88.63% |
| Functions | 80% | 98.82% |
| Lines | 80% | 98.44% |

Reporte completo disponible en `backend/coverage/` tras ejecutar `npm run test:cov`.
El umbral está configurado en Jest y el CI falla si baja del 80%.

---

## Variables de entorno

Ver `backend/.env.example` para la lista completa.

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto de la API (default: 3000) |
| `NODE_ENV` | `development` / `production` |
| `DB_HOST` | Host de PostgreSQL |
| `DB_PORT` | Puerto (default: 5432) |
| `DB_NAME` | Nombre de la base de datos |
| `DB_USER` | Usuario |
| `DB_PASSWORD` | Contraseña |
| `PSP_API_URL` | URL base del proveedor de pagos |
| `PSP_PUBLIC_KEY` | Llave pública (tokenización de tarjeta) |
| `PSP_PRIVATE_KEY` | Llave privada (crear transacciones) |
| `PSP_INTEGRITY_KEY` | Llave de integridad (firma SHA256) |

---

## CI/CD

| Workflow | Trigger | Pasos |
|----------|---------|-------|
| `backend.yml` | PR/push en `backend/**` | lint → test:cov → upload artifact · e2e contra postgres efímero |
| `deploy.yml` | push a `main` en `backend/**` | lint+tests → build Docker → push GHCR → SSH VPS → sync infra → migraciones → `up -d` |

### Secretos de GitHub necesarios

| Secreto | Uso |
|---------|-----|
| `VPS_HOST` | Host del servidor de deploy |
| `VPS_PORT` | Puerto SSH |
| `VPS_USER` | Usuario SSH de deploy |
| `VPS_SSH_KEY` | Clave privada SSH |

`GITHUB_TOKEN` se usa automáticamente para autenticarse en GHCR.

---

## Despliegue en producción

**API en vivo**: [`https://payflow.luismendezdev.online`](https://payflow.luismendezdev.online/health) — Swagger UI en [`/docs`](https://payflow.luismendezdev.online/docs).

Arquitectura de alto nivel:

```
Cliente → Cloudflare (TLS + proxy) → nginx (reverse proxy) → API (contenedor Docker)
                                                              └→ PostgreSQL (contenedor, sin puertos publicados)
```

- API y base de datos corren en contenedores Docker sin puertos expuestos al exterior; solo nginx enruta hacia la API.
- Los deploys son automáticos vía GitHub Actions en cada push a `main` con cambios en `backend/**`: build de imagen → push a GHCR → sincronización al servidor → migraciones → recreación del servicio.
- Las llaves del PSP y credenciales de base de datos viven únicamente en el `.env` del servidor y en GitHub Secrets — nunca en el repositorio.

## Mobile

React Native (bare CLI) + Redux Toolkit + redux-persist encriptado (AES + Keychain/Keystore). Documentación completa en [`mobile/README.md`](mobile/README.md).

**Flujo**: Splash → Home (catálogo) → Detalle del producto → Checkout con backdrop → Card Info → Payment Summary → Resultado con recibo completo. Además: historial de compras persistido encriptado (accesible desde el header del Home) y recuperación automática de pagos interrumpidos.

**Cobertura**: 209 tests · 98.32% statements / 93.16% branches (umbral ≥ 80%; detalle por capa en el README de mobile).

| Workflow | Trigger | Pasos |
|----------|---------|-------|
| `mobile.yml` | PR/push en `mobile/**` | lint → test:cov (umbral ≥ 80%) · assembleDebug |
| `mobile.yml` | push a `main` | + assembleRelease firmado (requiere secrets de keystore) |

El APK release firmado está commiteado en [`mobile/app-release.apk`](mobile/app-release.apk) listo para instalar,
y además se genera en CI como artifact en cada run de `main`.
