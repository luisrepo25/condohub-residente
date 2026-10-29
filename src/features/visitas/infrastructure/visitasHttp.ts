import { gatewayUrl } from '../../../entorno';
import { ErrorVisita, type ServicioVisitas } from '../application/puertos';
import type { DatosVisita, VisitaEmitida } from '../domain/visita';

interface Problema {
  status?: number;
  detail?: string;
  code?: string;
}

/** Traduce el problem+json de Acceso a un mensaje comprensible (el `code` es el de la regla violada). */
function mensajeDe(status: number, p: Problema): string {
  if (p.code === 'F1') return 'Esa unidad no pertenece a tu cuenta.';
  if (status === 503) return 'No se pudo comprobar tu unidad con Gestión; intenta de nuevo en unos segundos.';
  if (status === 400) return p.detail ?? 'Revisa los datos de la visita.';
  if (status === 401 || status === 403) return 'Tu sesión no permite anunciar visitas.';
  return 'No se pudo registrar la visita.';
}

/** `POST /acceso/api/visitas` por el gateway, con el token del shell y la `Idempotency-Key` (O1, O3). */
export function crearServicioVisitas(getToken: () => string, base: string = gatewayUrl, http: typeof fetch = fetch): ServicioVisitas {
  return {
    async registrar(datos: DatosVisita, idempotencyKey: string): Promise<VisitaEmitida> {
      const cuerpo = { unidadCodigo: datos.unidadCodigo, nombre: datos.nombre.trim(), fecha: datos.fecha, ...(datos.documento.trim() ? { documento: datos.documento.trim() } : {}) };
      let r: Response;
      try {
        r = await http(`${base}/acceso/api/visitas`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${getToken()}`, 'idempotency-key': idempotencyKey },
          body: JSON.stringify(cuerpo),
        });
      } catch {
        throw new ErrorVisita('Sin conexión: anunciar una visita necesita red.');
      }
      if (!r.ok) {
        const problema = (await r.json().catch(() => ({}))) as Problema;
        throw new ErrorVisita(mensajeDe(r.status, problema), problema.code);
      }
      return (await r.json()) as VisitaEmitida;
    },
  };
}
