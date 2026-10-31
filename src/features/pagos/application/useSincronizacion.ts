import { useEffect, useRef } from 'react';
import { esperaExponencial } from '../../../offline/sincronizar';
import type { ColaOperaciones } from '../../../offline/operacion';

/**
 * O2: sincroniza al montar, al volver la conexión (`online`) y, mientras queden pendientes, con espera exponencial.
 * Todo temporizador y listener se libera al desmontar: el shell monta y desmonta los remotos.
 */
export function useSincronizacion(cola: ColaOperaciones<unknown>, sincronizar: () => Promise<number>): void {
  const sincronizarRef = useRef(sincronizar);
  sincronizarRef.current = sincronizar;

  useEffect(() => {
    let activo = true;
    let temporizador: ReturnType<typeof setTimeout> | undefined;

    async function ciclo(): Promise<void> {
      const pendientes = await sincronizarRef.current();
      if (!activo || pendientes === 0) return;
      const intentos = Math.max(0, ...(await cola.listar()).filter((o) => o.estado === 'PENDIENTE').map((o) => o.intentos));
      temporizador = setTimeout(() => void ciclo(), esperaExponencial(intentos));
    }

    const alVolverLaRed = () => {
      clearTimeout(temporizador);
      void ciclo();
    };
    window.addEventListener('online', alVolverLaRed);
    void ciclo();
    return () => {
      activo = false;
      clearTimeout(temporizador);
      window.removeEventListener('online', alVolverLaRed);
    };
  }, [cola]);
}
