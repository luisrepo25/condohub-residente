import { gatewayUrl } from '../../../entorno';
import { ErrorConsentimiento, type RetiroAceptado, type ServicioConsentimiento } from '../application/puertos';

const MENSAJES: Record<number, string> = {
  404: 'No tienes un perfil facial registrado: no hay nada que borrar.',
  403: 'No puedes retirar el consentimiento de otra persona.',
  401: 'Tu sesión venció; vuelve a entrar.',
};

/** `DELETE /ia/rostros/{personaId}` por el gateway con el token del shell: la IA comprueba que el perfil sea de quien lo pide (I1). */
export function crearServicioConsentimiento(getToken: () => string, base: string = gatewayUrl, http: typeof fetch = fetch): ServicioConsentimiento {
  return {
    async retirar(personaId: string): Promise<RetiroAceptado> {
      let r: Response;
      try {
        r = await http(`${base}/ia/rostros/${personaId}`, { method: 'DELETE', headers: { authorization: `Bearer ${getToken()}` } });
      } catch {
        throw new ErrorConsentimiento('Sin conexión: retirar el consentimiento necesita red.');
      }
      if (!r.ok) throw new ErrorConsentimiento(MENSAJES[r.status] ?? 'No se pudo retirar el consentimiento; intenta de nuevo en unos segundos.');
      return (await r.json()) as RetiroAceptado;
    },
  };
}
