import { createElement, useMemo } from 'react';
import { crearServicioConsentimiento } from './infrastructure/consentimientoHttp';
import { ConsentimientoPage } from './ui/ConsentimientoPage';

export interface ConsentimientoPanelProps {
  getToken: () => string;
  personaId: string | null;
}

/** Única puerta de entrada de la feature: aquí se decide qué adaptador recibe (composición). */
export function ConsentimientoPanel({ getToken, personaId }: ConsentimientoPanelProps) {
  const servicio = useMemo(() => crearServicioConsentimiento(getToken), [getToken]);
  return createElement(ConsentimientoPage, { servicio, personaId });
}
