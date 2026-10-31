import { useCallback, useState } from 'react';
import { ErrorConsentimiento, type ServicioConsentimiento } from './puertos';

export type EstadoConsentimiento = 'INICIAL' | 'RETIRANDO' | 'RETIRADO';

/** I1: el residente retira su consentimiento; la IA borra fotos y embeddings en menos de 24 h. */
export function useConsentimiento(servicio: ServicioConsentimiento, personaId: string | null) {
  const [estado, setEstado] = useState<EstadoConsentimiento>('INICIAL');
  const [plazo, setPlazo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const retirar = useCallback(async () => {
    setError(null);
    if (personaId === null) return setError('Tu cuenta no está enlazada a una persona de Gestión; pide al administrador que la enlace.');
    setEstado('RETIRANDO');
    try {
      setPlazo((await servicio.retirar(personaId)).borradoAntesDe);
      setEstado('RETIRADO');
    } catch (e) {
      setEstado('INICIAL');
      setError(e instanceof ErrorConsentimiento ? e.message : 'No se pudo retirar el consentimiento');
    }
  }, [servicio, personaId]);

  return { estado, plazo, error, retirar };
}
