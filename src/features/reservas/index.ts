import { createElement, useMemo } from 'react';
import { crearServicioReservas } from './infrastructure/reservasHttp';
import { ReservasPage } from './ui/ReservasPage';

export interface ReservasPanelProps {
  getToken: () => string;
  unidades: { unidadId: string; codigo: string }[];
}

/** Única puerta de entrada de la feature: aquí se decide qué adaptador recibe (composición). */
export function ReservasPanel({ getToken, unidades }: ReservasPanelProps) {
  const servicio = useMemo(() => crearServicioReservas(getToken), [getToken]);
  return createElement(ReservasPage, { unidades, servicio });
}
