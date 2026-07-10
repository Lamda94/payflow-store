# payflow-store

Prueba técnica — tienda con checkout de pago con tarjeta de crédito.

**Stack**: NestJS 11 · TypeScript · TypeORM · PostgreSQL · React Native (próximamente)  
**Arquitectura**: Hexagonal (Ports & Adapters)  
**Deploy**: VPS OVH · Docker Compose · Cloudflare Full Strict TLS · GHCR · GitHub Actions

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
npm test              # unit tests (113 tests)
npm run test:cov      # cobertura con umbral global >= 80%
```

### Resultados de cobertura

| Métrica | Umbral | Resultado |
|---------|--------|-----------|
| Statements | 80% | > 80% |
| Branches | 80% | > 80% |
| Functions | 80% | > 80% |
| Lines | 80% | > 80% |

Reporte completo disponible en `backend/coverage/` tras ejecutar `npm run test:cov`.

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
| `backend.yml` | PR/push en `backend/**` | lint → test:cov → upload artifact |
| `deploy.yml` | push a `main` en `backend/**` | build Docker → push GHCR → SSH VPS → migraciones → `up -d` |

### Secretos de GitHub necesarios

| Secreto | Uso |
|---------|-----|
| `VPS_HOST` | IP del VPS OVH |
| `VPS_USER` | Usuario SSH de deploy |
| `VPS_SSH_KEY` | Clave privada SSH (ED25519) |

`GITHUB_TOKEN` se usa automáticamente para autenticarse en GHCR.

---

## Setup inicial en el VPS

```bash
# 1. Clonar el repo
git clone https://github.com/Lamda94/payflow-store.git ~/payflow-store
cd ~/payflow-store

# 2. Variables de entorno de produccion
cp backend/.env.example .env
nano .env   # completar con valores reales

# 3. Certificado de origen Cloudflare (Full Strict TLS)
mkdir -p certs
# copiar origin.pem y origin.key (generados en el dashboard de Cloudflare)

# 4. Editar Caddyfile: reemplazar TU_DOMINIO por el dominio real

# 5. Primer arranque
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml run --rm api npm run migration:run
```

A partir del primer setup, los deploys son automaticos via GitHub Actions al hacer push a `main`.

---

## Mobile

_Modulo React Native + Redux — en desarrollo._
