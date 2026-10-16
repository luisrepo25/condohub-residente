# condohub-residente

Micro frontend **residente** de CondoHub (Portal del residente, rol `RESIDENTE`). Responsable: Aldana. Reglas y stack previsto: ver `CLAUDE.md`.

Este es el **esqueleto**: el shell lo monta con `mount(el, { getToken, user })` y la pantalla solo confirma que el login llega a GestiÃ³n (consulta `miPerfil`). Las funciones del `CLAUDE.md` se agregan encima.

## CÃ³mo correrlo

```bash
npm install
npm run dev        # compila y sirve assets/remoteEntry.js en http://localhost:5174/assets/remoteEntry.js
npm test
npm run build
```

Para verlo en el navegador, levanta ademÃ¡s el shell (`frontends/shell`, puerto 5173), la infraestructura (`docker compose -f infra/docker-compose.yml up -d`) y GestiÃ³n, e inicia sesiÃ³n con un usuario de rol `RESIDENTE`. Si el 8080 estÃ¡ ocupado, copia `.env.example` a `.env` y cambia `VITE_GATEWAY_URL` (p. ej. `http://localhost:8090`) antes de compilar.

## Contrato con el shell

El build es un mÃ³dulo ES (`src/remote.tsx`) que exporta `mount(el, contexto)` y `unmount(el)`; el shell lo carga con `import(url)` desde `VITE_REMOTE_*`. React va incluido en el mÃ³dulo (no se comparte). Cuando se adopte Module Federation real, solo cambia `vite.config.ts`; `mount`/`unmount` y la pantalla siguen igual.