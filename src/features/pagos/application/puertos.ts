import type { ResultadoEnvio, Operacion } from '../../../offline/operacion';

/** Lo que viaja a Gestión en `registrarPago`; el monto es texto decimal (F10). */
export interface DatosPago {
  unidadId: string;
  monto: string;
  fechaPago: string;
  banco: string | null;
}

export type OperacionPago = Operacion<DatosPago>;

export interface ServicioPagos {
  /** Envía una operación con su clave de idempotencia (O1, O3); nunca confirma el pago (F9). */
  registrar(operacion: OperacionPago): Promise<ResultadoEnvio>;
}

/** OCR local: texto crudo de la foto del comprobante; nada sale del dispositivo (F9). */
export interface LectorComprobante {
  leer(imagen: Blob): Promise<string>;
}

export interface Reloj {
  ahora(): Date;
}

export type GeneradorUuid = () => string;
