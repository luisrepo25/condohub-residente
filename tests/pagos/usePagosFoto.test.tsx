import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  DatosPago,
  LectorComprobante,
  OperacionPago,
  ServicioPagos,
  SubidorComprobante,
} from '../../src/features/pagos/application/puertos';
import { usePagos } from '../../src/features/pagos/application/usePagos';
import type { ColaOperaciones, ResultadoEnvio } from '../../src/offline/operacion';

afterEach(cleanup);

function colaEnMemoria(): ColaOperaciones<DatosPago> {
  const filas = new Map<string, OperacionPago>();
  return {
    agregar: async (o) => void filas.set(o.clave, o),
    listar: async () => [...filas.values()],
    actualizar: async (clave, cambios) => void filas.set(clave, { ...filas.get(clave)!, ...cambios }),
  };
}

const reloj = { ahora: () => new Date('2026-11-07T15:00:00Z') };
const lector: LectorComprobante = { leer: async () => 'Banco Unión\nFecha: 06/11/2026\nMonto: Bs 300.00' };
const formulario = { monto: '300', fecha: '2026-11-06', banco: 'Banco Unión' };
const foto = new Blob(['foto'], { type: 'image/jpeg' });

function montar(subidor?: SubidorComprobante) {
  const registrar = vi.fn(async (_op: OperacionPago): Promise<ResultadoEnvio> => ({ tipo: 'ok' }));
  const servicio: ServicioPagos = { registrar };
  const cola = colaEnMemoria();
  const vista = renderHook(() => usePagos({ cola, servicio, lector, reloj, subidor, uuid: () => 'uuid-fijo' }));
  return { ...vista, registrar };
}

describe('F8 · foto del comprobante en S3', () => {
  it('F8_en_linea_la_foto_se_sube_con_la_clave_del_pago_y_el_pago_lleva_la_clave_de_la_foto', async () => {
    const subir = vi.fn(async () => 'comprobantes/A-101/uuid-fijo.jpg');
    const { result, registrar } = montar({ subir });

    await act(() => result.current.leer(foto));
    await act(() => result.current.enviar('u1', formulario));

    expect(subir).toHaveBeenCalledWith('u1', 'uuid-fijo', foto);
    expect(registrar.mock.calls[0]![0].datos.comprobanteKey).toBe('comprobantes/A-101/uuid-fijo.jpg');
  });

  it('F8_sin_conexion_el_pago_se_registra_igual_sin_foto_y_avisa', async () => {
    const { result, registrar } = montar({ subir: async () => null });

    await act(() => result.current.leer(foto));
    await act(() => result.current.enviar('u1', formulario));

    expect(registrar.mock.calls[0]![0].datos).not.toHaveProperty('comprobanteKey');
    expect(result.current.aviso).toMatch(/sin la foto/i);
  });

  it('F8_si_subir_la_foto_falla_con_una_excepcion_el_pago_igual_se_registra', async () => {
    const { result, registrar } = montar({ subir: async () => Promise.reject(new Error('red')) });

    await act(() => result.current.leer(foto));
    await act(() => result.current.enviar('u1', formulario));

    expect(registrar).toHaveBeenCalledTimes(1);
    expect(registrar.mock.calls[0]![0].datos).not.toHaveProperty('comprobanteKey');
  });

  it('F8_sin_foto_elegida_no_se_intenta_subir_nada', async () => {
    const subir = vi.fn(async () => 'x');
    const { result, registrar } = montar({ subir });

    await act(() => result.current.enviar('u1', formulario));

    expect(subir).not.toHaveBeenCalled();
    expect(registrar.mock.calls[0]![0].datos).not.toHaveProperty('comprobanteKey');
    expect(result.current.aviso).not.toMatch(/sin la foto/i);
  });

  it('F8_la_foto_de_un_pago_no_se_reutiliza_en_el_siguiente', async () => {
    const subir = vi.fn(async () => 'comprobantes/A-101/uuid-fijo.jpg');
    const { result } = montar({ subir });

    await act(() => result.current.leer(foto));
    await act(() => result.current.enviar('u1', formulario));
    await act(() => result.current.enviar('u1', formulario));

    expect(subir).toHaveBeenCalledTimes(1);
  });

  it('F8_sin_subidor_configurado_todo_funciona_como_antes', async () => {
    const { result, registrar } = montar(undefined);

    await act(() => result.current.leer(foto));
    await act(() => result.current.enviar('u1', formulario));

    expect(registrar.mock.calls[0]![0].datos).not.toHaveProperty('comprobanteKey');
  });
});
