export type EstadoOperacion = 'PENDIENTE' | 'SINCRONIZADA' | 'RECHAZADA';

/** Una escritura creada en el dispositivo (O1): lleva su `Idempotency-Key` y la hora del dispositivo desde que nace. */
export interface Operacion<T> {
  clave: string;
  horaDispositivo: string;
  estado: EstadoOperacion;
  motivo?: string;
  intentos: number;
  datos: T;
}

export type CambiosOperacion = Partial<Pick<Operacion<unknown>, 'estado' | 'motivo' | 'intentos'>>;

/** Puerto de la cola local (O2): la implementación real es IndexedDB. */
export interface ColaOperaciones<T> {
  agregar(operacion: Operacion<T>): Promise<void>;
  listar(): Promise<Operacion<T>[]>;
  actualizar(clave: string, cambios: CambiosOperacion): Promise<void>;
}

/** Qué pasó al enviar: solo una respuesta 2xx es `ok` (O4); un 4xx es rechazo definitivo; lo demás se reintenta. */
export type ResultadoEnvio = { tipo: 'ok' } | { tipo: 'rechazada'; motivo: string } | { tipo: 'reintentar' };

export type EnviarOperacion<T> = (operacion: Operacion<T>) => Promise<ResultadoEnvio>;
