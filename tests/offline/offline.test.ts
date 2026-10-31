import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from 'vitest';
import { crearColaIndexedDb } from '../../src/offline/colaIndexedDb';
import type { Operacion } from '../../src/offline/operacion';
import { esperaExponencial, sincronizarPendientes } from '../../src/offline/sincronizar';

let n = 0;
const nueva = (hora: string, clave = `k${++n}`): Operacion<{ monto: string }> => ({
  clave, horaDispositivo: hora, estado: 'PENDIENTE', intentos: 0, datos: { monto: '10.00' },
});
const colaNueva = () => crearColaIndexedDb<{ monto: string }>(`bd-${++n}`);

describe('cola local en IndexedDB (O2)', () => {
  it('O2_guarda_y_lista_las_operaciones_de_la_mas_antigua_a_la_mas_nueva', async () => {
    const cola = colaNueva();
    await cola.agregar(nueva('2026-10-30T12:00:00Z', 'b'));
    await cola.agregar(nueva('2026-10-30T10:00:00Z', 'a'));
    expect((await cola.listar()).map((o) => o.clave)).toEqual(['a', 'b']);
  });

  it('O3_la_clave_de_idempotencia_no_se_puede_repetir', async () => {
    const cola = colaNueva();
    await cola.agregar(nueva('2026-10-30T10:00:00Z', 'x'));
    await expect(cola.agregar(nueva('2026-10-30T11:00:00Z', 'x'))).rejects.toBeDefined();
    expect(await cola.listar()).toHaveLength(1);
  });

  it('O2_actualizar_cambia_solo_el_estado_y_conserva_los_datos', async () => {
    const cola = colaNueva();
    await cola.agregar(nueva('2026-10-30T10:00:00Z', 'x'));
    await cola.actualizar('x', { estado: 'RECHAZADA', motivo: 'F8' });
    expect((await cola.listar())[0]).toMatchObject({ estado: 'RECHAZADA', motivo: 'F8', datos: { monto: '10.00' } });
  });
});

describe('sincronización (O2, O3, O4)', () => {
  it('O4_solo_la_respuesta_2xx_marca_sincronizada_y_un_4xx_rechaza_con_motivo', async () => {
    const cola = colaNueva();
    await cola.agregar(nueva('2026-10-30T10:00:00Z', 'a'));
    await cola.agregar(nueva('2026-10-30T11:00:00Z', 'b'));
    const enviar = vi.fn(async (o: Operacion<unknown>) =>
      o.clave === 'a' ? ({ tipo: 'ok' } as const) : ({ tipo: 'rechazada', motivo: 'La fecha no puede ser futura (F8)' } as const));

    const resumen = await sincronizarPendientes(cola, enviar);

    expect(resumen).toEqual({ sincronizadas: 1, rechazadas: 1, pendientes: 0 });
    const estados = Object.fromEntries((await cola.listar()).map((o) => [o.clave, o.estado]));
    expect(estados).toEqual({ a: 'SINCRONIZADA', b: 'RECHAZADA' });
  });

  it('O3_sin_red_sigue_pendiente_con_la_misma_clave_y_se_detiene_al_primer_fallo', async () => {
    const cola = colaNueva();
    await cola.agregar(nueva('2026-10-30T10:00:00Z', 'a'));
    await cola.agregar(nueva('2026-10-30T11:00:00Z', 'b'));
    const enviar = vi.fn(async () => ({ tipo: 'reintentar' }) as const);

    const resumen = await sincronizarPendientes(cola, enviar);

    expect(enviar).toHaveBeenCalledTimes(1);
    expect(resumen.pendientes).toBe(2);
    const lista = await cola.listar();
    expect(lista.map((o) => [o.clave, o.estado, o.intentos])).toEqual([['a', 'PENDIENTE', 1], ['b', 'PENDIENTE', 0]]);
  });

  it('O3_reenviar_tras_volver_la_red_no_duplica_lo_ya_sincronizado', async () => {
    const cola = colaNueva();
    await cola.agregar(nueva('2026-10-30T10:00:00Z', 'a'));
    const enviar = vi.fn(async () => ({ tipo: 'ok' }) as const);

    await sincronizarPendientes(cola, enviar);
    await sincronizarPendientes(cola, enviar);

    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it('O2_la_espera_crece_exponencialmente_con_tope_de_5_minutos', () => {
    expect([0, 1, 2, 3].map(esperaExponencial)).toEqual([1000, 2000, 4000, 8000]);
    expect(esperaExponencial(20)).toBe(300000);
  });
});
