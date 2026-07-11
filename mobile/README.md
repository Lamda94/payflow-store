# PayFlow Store — Mobile

Credit card payment checkout app built with React Native (bare CLI) + TypeScript + Redux Toolkit.

**Stack**: React Native 0.86 · TypeScript · Redux Toolkit · redux-persist (AES encrypted) · Jest + React Native Testing Library  
**Architecture**: Layered (domain → store → services → ui)

---

## Arquitectura por capas

```
mobile/src/
├── domain/            # TypeScript puro — sin React, sin Redux, sin llamadas de red
│   ├── card/          # Luhn, detección de marca (Visa/Mastercard), expiración, CVC, formateo
│   ├── money.ts       # formatMoney(amountInCents, currency) → string UI
│   ├── email.ts       # validación de e-mail
│   └── types.ts       # tipos compartidos (Product, CartItem, TransactionRecord)
├── store/             # Redux Toolkit (Flux estricto: action → reducer → selector → UI)
│   ├── slices/        # productsSlice · cartSlice · checkoutSlice · transactionSlice
│   ├── persist/       # encryptedTransform (AES-CryptoJS) + keychain (Keychain/Keystore)
│   └── index.ts       # createAppStore / initStore
├── services/          # Cliente HTTP — único lugar con fetch(); invocado solo desde thunks
│   ├── httpApi.ts     # implementación real contra el backend desplegado
│   └── api.ts         # interfaz PayflowApi + notImplementedApi (para tests)
└── ui/
    ├── screens/       # SplashScreen · HomeScreen · ProductDetailScreen · CheckoutScreen
    ├── components/    # Backdrop · CardInfoForm · PaymentSummaryView · PaymentResultView
    │                  # ProductCard · QuantityStepper · LabeledInput · Toast · ErrorBoundary
    └── theme/         # colors · spacing · typography (tokens centralizados, sin hardcode)
```

**Regla de dependencias**: `ui → store → domain` y `services` solo desde thunks del store.  
`domain/` no importa React, RN ni Redux; testeable en puro Jest sin render.

---

## Flujo de la app

```
Splash → Home (catálogo) → Detalle del producto (cantidad) →
Checkout (resumen + backdrop) → Card Info → Payment Summary →
Processing → Resultado (APPROVED / DECLINED)
```

- El backdrop (pantalla 4–6) implementa el patrón Material Design de capa trasera/delantera deslizable.
- El estado de cada transacción se persiste encriptado; si la app cierra con un pago PENDING, al reabrir retoma el polling automáticamente.
- Los datos de tarjeta viven **solo en memoria** (`checkoutSlice`, en blacklist de persist). Nunca se persisten ni se loguean.

---

## Correr la app

### Requisitos

- Node 22, JDK 17, Android SDK / Xcode (según plataforma)
- Metro bundler

```bash
cd mobile
npm ci
npm start          # arranca Metro en una terminal
```

En otra terminal:

```bash
npm run android    # conectar dispositivo o emulador primero
# npm run ios      # solo macOS con Xcode
```

### Apuntar al backend local

Editar `mobile/src/services/config.ts`:

```ts
export const API_BASE_URL = 'http://10.0.2.2:3000'; // emulador Android
// export const API_BASE_URL = 'http://localhost:3000'; // iOS simulator
```

Por defecto apunta al backend desplegado en producción.

---

## Tests

```bash
cd mobile
npm test              # suite completa (unit + componentes)
npm run test:cov      # con reporte de cobertura (umbral global ≥ 80%)
```

### Resultados de cobertura

| Métrica | Umbral | Resultado |
|---------|--------|-----------|
| Statements | 80% | > 96% |
| Branches | 80% | > 87% |
| Functions | 80% | > 94% |
| Lines | 80% | > 96% |

Cobertura por capa (última ejecución en CI):

| Capa | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| `domain/` | 100% | 100% | 100% | 100% |
| `domain/card/` | 100% | 100% | 100% | 100% |
| `store/slices/` | 100% | 100% | 100% | 100% |
| `store/persist/` | 100% | 100% | 100% | 100% |
| `navigation/` | 100% | 100% | 100% | 100% |
| `ui/theme/` | 100% | 100% | 100% | 100% |
| `ui/screens/` | 98.4% | 97.2% | 94.7% | 98.4% |
| `ui/components/` | 96.8% | 88.0% | 97.1% | 96.8% |
| `services/` | 96.3% | 100% | 90.9% | 100% |
| `store/` | 100% | 88.9% | 100% | 100% |

Reporte completo disponible en `mobile/coverage/` tras ejecutar `npm run test:cov`.  
El umbral está configurado en `jest.config.js` y el CI falla si baja del 80%.

### Qué se testea

