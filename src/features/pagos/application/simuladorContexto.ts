import { createContext } from 'react';
import type { SimuladorPago } from './puertos';

/** El simulador lo entrega la composición de la feature (`index.ts`); sin él, la vista previa no se muestra. */
export const SimuladorContexto = createContext<SimuladorPago | null>(null);
