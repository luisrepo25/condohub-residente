import { gatewayUrl } from '../../../entorno';
import type { SimuladorPago } from '../application/puertos';
import type { SimulacionPago } from '../domain/simulacion';

const CONSULTA = `query($unidadId: ID!, $monto: Decimal!) {
  simularPago(unidadId: $unidadId, monto: $monto) { excedente lineas { cargoId tipo concepto fechaVencimiento saldoActual aplicado saldoResultante } }
}`;

/**
 * `simularPago` de Gestión por el gateway: es una **query** (solo lectura, F9). El reparto lo calcula Gestión con la misma regla
 * FIFO que la confirmación (F7); aquí no se reimplementa. Cualquier fallo devuelve `null`: la vista previa es ayuda, no bloquea.
 */
export function crearSimuladorPago(getToken: () => string, base: string = gatewayUrl, http: typeof fetch = fetch): SimuladorPago {
  return {
    async simular(unidadId: string, monto: string): Promise<SimulacionPago | null> {
      try {
        const r = await http(`${base}/gestion/graphql`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ query: CONSULTA, variables: { unidadId, monto } }),
        });
        if (!r.ok) return null;
        const cuerpo = (await r.json()) as { data?: { simularPago?: SimulacionPago }; errors?: unknown[] };
        return cuerpo.errors?.length ? null : (cuerpo.data?.simularPago ?? null);
      } catch {
        return null;
      }
    },
  };
}
