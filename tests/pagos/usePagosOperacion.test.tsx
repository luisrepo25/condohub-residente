import { act, cleanup, renderHook } from '@testing-library/react';
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

const reloj = { ahora: () => new Date('2026-11-06T15:00:00Z') };
const conNumero: LectorComprobante = {
  leer: async () => 'Banco Unión\nFecha: 05/11/2026\nNro. de operación: 48201937\nMonto: Bs 300.00',
};
const formulario = { monto: '300', fecha: '2026-11-05', banco: 'Banco Unión' };

function montar(lector: LectorComprobante) {
  const registrar = vi.fn(async (_op: OperacionPago): Promise<ResultadoEnvio> => ({ tipo: 'ok' }));
  const servicio: ServicioPagos = { registrar };
  const cola = colaEnMemoria();
  const vista = renderHook(() => usePagos({ cola, servicio, lector, reloj, uuid: () => 'uuid-fijo' }));
  return { ...vista, registrar };
}

describe('F8 · número de operación del comprobante', () => {
  it('F8_el_OCR_prellena_el_numero_de_operacion_y_no_envia_nada', async () => {
    const { result, registrar } = montar(conNumero);

    await act(() => result.current.leer(new Blob(['foto'])));

    expect(result.current.leido).toEqual({ monto: '300.00', fecha: '2026-11-05', banco: 'Banco Unión', nroOperacion: '48201937' });
    expect(registrar).not.toHaveBeenCalled();
  });

  it('F8_el_pago_enviado_lleva_el_numero_de_operacion_que_el_residente_reviso', async () => {
    const { result, registrar } = montar(conNumero);

    await act(() => result.current.enviar('u1', { ...formulario, nroOperacion: '  48201937 ' }));

    expect(registrar.mock.calls[0]![0].datos).toEqual({
      unidadId: 'u1',
      monto: '300.00',
      fechaPago: '2026-11-05',
      banco: 'Banco Unión',
      nroOperacion: '48201937',
    });
  });

  it('F8_sin_numero_de_operacion_el_pago_se_envia_igual_y_sin_ese_dato', async () => {
    const { result, registrar } = montar(conNumero);

    await act(() => result.current.enviar('u1', formulario));
    await act(() => result.current.enviar('u1', { ...formulario, nroOperacion: '   ' }));

    for (const [op] of registrar.mock.calls) expect(op.datos).not.toHaveProperty('nroOperacion');
  });

  it('F8_un_comprobante_sin_numero_deja_ese_campo_fuera_de_lo_leido', async () => {
    const sinNumero: LectorComprobante = { leer: async () => 'Banco Unión Monto Bs. 270,00 Fecha 13/10/2026' };
    const { result } = montar(sinNumero);

    await act(() => result.current.leer(new Blob(['foto'])));

    expect(result.current.leido).not.toHaveProperty('nroOperacion');
  });
});
