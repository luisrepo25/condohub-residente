import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SimuladorPago } from '../../src/features/pagos/application/puertos';
import { useSimulacionPago } from '../../src/features/pagos/application/useSimulacionPago';
import type { SimulacionPago } from '../../src/features/pagos/domain/simulacion';

const SIMULACION: SimulacionPago = { excedente: '0.00', lineas: [] };

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const avanzar = (ms: number) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));

describe('F7 · la vista previa de a qué se aplicará el pago', () => {
  it('F7_espera_a_que_el_residente_termine_de_escribir_antes_de_pedirla', async () => {
    const simular = vi.fn(async () => SIMULACION);
    const simulador: SimuladorPago = { simular };
    const { result, rerender } = renderHook(({ monto }) => useSimulacionPago(simulador, 'u1', monto, 400), { initialProps: { monto: '3' } });

    rerender({ monto: '30' });
    rerender({ monto: '300' });
    await avanzar(399);
    expect(simular).not.toHaveBeenCalled();
    expect(result.current.estado).toBe('calculando');

    await avanzar(1);
    expect(simular).toHaveBeenCalledTimes(1);
    expect(simular).toHaveBeenCalledWith('u1', '300.00');
    expect(result.current.estado).toBe('lista');
    expect(result.current.simulacion).toEqual(SIMULACION);
  });

  it('F7_con_un_monto_invalido_o_vacio_no_pide_nada', async () => {
    const simular = vi.fn(async () => SIMULACION);
    const { result } = renderHook(() => useSimulacionPago({ simular }, 'u1', '', 400));

    await avanzar(1000);

    expect(simular).not.toHaveBeenCalled();
    expect(result.current.estado).toBe('inactiva');
  });

  it('sin_simulador_la_vista_previa_queda_inactiva', async () => {
    const { result } = renderHook(() => useSimulacionPago(null, 'u1', '300', 400));

    await avanzar(1000);

    expect(result.current.estado).toBe('inactiva');
  });

  it('si_no_se_puede_calcular_lo_dice_y_no_bloquea', async () => {
    const simulador: SimuladorPago = { simular: vi.fn(async () => null) };
    const { result } = renderHook(() => useSimulacionPago(simulador, 'u1', '300', 400));

    await avanzar(400);

    expect(result.current.estado).toBe('no-disponible');
    expect(result.current.simulacion).toBeNull();
  });

  it('una_respuesta_vieja_no_pisa_a_la_del_monto_actual', async () => {
    const respuestas = new Map<string, (s: SimulacionPago) => void>();
    const simulador: SimuladorPago = { simular: (_u, monto) => new Promise((ok) => respuestas.set(monto, ok as (s: SimulacionPago) => void)) };
    const { result, rerender } = renderHook(({ monto }) => useSimulacionPago(simulador, 'u1', monto, 100), { initialProps: { monto: '100' } });
    await avanzar(100);
    rerender({ monto: '200' });
    await avanzar(100);

    await act(async () => {
      respuestas.get('200.00')?.({ excedente: '200.00', lineas: [] });
      respuestas.get('100.00')?.({ excedente: '100.00', lineas: [] });
    });

    expect(result.current.simulacion?.excedente).toBe('200.00');
  });

  it('al_desmontar_se_cancela_la_espera_pendiente', async () => {
    const simular = vi.fn(async () => SIMULACION);
    const { unmount } = renderHook(() => useSimulacionPago({ simular }, 'u1', '300', 400));

    unmount();
    await avanzar(1000);

    expect(simular).not.toHaveBeenCalled();
  });
});
