import type { ColaOperaciones, EnviarOperacion } from './operacion';

export interface ResumenSincronizacion {
  sincronizadas: number;
  rechazadas: number;
  pendientes: number;
}

const ESPERA_MINIMA_MS = 1000;
const ESPERA_MAXIMA_MS = 5 * 60 * 1000;

/** O2: espera exponencial entre reintentos (1 s, 2 s, 4 s... con tope de 5 min). */
export function esperaExponencial(intentos: number): number {
  return Math.min(ESPERA_MINIMA_MS * 2 ** Math.max(intentos, 0), ESPERA_MAXIMA_MS);
}

/**
 * Envía las operaciones pendientes, de la más antigua a la más nueva. Cada una se marca solo por su propia respuesta (O4):
 * 2xx → sincronizada; 4xx → rechazada con motivo; sin red o 5xx → sigue pendiente con la MISMA clave (O3). Al primer fallo
 * de red se detiene: no tiene sentido insistir con las demás.
 */
export async function sincronizarPendientes<T>(cola: ColaOperaciones<T>, enviar: EnviarOperacion<T>): Promise<ResumenSincronizacion> {
  const resumen: ResumenSincronizacion = { sincronizadas: 0, rechazadas: 0, pendientes: 0 };
  const pendientes = (await cola.listar()).filter((o) => o.estado === 'PENDIENTE');
  for (const [i, operacion] of pendientes.entries()) {
    const resultado = await enviar(operacion);
    if (resultado.tipo === 'ok') {
      await cola.actualizar(operacion.clave, { estado: 'SINCRONIZADA' });
      resumen.sincronizadas++;
    } else if (resultado.tipo === 'rechazada') {
      await cola.actualizar(operacion.clave, { estado: 'RECHAZADA', motivo: resultado.motivo });
      resumen.rechazadas++;
    } else {
      await cola.actualizar(operacion.clave, { intentos: operacion.intentos + 1 });
      resumen.pendientes = pendientes.length - i;
      break;
    }
  }
  return resumen;
}
