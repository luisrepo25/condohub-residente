import { useEffect, useState } from 'react';
import type { EstadoCuenta } from '../domain/estadoCuenta';

export interface ServicioCuenta {
  estadoDeCuenta(unidadId: string): Promise<EstadoCuenta>;
}

/** F1: Gestión solo entrega la cuenta de una unidad del residente; si falla, se muestra el motivo. */
export function useEstadoCuenta(servicio: ServicioCuenta, unidadId: string) {
  const [cuenta, setCuenta] = useState<EstadoCuenta | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    setCuenta(null);
    setError(null);
    servicio
      .estadoDeCuenta(unidadId)
      .then((c) => vigente && setCuenta(c))
      .catch((e: unknown) => vigente && setError(e instanceof Error ? e.message : 'No se pudo cargar el estado de cuenta'));
    return () => {
      vigente = false;
    };
  }, [servicio, unidadId]);

  return { cuenta, error };
}
