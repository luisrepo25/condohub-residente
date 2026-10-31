import type { EstadoReserva } from '../domain/reserva';

export const TEXTOS = {
  titulo: 'Reservar un área común',
  ayuda: 'Elige el área, el día y las horas. Reservas confirma el horario, aplica los cargos y emite los pases de tus invitados.',
  area: 'Área',
  unidad: 'Unidad',
  fecha: 'Día',
  inicio: 'Desde',
  fin: 'Hasta',
  invitados: 'Invitados (uno por línea, opcional)',
  enviar: 'Solicitar reserva',
  enviando: 'Solicitando…',
  historial: 'Mis reservas',
  vacio: 'Todavía no tienes reservas.',
  cancelar: 'Cancelar reserva',
  costo: 'Uso',
  garantia: 'Garantía',
} as const;

export const ESTADOS: Record<EstadoReserva, string> = {
  SOLICITADA: 'En proceso: confirmando horario, cargos y pases',
  CONFIRMADA: 'Confirmada',
  FALLIDA: 'No se pudo completar',
  CANCELADA: 'Cancelada',
  FINALIZADA: 'Finalizada',
};
