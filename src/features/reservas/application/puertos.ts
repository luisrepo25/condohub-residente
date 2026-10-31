import type { Area, DatosReserva, Reserva } from '../domain/reserva';

/** Falla con un mensaje que el residente puede leer; `codigo` es el de la regla violada (R2, R3, R4, F1...), si aplica. */
export class ErrorReserva extends Error {
  constructor(
    mensaje: string,
    readonly codigo?: string,
  ) {
    super(mensaje);
  }
}

export interface ServicioReservas {
  areas(): Promise<Area[]>;
  listar(): Promise<Reserva[]>;
  /** Acepta la solicitud y arranca la saga (202); la reserva queda SOLICITADA hasta confirmarse. Lleva `Idempotency-Key` (O1). */
  solicitar(datos: DatosReserva, idempotencyKey: string): Promise<Reserva>;
  cancelar(reserva: Reserva, idempotencyKey: string): Promise<Reserva>;
}

export type GeneradorUuid = () => string;
