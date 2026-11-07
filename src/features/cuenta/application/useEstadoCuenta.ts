import { useCallback, useEffect, useRef, useState } from 'react';
import type { EstadoCuenta } from '../domain/estadoCuenta';

export interface ServicioCuenta {
  estadoDeCuenta(unidadId: string): Promise<EstadoCuenta>;
}

/**
 * F1: Gestión solo entrega la cuenta de una unidad del residente; si falla, se muestra el motivo.
 * El saldo se mantiene al día solo: se vuelve a pedir cada `intervaloMs`, al volver a la pestaña y al enfocar la ventana
 * (nunca con la pestaña oculta). Una actualización conserva el último dato mientras llega el nuevo y, si falla, no lo borra.
 */
export function useEstadoCuenta(servicio: ServicioCuenta, unidadId: string, intervaloMs = 30_000) {
  const [cuenta, setCuenta] = useState<EstadoCuenta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const [actualizadoEn, setActualizadoEn] = useState<number | null>(null);
  const turno = useRef(0); // solo vale la respuesta de la última petición

  const pedir = useCallback(
    async (primera: boolean) => {
      const mio = ++turno.current;
      setActualizando(true);
      try {
        const c = await servicio.estadoDeCuenta(unidadId);
        if (mio !== turno.current) return;
        setCuenta(c);
        setError(null);
        setActualizadoEn(Date.now());
      } catch (e: unknown) {
        // Una actualización fallida conserva el último dato; solo la primera carga muestra el error.
        if (mio === turno.current && primera) setError(e instanceof Error ? e.message : 'No se pudo cargar el estado de cuenta');
      } finally {
        if (mio === turno.current) setActualizando(false);
      }
    },
    [servicio, unidadId],
  );

  useEffect(() => {
    setCuenta(null);
    setError(null);
    setActualizadoEn(null);
    void pedir(true);
    return () => {
      turno.current++; // al cambiar de unidad o desmontar, lo que llegue tarde se descarta
    };
  }, [pedir]);

  useEffect(() => {
    const siEsVisible = () => {
      if (document.visibilityState === 'visible') void pedir(false);
    };
    const reloj = setInterval(siEsVisible, intervaloMs);
    document.addEventListener('visibilitychange', siEsVisible);
    window.addEventListener('focus', siEsVisible);
    return () => {
      clearInterval(reloj);
      document.removeEventListener('visibilitychange', siEsVisible);
      window.removeEventListener('focus', siEsVisible);
    };
  }, [pedir, intervaloMs]);

  const recargar = useCallback(() => pedir(false), [pedir]);

  return { cuenta, error, actualizando, actualizadoEn, recargar };
}
