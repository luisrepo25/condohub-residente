import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEstadoCuenta, type ServicioCuenta } from '../../src/features/cuenta/application/useEstadoCuenta';
import type { EstadoCuenta } from '../../src/features/cuenta/domain/estadoCuenta';

const cuenta = (deudaTotal: string): EstadoCuenta => ({
  unidadId: 'u1', codigo: 'A-101', bloque: 'A', deudaTotal, deudaVencida: '0.00', expensasVencidas: 0, saldoAFavor: '0.00', moroso: false,
});

function visibilidad(estado: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: estado, configurable: true });
}

beforeEach(() => {
  vi.useFakeTimers();
  visibilidad('visible');
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  visibilidad('visible');
});

const avanzar = (ms: number) => act(async () => void (await vi.advanceTimersByTimeAsync(ms)));
const servicioCon = (...respuestas: (EstadoCuenta | Error)[]): ServicioCuenta & { estadoDeCuenta: ReturnType<typeof vi.fn> } => {
  const cola = [...respuestas];
  return {
    estadoDeCuenta: vi.fn(async () => {
      const r = cola.length > 1 ? cola.shift()! : cola[0]!;
      if (r instanceof Error) throw r;
      return r;
    }),
  };
};

describe('F4 · el saldo se mantiene al día sin recargar la página', () => {
  it('F4_se_vuelve_a_pedir_cada_intervalo_y_muestra_el_dato_nuevo', async () => {
    const servicio = servicioCon(cuenta('800.00'), cuenta('500.00'));
    const { result } = renderHook(() => useEstadoCuenta(servicio, 'u1', 30_000));
    await avanzar(0);
    expect(result.current.cuenta?.deudaTotal).toBe('800.00');

    await avanzar(30_000);

    expect(servicio.estadoDeCuenta).toHaveBeenCalledTimes(2);
    expect(result.current.cuenta?.deudaTotal).toBe('500.00');
  });

  it('F4_mientras_actualiza_sigue_mostrando_el_ultimo_dato_y_no_parpadea', async () => {
    let liberar: (c: EstadoCuenta) => void = () => {};
    const servicio: ServicioCuenta = {
      estadoDeCuenta: vi.fn().mockResolvedValueOnce(cuenta('800.00')).mockImplementationOnce(() => new Promise((ok) => (liberar = ok))),
    };
    const { result } = renderHook(() => useEstadoCuenta(servicio, 'u1', 30_000));
    await avanzar(0);

    await avanzar(30_000);

    expect(result.current.cuenta?.deudaTotal).toBe('800.00');
    expect(result.current.actualizando).toBe(true);
    await act(async () => liberar(cuenta('500.00')));
    expect(result.current.actualizando).toBe(false);
  });

  it('F4_al_volver_a_la_pestana_o_enfocar_la_ventana_se_actualiza', async () => {
    const servicio = servicioCon(cuenta('800.00'), cuenta('500.00'));
    renderHook(() => useEstadoCuenta(servicio, 'u1', 30_000));
    await avanzar(0);

    await act(async () => void document.dispatchEvent(new Event('visibilitychange')));
    await avanzar(0);

    expect(servicio.estadoDeCuenta).toHaveBeenCalledTimes(2);
    await act(async () => void window.dispatchEvent(new Event('focus')));
    await avanzar(0);
    expect(servicio.estadoDeCuenta).toHaveBeenCalledTimes(3);
  });

  it('F4_con_la_pestana_oculta_no_gasta_red', async () => {
    const servicio = servicioCon(cuenta('800.00'));
    renderHook(() => useEstadoCuenta(servicio, 'u1', 30_000));
    await avanzar(0);
    visibilidad('hidden');

    await avanzar(120_000);
    await act(async () => void window.dispatchEvent(new Event('focus')));

    expect(servicio.estadoDeCuenta).toHaveBeenCalledTimes(1);
  });

  it('F4_recargar_pide_el_dato_al_momento', async () => {
    const servicio = servicioCon(cuenta('800.00'), cuenta('500.00'));
    const { result } = renderHook(() => useEstadoCuenta(servicio, 'u1', 30_000));
    await avanzar(0);

    await act(async () => void (await result.current.recargar()));

    expect(result.current.cuenta?.deudaTotal).toBe('500.00');
  });

  it('F4_si_falla_una_actualizacion_conserva_el_ultimo_dato_y_no_muestra_error', async () => {
    const servicio = servicioCon(cuenta('800.00'), new Error('502'));
    const { result } = renderHook(() => useEstadoCuenta(servicio, 'u1', 30_000));
    await avanzar(0);

    await avanzar(30_000);

    expect(result.current.cuenta?.deudaTotal).toBe('800.00');
    expect(result.current.error).toBeNull();
  });

  it('F4_si_falla_la_primera_carga_si_muestra_el_error', async () => {
    const servicio = servicioCon(new Error('No es tu unidad (F1)'));
    const { result } = renderHook(() => useEstadoCuenta(servicio, 'u1', 30_000));

    await avanzar(0);

    expect(result.current.error).toBe('No es tu unidad (F1)');
    expect(result.current.cuenta).toBeNull();
  });

  it('F4_guarda_cuando_se_actualizo_por_ultima_vez', async () => {
    vi.setSystemTime(new Date('2026-11-06T22:41:00Z'));
    const servicio = servicioCon(cuenta('800.00'));
    const { result } = renderHook(() => useEstadoCuenta(servicio, 'u1', 30_000));

    await avanzar(0);

    expect(result.current.actualizadoEn).toBe(new Date('2026-11-06T22:41:00Z').getTime());
  });

  it('F4_al_desmontar_deja_de_pedir', async () => {
    const servicio = servicioCon(cuenta('800.00'));
    const { unmount } = renderHook(() => useEstadoCuenta(servicio, 'u1', 30_000));
    await avanzar(0);
    unmount();

    await avanzar(120_000);
    await act(async () => void window.dispatchEvent(new Event('focus')));

    expect(servicio.estadoDeCuenta).toHaveBeenCalledTimes(1);
  });
});
