import type { DatosVisita, VisitaEmitida } from '../domain/visita';

/** Falla con un mensaje que el residente puede leer; `codigo` es el de la regla violada (F1, ...), si aplica. */
export class ErrorVisita extends Error {
  constructor(
    mensaje: string,
    readonly codigo?: string,
  ) {
    super(mensaje);
  }
}

export interface ServicioVisitas {
  registrar(datos: DatosVisita, idempotencyKey: string): Promise<VisitaEmitida>;
}

export interface GeneradorQr {
  /** QR de `texto` como imagen vectorial (data URL SVG): se ve nítido en pantalla. */
  aImagen(texto: string): Promise<string>;
  /** El mismo QR como PNG (data URL): es el formato que se descarga y se comparte (WhatsApp, correo, visores). */
  aPng(texto: string): Promise<string>;
}

export type GeneradorUuid = () => string;
