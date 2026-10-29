import { createElement, useMemo } from 'react';
import { crearServicioVisitas } from './infrastructure/visitasHttp';
import { generadorQr } from './infrastructure/qr';
import type { UnidadOpcion } from './domain/visita';
import { VisitasPage } from './ui/VisitasPage';

export interface VisitasPanelProps {
  getToken: () => string;
  unidades: UnidadOpcion[];
}

/** Única puerta de entrada de la feature: aquí se decide qué adaptadores recibe (composición). */
export function VisitasPanel({ getToken, unidades }: VisitasPanelProps) {
  const servicio = useMemo(() => crearServicioVisitas(getToken), [getToken]);
  return createElement(VisitasPage, { unidades, servicio, qr: generadorQr });
}
