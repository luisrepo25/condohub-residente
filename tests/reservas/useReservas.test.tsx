import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorReserva, type ServicioReservas } from '../../src/features/reservas/application/puertos';
import { useReservas } from '../../src/features/reservas/application/useReservas';
import type { Area, DatosReserva, Reserva } from '../../src/features/reservas/domain/reserva';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const area: Area = { id: 'a1', codigo: 'SALON', nombre: 'Salón de eventos', aforo: 80, horaApertura: '08:00', horaCierre: '23:00', bloqueMinimoHoras: 2, costoUso: '300.00', garantia: '500.00' };
const reserva = (estado: Reserva['estado'], extra: Partial<Reserva> = {}): Reserva => ({
  id: 'r1', areaId: 'a1', unidadId: 'u1', inicio: '2026-11-20T18:00:00.000Z', fin: '2026-11-20T22:00:00.000Z', estado, costoUso: '300.00', garantia: '500.00', version: 0, ...extra,
});
const datos: DatosReserva = { areaId: 'a1', unidadId: 'u1', fecha: '2026-11-20', horaInicio: '14:00', horaFin: '18:00', invitados: 'Ana' };

function servicioCon(listas: Reserva[][], solicitar = vi.fn(async () => reserva('SOLICITADA'))) {
  const cola = [...listas];
  const servicio: ServicioReservas = {
    areas: async () => [area],
    listar: async () => cola.shift() ?? cola.at(-1) ?? listas.at(-1) ?? [],
    solicitar,
    cancelar: vi.fn(async (r) => ({ ...r, estado: 'CANCELADA' as const })),
  };
  return { servicio, solicitar };
}

describe('useReservas', () => {
  it('R1_carga_las_areas_y_las_reservas_al_entrar', async () => {
    const { servicio } = servicioCon([[reserva('CONFIRMADA')]]);

    const { result } = renderHook(() => useReservas({ servicio }));

    await waitFor(() => expect(result.current.areas).toEqual([area]));
    await waitFor(() => expect(result.current.reservas).toHaveLength(1));
  });

  it('R2_una_solicitud_con_datos_invalidos_no_llega_al_servidor', async () => {
    const { servicio, solicitar } = servicioCon([[]]);
    const { result } = renderHook(() => useReservas({ servicio }));

    let enviada = true;
    await act(async () => void (enviada = await result.current.solicitar({ ...datos, fecha: '' })));

    expect(enviada).toBe(false);
    expect(result.current.errores.fecha).toBeTruthy();
    expect(solicitar).not.toHaveBeenCalled();
  });

  it('O1_O3_reintentar_con_los_mismos_datos_reutiliza_la_clave_y_con_datos_nuevos_genera_otra', async () => {
    const solicitar = vi.fn().mockRejectedValueOnce(new ErrorReserva('Sin conexión')).mockResolvedValue(reserva('SOLICITADA'));
    const { servicio } = servicioCon([[]], solicitar);
    let n = 0;
    const { result } = renderHook(() => useReservas({ servicio, uuid: () => `clave-${++n}` }));

    await act(async () => void (await result.current.solicitar(datos)));
    await act(async () => void (await result.current.solicitar(datos)));
    await act(async () => void (await result.current.solicitar({ ...datos, fecha: '2026-11-21' })));

    expect(solicitar.mock.calls.map((c) => (c as unknown as [unknown, string])[1])).toEqual(['clave-1', 'clave-1', 'clave-2']);
  });

  it('R4_si_Reservas_rechaza_se_muestra_el_motivo_de_la_regla', async () => {
    const solicitar = vi.fn().mockRejectedValue(new ErrorReserva('Tu unidad tiene expensas vencidas', 'R4'));
    const { servicio } = servicioCon([[]], solicitar);
    const { result } = renderHook(() => useReservas({ servicio }));

    await act(async () => void (await result.current.solicitar(datos)));

    expect(result.current.error).toContain('expensas vencidas');
  });

  it('S1_mientras_la_saga_confirma_se_vuelve_a_consultar_hasta_que_queda_CONFIRMADA', async () => {
    const { servicio } = servicioCon([[reserva('SOLICITADA')], [reserva('SOLICITADA')], [reserva('CONFIRMADA')]]);

    const { result } = renderHook(() => useReservas({ servicio, intervaloMs: 10 }));

    await waitFor(() => expect(result.current.reservas[0]?.estado).toBe('CONFIRMADA'));
  });

  it('S2_si_la_saga_falla_la_reserva_queda_FALLIDA_con_su_motivo', async () => {
    const { servicio } = servicioCon([[reserva('SOLICITADA')], [reserva('FALLIDA', { motivo: 'Acceso no emitió los pases a tiempo' })]]);

    const { result } = renderHook(() => useReservas({ servicio, intervaloMs: 10 }));

    await waitFor(() => expect(result.current.reservas[0]).toMatchObject({ estado: 'FALLIDA', motivo: expect.stringContaining('Acceso') }));
  });

  it('R7_cancelar_pide_la_cancelacion_con_la_version_y_refresca_la_lista', async () => {
    const { servicio } = servicioCon([[reserva('CONFIRMADA')], [reserva('CANCELADA')]]);
    const { result } = renderHook(() => useReservas({ servicio }));
    await waitFor(() => expect(result.current.reservas).toHaveLength(1));

    await act(async () => void (await result.current.cancelar(reserva('CONFIRMADA'))));

    expect(servicio.cancelar).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1', version: 0 }), expect.any(String));
    await waitFor(() => expect(result.current.reservas[0]?.estado).toBe('CANCELADA'));
  });

  it('no_deja_temporizadores_al_desmontar', async () => {
    vi.useFakeTimers();
    const { servicio } = servicioCon([[reserva('SOLICITADA')]]);
    const listar = vi.spyOn(servicio, 'listar');
    const { unmount } = renderHook(() => useReservas({ servicio, intervaloMs: 1000 }));
    await act(async () => void (await vi.advanceTimersByTimeAsync(0)));
    const llamadas = listar.mock.calls.length;

    unmount();
    await vi.advanceTimersByTimeAsync(10000);

    expect(listar.mock.calls.length).toBe(llamadas);
  });
});
