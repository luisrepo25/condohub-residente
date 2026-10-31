import { describe, expect, it, vi } from 'vitest';
import { ErrorReserva } from '../../src/features/reservas/application/puertos';
import type { DatosReserva, Reserva } from '../../src/features/reservas/domain/reserva';
import { crearServicioReservas } from '../../src/features/reservas/infrastructure/reservasHttp';

const datos: DatosReserva = { areaId: 'a1', unidadId: 'u1', fecha: '2026-11-20', horaInicio: '14:00', horaFin: '18:00', invitados: 'Ana\nBeto' };
const json = (status: number, cuerpo: unknown) => vi.fn(async () => new Response(JSON.stringify(cuerpo), { status }));
const servicio = (http: typeof fetch) => crearServicioReservas(() => 'tok', 'http://gw', http);

describe('API de Reservas por el gateway', () => {
  it('O1_O3_solicitar_manda_token_clave_de_idempotencia_instantes_UTC_e_invitados', async () => {
    const http = json(202, { id: 'r1', estado: 'SOLICITADA' });

    await servicio(http).solicitar(datos, 'clave-1');

    const [url, init] = http.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://gw/reservas/api/reservas');
    const cabeceras = init.headers as Record<string, string>;
    expect(cabeceras.authorization).toBe('Bearer tok');
    expect(cabeceras['idempotency-key']).toBe('clave-1');
    expect(JSON.parse(init.body as string)).toEqual({
      areaId: 'a1', unidadId: 'u1',
      inicio: new Date(2026, 10, 20, 14, 0).toISOString(), fin: new Date(2026, 10, 20, 18, 0).toISOString(),
      invitados: [{ nombre: 'Ana' }, { nombre: 'Beto' }],
    });
  });

  it('sin_invitados_no_manda_la_lista', async () => {
    const http = json(202, { id: 'r1' });

    await servicio(http).solicitar({ ...datos, invitados: '' }, 'k');

    expect(JSON.parse((http.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).not.toHaveProperty('invitados');
  });

  it('las_listas_se_aceptan_directas_o_envueltas_en_data', async () => {
    expect(await servicio(json(200, [{ id: 'a' }])).areas()).toEqual([{ id: 'a' }]);
    expect(await servicio(json(200, { data: [{ id: 'b' }] })).listar()).toEqual([{ id: 'b' }]);
  });

  it('R7_cancelar_manda_la_version_para_el_bloqueo_optimista', async () => {
    const http = json(200, { id: 'r1', estado: 'CANCELADA' });

    await servicio(http).cancelar({ id: 'r1', version: 3 } as Reserva, 'k2');

    const [url, init] = http.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://gw/reservas/api/reservas/r1/cancelar');
    expect(JSON.parse(init.body as string)).toEqual({ version: 3 });
  });

  it('las_reglas_violadas_llegan_con_su_codigo_y_un_mensaje_legible', async () => {
    for (const [codigo, texto] of [['R2', 'horario'], ['R3', 'anticipación'], ['R4', 'expensas vencidas'], ['F1', 'no pertenece']] as const) {
      const http = json(422, { code: codigo, detail: 'x' });

      const error = await servicio(http).solicitar(datos, 'k').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ErrorReserva);
      expect((error as ErrorReserva).codigo).toBe(codigo);
      expect((error as ErrorReserva).message.toLowerCase()).toContain(texto);
    }
  });

  it('O6_sin_red_avisa_que_reservar_necesita_conexion', async () => {
    const sinRed = vi.fn(async () => Promise.reject(new TypeError('Failed to fetch')));

    await expect(servicio(sinRed).solicitar(datos, 'k')).rejects.toThrow(/necesita red/);
  });
});
