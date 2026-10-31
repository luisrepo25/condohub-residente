import { crearColaIndexedDb } from '../../../offline/colaIndexedDb';
import type { DatosPago } from '../application/puertos';

/** Cola local de pagos del residente (O2): sobrevive a recargar la página y a cerrar el navegador. */
export const crearColaPagos = () => crearColaIndexedDb<DatosPago>('condohub-residente-pagos');
