import { describe, expect, it, vi } from 'vitest';
import { crearSimuladorPago } from '../../src/features/pagos/infrastructure/simulacionGraphql';

const SIMULACION = {
  excedente: '0.00',
  lineas: [
    { cargoId: 'c1', tipo: 'USO_AREA', concepto: 'Uso de SALON', fechaVencimiento: '2026-12-10', saldoActual: '500.00', aplicado: '300.00', saldoResultante: '200.00' },
  ],
};

function respuesta(cuerpo: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(cuerpo), { status }));
}

describe('F7 · simularPago por el gateway (solo lectura)', () => {
  it('F7_pide_simularPago_a_Gestion_con_el_token_y_devuelve_el_reparto', async () => {
    const http = respuesta({ data: { simularPago: SIMULACION } });

    const resultado = await crearSimuladorPago(() => 'tok', 'http://gw', http).simular('u1', '300.00');

    expect(resultado).toEqual(SIMULACION);
    const [url, init] = http.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://gw/gestion/graphql');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer tok');
    const cuerpo = JSON.parse(init.body as string) as { query: string; variables: Record<string, string> };
    expect(cuerpo.query).toContain('simularPago(unidadId: $unidadId, monto: $monto)');
    expect(cuerpo.variables).toEqual({ unidadId: 'u1', monto: '300.00' });
  });

  it('F9_nunca_usa_una_mutation', async () => {
    const http = respuesta({ data: { simularPago: SIMULACION } });

    await crearSimuladorPago(() => 'tok', 'http://gw', http).simular('u1', '300.00');

    const [, init] = http.mock.calls[0] as unknown as [string, RequestInit];
    expect((JSON.parse(init.body as string) as { query: string }).query).not.toMatch(/mutation/i);
  });

  it('sin_red_o_con_error_devuelve_null_y_no_rompe_el_formulario', async () => {
    const sinRed = vi.fn(async () => Promise.reject(new TypeError('Failed to fetch')));
    expect(await crearSimuladorPago(() => 't', 'http://gw', sinRed).simular('u1', '10.00')).toBeNull();
    expect(await crearSimuladorPago(() => 't', 'http://gw', respuesta({}, 502)).simular('u1', '10.00')).toBeNull();
    const regla = respuesta({ errors: [{ message: 'no', extensions: { code: 'F1' } }] });
    expect(await crearSimuladorPago(() => 't', 'http://gw', regla).simular('u1', '10.00')).toBeNull();
  });
});
