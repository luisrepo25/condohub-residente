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

## Estado (31/10/2026)

Remoto React (contenedor de Module Federation que expone `./remote`, con su propio React; `Dockerfile` con nginx y CI) con cinco pestañas, cada una una feature en capas (`docs/arquitectura/frontends.md`):

- **Mis unidades** (F1): `miPerfil`.
- **Estado de cuenta** (`features/cuenta`, F1, F4, F7): `estadoDeCuenta` de Gestión; los montos se muestran como texto decimal, sin operarlos.
- **Pagar** (`features/pagos`, F8, F9, O1–O4): foto del comprobante → **OCR local con Tesseract.js** (IA local en el frontend web; la librería y el idioma `eng` se cargan al leer la primera foto, no al montar) → `domain/comprobante.ts` extrae monto, fecha y banco (solo prellena) → el residente revisa → `validarPago` (monto decimal positivo, fecha no futura) → la operación se guarda en **IndexedDB antes de enviarse** (`src/offline/`, con su `Idempotency-Key` UUID v4 y la hora del dispositivo) y se envía con `registrarPago`. Solo una respuesta 2xx la marca sincronizada; sin red, 5xx o `INTERNAL_ERROR` sigue pendiente **con la misma clave** y se reintenta al volver la conexión (`online`) y con espera exponencial (1 s a 5 min); una regla violada (F8...) la rechaza con su código. El pago nace `PENDIENTE`: confirmarlo es del ADMIN (F9).
- **Reservar** (`features/reservas`, R1–R8, S1, O1, O3): áreas de Reservas, formulario de día y horas del dispositivo (se envían en UTC) con invitados, y la lista de reservas con su estado. La solicitud lleva `Idempotency-Key` (la misma si se reintenta con los mismos datos); la saga se sigue consultando cada 3 s mientras la reserva está `SOLICITADA` hasta `CONFIRMADA` o `FALLIDA` (con su motivo). Las reglas R2–R4 y F1 las decide Reservas y se muestran con su código en un mensaje legible; cancelar solo aparece en `CONFIRMADA` (R7, R8) y manda la `version` (O5). Reservar necesita red (O6): sin conexión se avisa y no se encola. Verificado en Chrome contra el sistema local: R3 rechazada con mensaje claro, reserva con invitados `CONFIRMADA` en ~5 s y luego cancelada.
- **Anunciar visita** (`features/visitas`, A1): pase QR.

Verificado en Chrome contra el sistema local: el OCR leyó un comprobante generado (monto, fecha, banco) en ~2 s; sin red el pago quedó «Esperando conexión» y al reconectar se envió con la misma clave (1 sola fila `PENDIENTE` en la BD). 70 pruebas con Vitest.

**Limitaciones:** el idioma del OCR (`eng`) y el motor wasm se descargan del CDN de Tesseract la primera vez, así que **leer la primera foto necesita red** salvo que un service worker los guarde (pendiente, PWA); Gestión no recibe la imagen del comprobante (`registrarPago` solo lleva monto, fecha y banco). **Falta:** service worker y manifest de la PWA, historial de pagos del servidor. Cómo correrlo y su contrato con el shell: `README.md`.

## Código funcional protegido (obligatorio)

Código en `main` con tests en verde **no se reescribe, refactoriza, renombra ni reformatea** si la tarea no lo pide explícitamente. Lo nuevo se agrega extendiendo (clases, métodos o archivos nuevos). Si es inevitable tocar código funcional, **detente antes de editar**, explica qué archivo/líneas y por qué, y espera confirmación; luego haz el mínimo diff. Nunca edites tests existentes para que pase código nuevo. Corre los tests antes y después: todo lo que pasaba debe seguir pasando. En el resumen, lista cada archivo existente que modificaste.
