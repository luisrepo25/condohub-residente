import { createElement, useMemo } from 'react';
import { crearServicioCuenta } from './infrastructure/cuentaGraphql';
import { EstadoCuentaPage } from './ui/EstadoCuentaPage';

export interface CuentaPanelProps {
  getToken: () => string;
  unidades: { unidadId: string; codigo: string }[];
}

/** Única puerta de entrada de la feature: compone el servicio real con la pantalla. */
export function CuentaPanel({ getToken, unidades }: CuentaPanelProps) {
  const servicio = useMemo(() => crearServicioCuenta(getToken), [getToken]);
  return createElement(EstadoCuentaPage, { unidades, servicio });
}
