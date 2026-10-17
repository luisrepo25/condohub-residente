# CLAUDE.md — condohub-residente

**Portal del residente** de CondoHub: PWA React para el rol `RESIDENTE`, con **IA local** (OCR del comprobante de pago en el navegador) y **envío offline idempotente**. Responsable: **Aldana**.

## Stack

React 18 · Vite · TypeScript · vite-plugin-pwa (Workbox) · Tesseract.js (OCR en Web Worker) · Dexie (IndexedDB) · Apollo Client (Gestión) · fetch para Reservas/Acceso · Module Federation (remoto del shell) · Vitest · Playwright.

## Funciones

| Función | Backend | Reglas |
|---|---|---|
| Estado de cuenta y recibos | Gestión GraphQL | F1, F7 |
| Pagar: foto del comprobante → OCR local → revisar → enviar (o encolar sin red) | Gestión `registrarPago` | F8, F9, O1–O4 |
| Reservar área común, cancelar | Reservas | R2, R3, R7 (crear reserva requiere red: O6) |
| Registrar visitas y compartir pase QR | Acceso | A1 |
| Consentimiento facial (dar / retirar) | Servicio IA | I1 |

## Offline e IA local

- OCR: Tesseract.js con el idioma `spa` cacheado por el service worker; extrae monto, fecha y banco con expresiones regulares y **prellena** el formulario. El residente siempre revisa antes de enviar.
- Cola en IndexedDB (`operacionesPendientes`): `{ idempotencyKey: uuid v4, tipo, payload, creadaEn, intentos, estado }`. La clave se genera **una vez** al crear la operación y nunca cambia en los reintentos.
- Envío con Background Sync (o al recuperar `online` si el navegador no lo soporta), backoff exponencial. Se marca `SINCRONIZADA` solo con 2xx.
- La UI muestra el pago como **"Pendiente de envío"** o **"Pendiente de confirmación"**, nunca como pagado (F9).

## Estructura

```
src/
├── features/      # cuenta/, pagos/, reservas/, visitas/, consentimiento/
├── offline/       # db.ts (Dexie), cola.ts, sync.ts
├── ocr/           # worker y extractores de monto/fecha/banco
├── api/           # clientes con token del shell
└── sw.ts          # service worker
```

## Comandos

```bash
npm install
npm run dev          # puerto 5174
npm run test
npm run e2e          # Playwright: incluye prueba en modo offline
npm run build && npm run preview   # el service worker solo se prueba en build
```

## Convenciones

- Test obligatorio: enviar la misma operación dos veces (simular reintento) produce un solo pago.
- No guardar la foto del comprobante más tiempo del necesario en IndexedDB; se borra al sincronizar.

## Estado (16/10/2026)

Esqueleto: módulo ES con `mount`/`unmount` que muestra la sesión y consulta `miPerfil` a Gestión (React + Vite, 3 tests, `Dockerfile` con nginx, CI en GitHub Actions). **Faltan todas las pantallas y funciones de este documento.** Cómo correrlo y su contrato con el shell: `README.md`.

## Código funcional protegido (obligatorio)

Código en `main` con tests en verde **no se reescribe, refactoriza, renombra ni reformatea** si la tarea no lo pide explícitamente. Lo nuevo se agrega extendiendo (clases, métodos o archivos nuevos). Si es inevitable tocar código funcional, **detente antes de editar**, explica qué archivo/líneas y por qué, y espera confirmación; luego haz el mínimo diff. Nunca edites tests existentes para que pase código nuevo. Corre los tests antes y después: todo lo que pasaba debe seguir pasando. En el resumen, lista cada archivo existente que modificaste.
