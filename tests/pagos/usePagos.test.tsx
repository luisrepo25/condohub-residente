import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DatosPago, LectorComprobante, OperacionPago, ServicioPagos } from '../../src/features/pagos/application/puertos';
import { usePagos } from '../../src/features/pagos/application/usePagos';
import type { ColaOperaciones, ResultadoEnvio } from '../../src/offline/operacion';

afterEach(cleanup);

function colaEnMemoria(): ColaOperaciones<DatosPago> {
  const filas = new Map<string, OperacionPago>();
  return {
    agregar: async (o) => void filas.set(o.clave, o),
    listar: async () => [...filas.values()].sort((a, b) => a.horaDispositivo.localeCompare(b.horaDispositivo)),
    actualizar: async (clave, cambios) => void filas.set(clave, { ...filas.get(clave)!, ...cambios }),
  };
}

const reloj = { ahora: () => new Date('2026-10-30T15:00:00Z') };
const lector: LectorComprobante = { leer: async () => 'Banco Unión Monto Bs. 270,00 Fecha 13/10/2026' };
const formulario = { monto: '270', fecha: '2026-10-13', banco: 'Banco Unión' };

function montar(resultados: ResultadoEnvio[], uuid = () => 'uuid-fijo') {
  const registrar = vi.fn(async (_op: OperacionPago): Promise<ResultadoEnvio> => resultados.shift() ?? { tipo: 'ok' });
  const servicio: ServicioPagos = { registrar };
  const cola = colaEnMemoria();
  const vista = renderHook(() => usePagos({ cola, servicio, lector, reloj, uuid }));
  return { ...vista, registrar, cola };
}

describe('usePagos', () => {
  it('O1_O2_guarda_la_operacion_con_clave_y_hora_del_dispositivo_y_la_envia', async () => {
    const { result, registrar } = montar([{ tipo: 'ok' }]);

    await act(() => result.current.enviar('u1', formulario));

    const enviada = registrar.mock.calls[0]![0];
    expect(enviada.clave).toBe('uuid-fijo');
    expect(enviada.horaDispositivo).toBe('2026-10-30T15:00:00.000Z');
    expect(enviada.datos).toEqual({ unidadId: 'u1', monto: '270.00', fechaPago: '2026-10-13', banco: 'Banco Unión' });
  });

  it('O4_solo_la_respuesta_ok_marca_el_pago_como_sincronizado', async () => {
    const { result } = montar([{ tipo: 'ok' }]);

    await act(() => result.current.enviar('u1', formulario));

    await waitFor(() => expect(result.current.operaciones[0]?.estado).toBe('SINCRONIZADA'));
    expect(result.current.aviso).toMatch(/PENDIENTE/);
  });

  it('O3_sin_red_queda_pendiente_y_al_volver_la_conexion_reenvia_con_la_MISMA_clave', async () => {
    const { result, registrar } = montar([{ tipo: 'reintentar' }, { tipo: 'ok' }], () => `uuid-${Math.random()}`);
    await act(() => result.current.enviar('u1', formulario));
    await waitFor(() => expect(result.current.operaciones[0]?.estado).toBe('PENDIENTE'));

    await act(async () => void window.dispatchEvent(new Event('online')));

    await waitFor(() => expect(result.current.operaciones[0]?.estado).toBe('SINCRONIZADA'));
    const claves = registrar.mock.calls.map(([op]) => op.clave);
    expect(new Set(claves).size).toBe(1);
    expect(result.current.operaciones).toHaveLength(1);
  });

  it('O4_un_rechazo_de_Gestion_se_muestra_con_su_motivo', async () => {
    const { result } = montar([{ tipo: 'rechazada', motivo: 'La fecha no puede ser futura (F8)' }]);

    await act(() => result.current.enviar('u1', formulario));

    await waitFor(() => expect(result.current.operaciones[0]).toMatchObject({ estado: 'RECHAZADA', motivo: expect.stringContaining('F8') }));
  });

  it('F8_una_fecha_futura_no_se_encola_ni_se_envia', async () => {
    const { result, registrar, cola } = montar([]);

    let enviado = true;
    await act(async () => void (enviado = await result.current.enviar('u1', { ...formulario, fecha: '2026-11-15' })));

    expect(enviado).toBe(false);
    expect(result.current.errores.fecha).toMatch(/futura/i);
    expect(registrar).not.toHaveBeenCalled();
    expect(await cola.listar()).toHaveLength(0);
  });

  it('F9_leer_la_foto_solo_prellena_y_no_envia_nada', async () => {
    const { result, registrar } = montar([]);

    await act(() => result.current.leer(new Blob(['foto'])));

    expect(result.current.leido).toEqual({ monto: '270.00', fecha: '2026-10-13', banco: 'Banco Unión' });
    expect(registrar).not.toHaveBeenCalled();
  });

  it('F9_si_el_OCR_falla_pide_escribir_los_datos_a_mano', async () => {
    const falla: LectorComprobante = { leer: async () => Promise.reject(new Error('sin motor')) };
    const servicio: ServicioPagos = { registrar: vi.fn() };
    const cola = colaEnMemoria();
    const { result } = renderHook(() => usePagos({ cola, servicio, lector: falla, reloj }));

    await act(() => result.current.leer(new Blob(['foto'])));

    expect(result.current.aviso).toMatch(/a mano/);
    expect(result.current.leido.monto).toBe('');
  });
});
