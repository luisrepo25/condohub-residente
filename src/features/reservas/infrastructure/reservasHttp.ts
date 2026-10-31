import { gatewayUrl } from '../../../entorno';
import { ErrorReserva, type ServicioReservas } from '../application/puertos';
import { aInstantes, invitadosDe, type Area, type DatosReserva, type Reserva } from '../domain/reserva';

interface Problema {
  detail?: string;
  code?: string;
}

const MENSAJES: Record<string, string> = {
  R2: 'Ese horario no está disponible o no respeta el horario y los bloques del área.',
  R3: 'La anticipación debe ser de 48 horas a 60 días, y tu unidad puede tener hasta 2 reservas activas.',
  R4: 'Tu unidad tiene expensas vencidas y no puede reservar hasta ponerse al día.',
  F1: 'Esa unidad no pertenece a tu cuenta.',
};

/** El `code` del problem+json es el de la regla violada; se traduce a un mensaje comprensible. */
function mensajeDe(status: number, p: Problema): ErrorReserva {
  if (p.code && MENSAJES[p.code]) return new ErrorReserva(MENSAJES[p.code] as string, p.code);
  if (status === 503) return new ErrorReserva('No se pudo comprobar tu unidad con Gestión; intenta de nuevo en unos segundos.');
  if (status === 409) return new ErrorReserva(p.detail ?? 'La reserva cambió mientras la editabas; vuelve a cargarla.', p.code);
  if (status === 401 || status === 403) return new ErrorReserva('Tu sesión no permite esta operación.');
  return new ErrorReserva(p.detail ?? 'No se pudo completar la operación.', p.code);
}

/** Reservas responde con la lista directa o envuelta en `data`, según el endpoint. */
function lista<T>(cuerpo: unknown): T[] {
  const datos = Array.isArray(cuerpo) ? cuerpo : (cuerpo as { data?: unknown } | null)?.data;
  return Array.isArray(datos) ? (datos as T[]) : [];
}

/** API REST de Reservas por el gateway, con el token del shell y la `Idempotency-Key` en cada escritura (O1, O3). */
export function crearServicioReservas(getToken: () => string, base: string = gatewayUrl, http: typeof fetch = fetch): ServicioReservas {
  async function pedir(ruta: string, cuerpo?: unknown, clave?: string): Promise<unknown> {
    let r: Response;
    try {
      r = await http(`${base}/reservas/api${ruta}`, {
        method: cuerpo === undefined ? 'GET' : 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${getToken()}`,
          ...(clave ? { 'idempotency-key': clave } : {}),
        },
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      });
    } catch {
      throw new ErrorReserva('Sin conexión: reservar necesita red.');
    }
    if (!r.ok) throw mensajeDe(r.status, (await r.json().catch(() => ({}))) as Problema);
    return r.json();
  }

  return {
    areas: async () => lista<Area>(await pedir('/areas')),
    listar: async () => lista<Reserva>(await pedir('/reservas')),
    async solicitar(datos: DatosReserva, clave: string): Promise<Reserva> {
      const { inicio, fin } = aInstantes(datos);
      const invitados = invitadosDe(datos.invitados);
      const cuerpo = { areaId: datos.areaId, unidadId: datos.unidadId, inicio, fin, ...(invitados.length > 0 ? { invitados } : {}) };
      return (await pedir('/reservas', cuerpo, clave)) as Reserva;
    },
    async cancelar(reserva: Reserva, clave: string): Promise<Reserva> {
      return (await pedir(`/reservas/${reserva.id}/cancelar`, { version: reserva.version }, clave)) as Reserva;
    },
  };
}
