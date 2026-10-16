# condohub-residente

Micro frontend **residente** de CondoHub (Portal del residente, rol `RESIDENTE`). Responsable: Aldana. Reglas y stack previsto: ver `CLAUDE.md`.

Este es el **esqueleto**: el shell lo monta con `mount(el, { getToken, user })` y la pantalla solo confirma que el login llega a Gestión (consulta `miPerfil`). Las funciones del `CLAUDE.md` se agregan encima.

## Cómo correrlo

```bash
npm install
npm run dev        # compila y sirve assets/remoteEntry.js en http://localhost:5174/assets/remoteEntry.js
npm test
npm run build
```

Para verlo en el navegador, levanta además el shell (`frontends/shell`, puerto 5173), la infraestructura (`docker compose -f infra/docker-compose.yml up -d`) y Gestión, e inicia sesión con un usuario de rol `RESIDENTE`. Si el 8080 está ocupado, copia `.env.example` a `.env` y cambia `VITE_GATEWAY_URL` (p. ej. `http://localhost:8090`) antes de compilar.

## Contrato con el shell

El build es un módulo ES (`src/remote.tsx`) que exporta `mount(el, contexto)` y `unmount(el)`; el shell lo carga con `import(url)` desde `VITE_REMOTE_*`. React va incluido en el módulo (no se comparte). Cuando se adopte Module Federation real, solo cambia `vite.config.ts`; `mount`/`unmount` y la pantalla siguen igual.