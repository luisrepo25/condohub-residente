import { useCallback, useRef, useState } from 'react';
import { mismosDatos, validarVisita, type DatosVisita, type ErroresFormulario, type VisitaEmitida } from '../domain/visita';
import { ErrorVisita, type GeneradorQr, type GeneradorUuid, type ServicioVisitas } from './puertos';

export interface Dependencias {
  servicio: ServicioVisitas;
  qr: GeneradorQr;
  uuid?: GeneradorUuid;
}

export interface EstadoVisitas {
  enviando: boolean;
  error: string | null;
  errores: ErroresFormulario;
  visita: VisitaEmitida | null;
  imagenQr: string | null;
  /** PNG para descargar; null si el navegador no pudo generarlo (entonces se descarga el SVG). */
  imagenPng: string | null;
}

const INICIAL: EstadoVisitas = { enviando: false, error: null, errores: {}, visita: null, imagenQr: null, imagenPng: null };

/**
 * A1, O1, O3: anuncia una visita y obtiene su pase QR. La `Idempotency-Key` se genera una sola vez por intento y se reutiliza
 * si se reintenta con los mismos datos (un corte de red no duplica la visita); con datos distintos o tras un éxito, es nueva.
 */
export function useVisitas({ servicio, qr, uuid = () => crypto.randomUUID() }: Dependencias) {
  const [estado, setEstado] = useState<EstadoVisitas>(INICIAL);
  const pendiente = useRef<{ clave: string; datos: DatosVisita } | null>(null);

  const anunciar = useCallback(
    async (datos: DatosVisita) => {
      const errores = validarVisita(datos);
      if (Object.keys(errores).length > 0) return setEstado({ ...INICIAL, errores });
      if (!pendiente.current || !mismosDatos(pendiente.current.datos, datos)) pendiente.current = { clave: uuid(), datos };
      setEstado({ ...INICIAL, enviando: true });
      try {
        const visita = await servicio.registrar(datos, pendiente.current.clave);
        const imagenQr = await qr.aImagen(visita.pase.codigo);
        const imagenPng = await qr.aPng(visita.pase.codigo).catch(() => null);
        pendiente.current = null;
        setEstado({ ...INICIAL, visita, imagenQr, imagenPng });
      } catch (e) {
        const mensaje = e instanceof ErrorVisita ? e.message : 'No se pudo registrar la visita';
        setEstado({ ...INICIAL, error: mensaje });
      }
    },
    [servicio, qr, uuid],
  );

  const nueva = useCallback(() => setEstado(INICIAL), []);
  return { estado, anunciar, nueva };
}
