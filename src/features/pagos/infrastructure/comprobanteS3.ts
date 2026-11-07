import { gatewayUrl } from '../../../entorno';
import type { SubidorComprobante } from '../application/puertos';

const MUTACION = `mutation($unidadId: ID!, $clave: ID!, $tipo: String!) {
  solicitarSubidaComprobante(unidadId: $unidadId, idempotencyKey: $clave, tipoContenido: $tipo) { clave url }
}`;

/**
 * F8: pide a Gestión un enlace temporal y sube la foto directo al almacén (S3). Cualquier fallo (sin conexión, sin almacén,
 * tipo no admitido) devuelve `null`: el pago se registra igual, sin foto, y el ADMIN verá «sin comprobante adjunto».
 */
export function crearSubidorComprobante(getToken: () => string, base: string = gatewayUrl, http: typeof fetch = fetch): SubidorComprobante {
  return {
    async subir(unidadId, clave, imagen) {
      const tipo = imagen.type || 'image/jpeg';
      try {
        const r = await http(`${base}/gestion/graphql`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ query: MUTACION, variables: { unidadId, clave, tipo } }),
        });
        if (!r.ok) return null;
        const cuerpo = (await r.json()) as { data?: { solicitarSubidaComprobante?: { clave: string; url: string } }; errors?: unknown[] };
        const subida = cuerpo.data?.solicitarSubidaComprobante;
        if (cuerpo.errors?.length || !subida) return null;
        const put = await http(subida.url, { method: 'PUT', headers: { 'content-type': tipo }, body: imagen });
        return put.ok ? subida.clave : null;
      } catch {
        return null;
      }
    },
  };
}
