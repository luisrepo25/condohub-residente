import { gatewayUrl } from '../../../entorno';
import type { ResultadoEnvio } from '../../../offline/operacion';
import type { OperacionPago, ServicioPagos } from '../application/puertos';

const MUTACION = `mutation($unidadId: ID!, $monto: Decimal!, $fechaPago: String!, $banco: String, $clave: ID!, $hora: String, $nroOperacion: String) {
  registrarPago(unidadId: $unidadId, monto: $monto, fechaPago: $fechaPago, banco: $banco, idempotencyKey: $clave, horaDispositivo: $hora, nroOperacion: $nroOperacion) { id estado }
}`;

interface ErrorGraphql {
  message: string;
  extensions?: { code?: string };
}

/** Un error del servidor (INTERNAL_ERROR) se reintenta; una regla violada (F8, F1...) es un rechazo definitivo de esa operación. */
function esReintentable(errores: ErrorGraphql[]): boolean {
  return errores.some((e) => e.extensions?.code === 'INTERNAL_ERROR');
}

function motivoDe(errores: ErrorGraphql[]): string {
  const e = errores[0];
  return e?.extensions?.code ? `${e.message} (${e.extensions.code})` : (e?.message ?? 'El pago fue rechazado.');
}

/**
 * `registrarPago` de Gestión por el gateway (GraphQL, único punto de entrada del ERP). La `idempotencyKey` va como argumento:
 * repetirla devuelve el mismo pago (O3). Solo una respuesta 2xx sin errores cuenta como enviada (O4).
 */
export function crearServicioPagos(getToken: () => string, base: string = gatewayUrl, http: typeof fetch = fetch): ServicioPagos {
  return {
    async registrar(op: OperacionPago): Promise<ResultadoEnvio> {
      const variables = { ...op.datos, clave: op.clave, hora: op.horaDispositivo };
      let r: Response;
      try {
        r = await http(`${base}/gestion/graphql`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ query: MUTACION, variables }),
        });
      } catch {
        return { tipo: 'reintentar' };
      }
      if (r.status === 401 || r.status === 429 || r.status >= 500) return { tipo: 'reintentar' };
      if (!r.ok) return { tipo: 'rechazada', motivo: `Gestión respondió ${r.status}` };
      const cuerpo = (await r.json().catch(() => ({}))) as { errors?: ErrorGraphql[] };
      if (!cuerpo.errors?.length) return { tipo: 'ok' };
      return esReintentable(cuerpo.errors) ? { tipo: 'reintentar' } : { tipo: 'rechazada', motivo: motivoDe(cuerpo.errors) };
    },
  };
}