| Capa | Tests |
|------|-------|
| `domain/card/` | Luhn (válidos + inválidos), detección Visa/Mastercard, expiración, CVC, formateo |
| `domain/` | `formatMoney`, validación de e-mail |
| `store/slices/` | Todos los reducers y thunks con mock de `PayflowApi` |
| `store/persist/` | `encryptedTransform` (encrypt/decrypt), `keychain` (get/create key) |
| `store/` | `initStore`, `StoreProvider`, ciclo completo de pago |
| `services/` | `httpApi` (fetch real con mocks), `api` (contrato) |
| `ui/components/` | Backdrop, CardInfoForm, CardBrandLogo, LabeledInput, PaymentProcessingView, PaymentResultView, PaymentSummaryView, ProductCard, QuantityStepper, Toast, ErrorBoundary |
| `ui/screens/` | HomeScreen, ProductDetailScreen, CheckoutScreen, SplashScreen |
| `navigation/` | RootNavigator |

---

## Tarjetas de prueba (sandbox)

Resultados verificados contra el sandbox del proveedor de pagos (vía el backend desplegado):

| Número | Marca | Resultado |
|--------|-------|-----------|
| `4242 4242 4242 4242` | Visa | APPROVED |
| `4111 1111 1111 1111` | Visa | DECLINED |
| `5555 5555 5555 4444` | Mastercard | ERROR (el sandbox solo procesa los números Visa de prueba) |

Titular: cualquier nombre · CVC: cualquier 3 dígitos · Expiración: cualquier fecha futura.

> El pago (`POST /transactions/:id/pay`) hace polling síncrono al PSP y tarda
> **7–20 s** en sandbox — la app usa un timeout extendido (`PAY_REQUEST_TIMEOUT_MS`)
> solo para esa llamada. Si una respuesta se pierde igualmente, el siguiente
> intento recibe `409 TRANSACTION_ALREADY_PROCESSED` y la app recupera el
> resultado real con `GET /transactions/:id` en lugar de mostrar un error.

---

## Build Android

### Debug (CI en cada PR)

```bash
cd mobile/android
./gradlew assembleDebug --no-daemon
# APK en: app/build/outputs/apk/debug/app-debug.apk
```

### Release (firmado)

Requiere generar un keystore de release y configurar las variables de entorno:

```bash
# 1. Generar keystore (una sola vez)
keytool -genkey -v -keystore release.keystore -alias payflow \
  -keyalg RSA -keysize 2048 -validity 10000

# 2. Codificar en base64 y agregar como GitHub Secret ANDROID_KEYSTORE_BASE64
base64 -i release.keystore | pbcopy   # macOS
# también agregar: ANDROID_STORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD

# 3. Build local
ANDROID_KEYSTORE_PATH=./release.keystore \
ANDROID_STORE_PASSWORD=... \
ANDROID_KEY_ALIAS=payflow \
ANDROID_KEY_PASSWORD=... \
./gradlew assembleRelease --no-daemon
# APK en: app/build/outputs/apk/release/app-release.apk
```

En CI (push a `main`), el job `android-release` lo construye automáticamente usando los GitHub Secrets y publica el APK como artifact.

---

## Decisiones de arquitectura

| Decisión | Motivo |
|----------|--------|
| **Redux Toolkit + redux-persist** | Requisito explícito del enunciado. persist para restaurar carrito y transacción en curso si la app cierra |
| **Whitelist `['cart','transaction']`** | `checkoutSlice` (datos de tarjeta) en blacklist siempre — refuerza que los datos de tarjeta nunca se almacenan |
| **AES + Keychain/Keystore** | Requisito explícito de persist encriptado. Llave guardada en el Keychain del dispositivo |
| **`notImplementedApi` en tests** | Permite testear slices y store sin HTTP real; cada test inyecta su propio mock via `createAppStore(key, mockApi)` |
| **Luhn en `domain/`** | Validación pura en TypeScript — cero dependencias de UI o red, testeable al 100% |
| **`__DEV__` en ErrorBoundary** | El stack trace solo se loguea en desarrollo; en producción la UI muestra un mensaje genérico |
| **`shadowColor` en `colors.shadow`** | Token de tema para evitar literales hardcodeados en componentes |
| **Timeout de pago de 65 s** | El `/pay` tarda 7–20 s (polling síncrono al PSP); debe superar el timeout del reverse proxy (60 s) para que el cliente nunca abandone antes que el servidor. Con 15 s la app abortaba mientras el backend finalizaba el pago igual |
| **Recuperación de `TRANSACTION_ALREADY_PROCESSED`** | Si el resultado de un pago se pierde (timeout), la transacción quedó finalizada en el backend; ante el 409 la app consulta el estado real y muestra el resultado en vez de dejar al usuario en bucle sobre el botón Pay |
