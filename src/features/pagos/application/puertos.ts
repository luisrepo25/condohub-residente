import type { ResultadoEnvio, Operacion } from '../../../offline/operacion';
import type { SimulacionPago } from '../domain/simulacion';

/** Lo que viaja a Gestión en `registrarPago`; el monto es texto decimal (F10). */
export interface DatosPago {
  unidadId: string;
  monto: string;
  fechaPago: string;
  banco: string | null;
  /** Solo viaja si se informó (F8). */
  nroOperacion?: string;
}

export type OperacionPago = Operacion<DatosPago>;

export interface ServicioPagos {
  /** Envía una operación con su clave de idempotencia (O1, O3); nunca confirma el pago (F9). */
  registrar(operacion: OperacionPago): Promise<ResultadoEnvio>;
}

/** Vista previa de a qué cargos se aplicaría un pago (F7). Solo lectura; `null` si no se pudo calcular. */
export interface SimuladorPago {
  simular(unidadId: string, monto: string): Promise<SimulacionPago | null>;
}

/** OCR local: texto crudo de la foto del comprobante; nada sale del dispositivo (F9). */
export interface LectorComprobante {
  leer(imagen: Blob): Promise<string>;
}

export interface Reloj {
  ahora(): Date;
}

export type GeneradorUuid = () => string;
