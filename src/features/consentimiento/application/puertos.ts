/** Lo que responde la IA al aceptar el retiro: hasta cuándo se completa el borrado (I1: menos de 24 h). */
export interface RetiroAceptado {
  residenteId: string;
  borradoAntesDe: string;
}

/** Falla con un mensaje que el residente puede leer. */
export class ErrorConsentimiento extends Error {}

export interface ServicioConsentimiento {
  /** Retira el consentimiento y pide borrar fotos y embeddings. Es idempotente (repetirlo devuelve lo mismo). */
  retirar(personaId: string): Promise<RetiroAceptado>;
}
