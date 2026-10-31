import { useCallback, useEffect, useRef, useState } from 'react';
import { mismosDatos, validarReserva, type Area, type DatosReserva, type ErroresReserva, type Reserva } from '../domain/reserva';
import { ErrorReserva, type GeneradorUuid, type ServicioReservas } from './puertos';

export interface Dependencias {
  servicio: ServicioReservas;
  uuid?: GeneradorUuid;
  /** Cada cuánto se vuelve a preguntar mientras la saga confirma la reserva. */
  intervaloMs?: number;
}

/**
 * R2–R5, S1, O1, O3: solicita reservas y sigue la saga hasta que quedan CONFIRMADAS o FALLIDAS. La `Idempotency-Key` se genera
 * una sola vez por intento y se reutiliza si se reintenta con los mismos datos (un corte de red no duplica la reserva).
 * Reservar necesita red (O6): sin conexión se avisa y no se encola.
 */
export function useReservas({ servicio, uuid = () => crypto.randomUUID(), intervaloMs = 3000 }: Dependencias) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [errores, setErrores] = useState<ErroresReserva>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const pendiente = useRef<{ clave: string; datos: DatosReserva } | null>(null);

  const cargar = useCallback(async () => {
    try {
      setReservas((await servicio.listar()).sort((a, b) => b.inicio.localeCompare(a.inicio)));
    } catch (e) {
      setError(e instanceof ErrorReserva ? e.message : 'No se pudieron cargar tus reservas');
    }
  }, [servicio]);

  useEffect(() => {
    servicio.areas().then(setAreas).catch(() => setError('No se pudieron cargar las áreas'));
    void cargar();
  }, [servicio, cargar]);

  const enProceso = reservas.some((r) => r.estado === 'SOLICITADA');
  useEffect(() => {
    if (!enProceso) return;
    const temporizador = setTimeout(() => void cargar(), intervaloMs);
    return () => clearTimeout(temporizador);
  }, [enProceso, reservas, cargar, intervaloMs]);

  const solicitar = useCallback(
    async (datos: DatosReserva): Promise<boolean> => {
      const encontrados = validarReserva(datos);
      setErrores(encontrados);
      setError(null);
      if (Object.keys(encontrados).length > 0) return false;
      if (!pendiente.current || !mismosDatos(pendiente.current.datos, datos)) pendiente.current = { clave: uuid(), datos };
      setEnviando(true);
      try {
        await servicio.solicitar(datos, pendiente.current.clave);
        pendiente.current = null;
        await cargar();
        return true;
      } catch (e) {
        setError(e instanceof ErrorReserva ? e.message : 'No se pudo solicitar la reserva');
        return false;
      } finally {
        setEnviando(false);
      }
    },
    [servicio, uuid, cargar],
  );

  const cancelar = useCallback(
    async (reserva: Reserva) => {
      setError(null);
      try {
        await servicio.cancelar(reserva, uuid());
      } catch (e) {
        setError(e instanceof ErrorReserva ? e.message : 'No se pudo cancelar la reserva');
      }
      await cargar();
    },
    [servicio, uuid, cargar],
  );

  return { areas, reservas, errores, error, enviando, solicitar, cancelar };
}
