import { useCallback, useState } from 'react';
import type { ColaOperaciones } from '../../../offline/operacion';
import { sincronizarPendientes } from '../../../offline/sincronizar';
import { formatearMonto, leerComprobante, validarPago, type DatosComprobante, type ErroresPago } from '../domain/comprobante';
import type { DatosPago, GeneradorUuid, LectorComprobante, OperacionPago, Reloj, ServicioPagos } from './puertos';
import { useSincronizacion } from './useSincronizacion';

export interface Dependencias {
  cola: ColaOperaciones<DatosPago>;
  servicio: ServicioPagos;
  lector: LectorComprobante;
  reloj?: Reloj;
  uuid?: GeneradorUuid;
}

const COMPROBANTE_VACIO: DatosComprobante = { monto: '', fecha: '', banco: '' };

/**
 * F8, F9, O1–O4: el comprobante se lee en el dispositivo (solo prellena), el residente lo revisa y la operación se guarda en la
 * cola local ANTES de enviarse (con su `Idempotency-Key` y la hora del dispositivo). El pago nace PENDIENTE: confirmarlo es del ADMIN.
 */
export function usePagos({ cola, servicio, lector, reloj = { ahora: () => new Date() }, uuid = () => crypto.randomUUID() }: Dependencias) {
  const [operaciones, setOperaciones] = useState<OperacionPago[]>([]);
  const [leido, setLeido] = useState<DatosComprobante>(COMPROBANTE_VACIO);
  const [errores, setErrores] = useState<ErroresPago>({});
  const [leyendo, setLeyendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const refrescar = useCallback(async () => setOperaciones((await cola.listar()).reverse()), [cola]);

  const sincronizar = useCallback(async (): Promise<number> => {
    const resumen = await sincronizarPendientes(cola, (op) => servicio.registrar(op));
    await refrescar();
    return resumen.pendientes;
  }, [cola, servicio, refrescar]);

  useSincronizacion(cola as ColaOperaciones<unknown>, sincronizar);

  const leer = useCallback(
    async (imagen: Blob) => {
      setLeyendo(true);
      setAviso(null);
      try {
        setLeido(leerComprobante(await lector.leer(imagen)));
      } catch {
        setLeido(COMPROBANTE_VACIO);
        setAviso('No se pudo leer la foto. Escribe los datos a mano.');
      } finally {
        setLeyendo(false);
      }
    },
    [lector],
  );

  const enviar = useCallback(
    async (unidadId: string, datos: DatosComprobante): Promise<boolean> => {
      const hoy = reloj.ahora().toISOString().slice(0, 10);
      const encontrados = validarPago(datos, hoy);
      setErrores(encontrados);
      if (Object.keys(encontrados).length > 0) return false;
      const pago: DatosPago = { unidadId, monto: formatearMonto(datos.monto), fechaPago: datos.fecha, banco: datos.banco.trim() || null };
      await cola.agregar({ clave: uuid(), horaDispositivo: reloj.ahora().toISOString(), estado: 'PENDIENTE', intentos: 0, datos: pago });
      setLeido({ ...COMPROBANTE_VACIO }); // objeto nuevo: el formulario se limpia aunque ya estuviera vacío
      setAviso('Pago registrado como PENDIENTE: el administrador lo confirmará tras conciliarlo.');
      await sincronizar();
      return true;
    },
    [cola, reloj, uuid, sincronizar],
  );

  return { operaciones, leido, errores, leyendo, aviso, leer, enviar };
}
