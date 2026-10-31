export type EstadoReserva = 'SOLICITADA' | 'CONFIRMADA' | 'FALLIDA' | 'CANCELADA' | 'FINALIZADA';

/** Área común tal como la publica Reservas (R1). El dinero llega y se muestra como texto decimal (F10). */
export interface Area {
  id: string;
  codigo: string;
  nombre: string;
  aforo: number;
  horaApertura: string;
  horaCierre: string;
  bloqueMinimoHoras: number;
  costoUso: string;
  garantia: string;
}

export interface Reserva {
  id: string;
  areaId: string;
  unidadId: string;
  inicio: string;
  fin: string;
  estado: EstadoReserva;
  costoUso: string;
  garantia: string;
  cantidadInvitados?: number;
  motivo?: string | null;
  version: number;
}

/** Lo que escribe el residente: día y horas del dispositivo; los invitados, uno por línea. */
export interface DatosReserva {
  areaId: string;
  unidadId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  invitados: string;
}

export type ErroresReserva = Partial<Record<keyof DatosReserva, string>>;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^\d{2}:\d{2}$/;
const MAX_NOMBRE = 120;

export function invitadosDe(texto: string): { nombre: string }[] {
  return texto
    .split('\n')
    .map((n) => n.trim())
    .filter((n) => n !== '')
    .map((nombre) => ({ nombre }));
}

/** Solo comprueba la forma. Horario, anticipación, solapamiento, aforo y morosidad (R1–R4) los decide Reservas. */
export function validarReserva(d: DatosReserva): ErroresReserva {
  const errores: ErroresReserva = {};
  if (d.areaId === '') errores.areaId = 'Elige el área que quieres reservar';
  if (d.unidadId === '') errores.unidadId = 'Elige tu unidad';
  if (!FECHA.test(d.fecha)) errores.fecha = 'Elige el día';
  if (!HORA.test(d.horaInicio)) errores.horaInicio = 'Indica la hora de inicio';
  if (!HORA.test(d.horaFin)) errores.horaFin = 'Indica la hora de fin';
  else if (HORA.test(d.horaInicio) && d.horaFin <= d.horaInicio) errores.horaFin = 'El fin debe ser después del inicio';
  if (invitadosDe(d.invitados).some((i) => i.nombre.length > MAX_NOMBRE)) {
    errores.invitados = `Cada nombre puede tener hasta ${MAX_NOMBRE} caracteres`;
  }
  return errores;
}

/** Día y horas del dispositivo → instantes ISO en UTC, que es como viajan las fechas. */
export function aInstantes(d: DatosReserva): { inicio: string; fin: string } {
  const instante = (hora: string) => new Date(`${d.fecha}T${hora}:00`).toISOString();
  return { inicio: instante(d.horaInicio), fin: instante(d.horaFin) };
}

/** R8: solo una reserva CONFIRMADA se cancela. */
export function puedeCancelar(estado: EstadoReserva): boolean {
  return estado === 'CONFIRMADA';
}

export function mismosDatos(a: DatosReserva, b: DatosReserva): boolean {
  return (Object.keys(a) as (keyof DatosReserva)[]).every((k) => a[k] === b[k]);
}
