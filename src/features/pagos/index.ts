import { createElement, useMemo } from 'react';
import { crearColaPagos } from './infrastructure/colaPagos';
import { crearSubidorComprobante } from './infrastructure/comprobanteS3';
import { crearServicioPagos } from './infrastructure/pagosGraphql';
import { lectorTesseract } from './infrastructure/ocrTesseract';
import { crearSimuladorPago } from './infrastructure/simulacionGraphql';
import { PagosPage } from './ui/PagosPage';

export interface PagosPanelProps {
  getToken: () => string;
  unidades: { unidadId: string; codigo: string }[];
}

/** Única puerta de entrada de la feature: aquí se decide qué adaptadores recibe (composición). */
export function PagosPanel({ getToken, unidades }: PagosPanelProps) {
  const cola = useMemo(() => crearColaPagos(), []);
  const servicio = useMemo(() => crearServicioPagos(getToken), [getToken]);
  const simulador = useMemo(() => crearSimuladorPago(getToken), [getToken]);
  const subidor = useMemo(() => crearSubidorComprobante(getToken), [getToken]);
  return createElement(PagosPage, { unidades, cola, servicio, simulador, subidor, lector: lectorTesseract });
}
