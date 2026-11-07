import { describe, expect, it, vi } from 'vitest';
import type { OperacionPago } from '../../src/features/pagos/application/puertos';
import { crearServicioPagos } from '../../src/features/pagos/infrastructure/pagosGraphql';

const base: OperacionPago = {
  clave: 'a0a0a0a0-0000-4000-8000-000000000001',
  horaDispositivo: '2026-11-06T15:00:00.000Z',
  estado: 'PENDIENTE',
  intentos: 0,
  datos: { unidadId: 'u1', monto: '300.00', fechaPago: '2026-11-05', banco: 'Banco Unión' },
};

function respuesta(cuerpo: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(cuerpo), { status: 200 }));
}

describe('F8 · registrarPago con número de operación', () => {
  it('F8_la_mutation_declara_y_envia_el_numero_de_operacion', async () => {
    const http = respuesta({ data: { registrarPago: { id: 'p1', estado: 'PENDIENTE' } } });
    const op = { ...base, datos: { ...base.datos, nroOperacion: '48201937' } };

    await crearServicioPagos(() => 'tok', 'http://gw', http).registrar(op);

    const [, init] = http.mock.calls[0] as unknown as [string, RequestInit];
    const cuerpo = JSON.parse(init.body as string) as { query: string; variables: Record<string, unknown> };
    expect(cuerpo.query).toContain('$nroOperacion: String');
    expect(cuerpo.query).toContain('nroOperacion: $nroOperacion');
    expect(cuerpo.variables).toMatchObject({ nroOperacion: '48201937', monto: '300.00' });
  });

  it('F8_sin_numero_de_operacion_la_variable_no_viaja', async () => {
    const http = respuesta({ data: { registrarPago: { id: 'p1', estado: 'PENDIENTE' } } });

    await crearServicioPagos(() => 'tok', 'http://gw', http).registrar(base);

    const [, init] = http.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string).variables).not.toHaveProperty('nroOperacion');
  });

  it('F8_un_comprobante_duplicado_es_un_rechazo_definitivo_con_su_codigo', async () => {
    const http = respuesta({ errors: [{ message: 'Ese comprobante ya fue registrado (Banco Unión, operación 48201937)', extensions: { code: 'F8' } }] });

    const resultado = await crearServicioPagos(() => 'tok', 'http://gw', http).registrar(base);

    expect(resultado).toEqual({ tipo: 'rechazada', motivo: 'Ese comprobante ya fue registrado (Banco Unión, operación 48201937) (F8)' });
  });
});
