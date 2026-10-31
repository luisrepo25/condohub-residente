import { gatewayUrl } from '../../../entorno';
import type { ServicioCuenta } from '../application/useEstadoCuenta';
import type { EstadoCuenta } from '../domain/estadoCuenta';

const CONSULTA =
  'query($id: ID!) { estadoDeCuenta(unidadId: $id) { unidadId codigo bloque deudaTotal deudaVencida expensasVencidas saldoAFavor moroso } }';

/** `estadoDeCuenta` de Gestión (GraphQL por el gateway) con el token del shell. */
export function crearServicioCuenta(getToken: () => string, base: string = gatewayUrl, http: typeof fetch = fetch): ServicioCuenta {
  return {
    async estadoDeCuenta(unidadId: string): Promise<EstadoCuenta> {
      const r = await http(`${base}/gestion/graphql`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ query: CONSULTA, variables: { id: unidadId } }),
      });
      if (!r.ok) throw new Error(`Gestión respondió ${r.status}`);
      const cuerpo = (await r.json()) as { data?: { estadoDeCuenta: EstadoCuenta }; errors?: { message: string }[] };
      if (!cuerpo.data) throw new Error(cuerpo.errors?.[0]?.message ?? 'Respuesta vacía de Gestión');
      return cuerpo.data.estadoDeCuenta;
    },
  };
}
