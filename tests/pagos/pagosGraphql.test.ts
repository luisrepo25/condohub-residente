import { describe, expect, it, vi } from 'vitest';
import type { OperacionPago } from '../../src/features/pagos/application/puertos';
import { crearServicioPagos } from '../../src/features/pagos/infrastructure/pagosGraphql';

const op: OperacionPago = {
  clave: '11111111-1111-4111-8111-111111111111',
  horaDispositivo: '2026-10-30T15:00:00.000Z',
  estado: 'PENDIENTE',
  intentos: 0,
  datos: { unidadId: 'u1', monto: '270.00', fechaPago: '2026-10-13', banco: 'BNB' },
};

const respuesta = (status: number, cuerpo: unknown = {}) => vi.fn(async () => new Response(JSON.stringify(cuerpo), { status }));

describe('registrarPago por el gateway', () => {
  it('O1_O3_manda_el_token_la_clave_de_idempotencia_y_la_hora_del_dispositivo', async () => {
    const http = respuesta(200, { data: { registrarPago: { id: 'p1', estado: 'PENDIENTE' } } });

    const resultado = await crearServicioPagos(() => 'tok', 'http://gw', http).registrar(op);

    expect(resultado).toEqual({ tipo: 'ok' });
    const [url, init] = http.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://gw/gestion/graphql');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer tok');
    expect(JSON.parse(init.body as string).variables).toMatchObject({ clave: op.clave, hora: op.horaDispositivo, monto: '270.00' });
  });

  it('O3_sin_red_o_con_error_del_servidor_se_reintenta', async () => {
    const sinRed = vi.fn(async () => Promise.reject(new TypeError('Failed to fetch')));
    expect(await crearServicioPagos(() => 't', 'http://gw', sinRed).registrar(op)).toEqual({ tipo: 'reintentar' });
    for (const status of [401, 429, 502, 503]) {
      expect(await crearServicioPagos(() => 't', 'http://gw', respuesta(status)).registrar(op)).toEqual({ tipo: 'reintentar' });
    }
    const interno = respuesta(200, { errors: [{ message: 'x', extensions: { code: 'INTERNAL_ERROR' } }] });
    expect(await crearServicioPagos(() => 't', 'http://gw', interno).registrar(op)).toEqual({ tipo: 'reintentar' });
  });

  it('F8_una_regla_violada_es_un_rechazo_definitivo_con_su_codigo', async () => {
    const http = respuesta(200, { errors: [{ message: 'La fecha del comprobante no puede ser futura', extensions: { code: 'F8' } }] });

    const resultado = await crearServicioPagos(() => 't', 'http://gw', http).registrar(op);

    expect(resultado).toEqual({ tipo: 'rechazada', motivo: 'La fecha del comprobante no puede ser futura (F8)' });
  });
});
