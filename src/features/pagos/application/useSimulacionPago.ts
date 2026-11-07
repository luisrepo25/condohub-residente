import { useEffect, useState } from 'react';
import { montoParaSimular } from '../domain/montoSimulable';
import type { SimulacionPago } from '../domain/simulacion';
import type { SimuladorPago } from './puertos';

export type EstadoVistaPrevia = 'inactiva' | 'calculando' | 'lista' | 'no-disponible';

/**
 * F7: pide la vista previa «se aplicará a…» cuando el residente terminó de escribir un monto válido (espera `esperaMs` sin
 * cambios). Una respuesta vieja nunca pisa a la del monto actual y al desmontar se cancela lo pendiente.
 */
export function useSimulacionPago(simulador: SimuladorPago | null, unidadId: string, monto: string, esperaMs = 400) {
  const [estado, setEstado] = useState<EstadoVistaPrevia>('inactiva');
  const [simulacion, setSimulacion] = useState<SimulacionPago | null>(null);

  useEffect(() => {
    const valido = montoParaSimular(monto);
    if (!simulador || !unidadId || !valido) {
      setEstado('inactiva');
      setSimulacion(null);
      return;
    }
    let vigente = true;
    setEstado('calculando');
    const espera = setTimeout(() => {
      void simulador.simular(unidadId, valido).then((resultado) => {
        if (!vigente) return;
        setSimulacion(resultado);
        setEstado(resultado ? 'lista' : 'no-disponible');
      });
    }, esperaMs);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [simulador, unidadId, monto, esperaMs]);

  return { estado, simulacion };
}
