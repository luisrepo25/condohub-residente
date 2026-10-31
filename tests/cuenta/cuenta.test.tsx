import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ServicioCuenta } from '../../src/features/cuenta/application/useEstadoCuenta';
import type { EstadoCuenta } from '../../src/features/cuenta/domain/estadoCuenta';
import { crearServicioCuenta } from '../../src/features/cuenta/infrastructure/cuentaGraphql';
import { EstadoCuentaPage } from '../../src/features/cuenta/ui/EstadoCuentaPage';

afterEach(cleanup);

const cuenta: EstadoCuenta = {
  unidadId: 'u1', codigo: 'B-101', bloque: 'B', deudaTotal: '810.00', deudaVencida: '540.00', expensasVencidas: 2, saldoAFavor: '0.00', moroso: true,
};
const unidades = [{ unidadId: 'u1', codigo: 'B-101' }];

describe('estado de cuenta (F1, F4, F7)', () => {
  it('F4_muestra_los_montos_tal_como_los_entrega_Gestion_y_avisa_si_es_morosa', async () => {
    const servicio: ServicioCuenta = { estadoDeCuenta: vi.fn(async () => cuenta) };

    render(<EstadoCuentaPage unidades={unidades} servicio={servicio} />);

    expect(await screen.findByText(/Unidad morosa: 2 expensa/)).toBeTruthy();
    expect(screen.getByText('540.00')).toBeTruthy();
  });

  it('F1_si_Gestion_niega_la_unidad_se_muestra_el_error', async () => {
    const servicio: ServicioCuenta = { estadoDeCuenta: vi.fn(async () => Promise.reject(new Error('No es tu unidad (F1)'))) };

    render(<EstadoCuentaPage unidades={unidades} servicio={servicio} />);

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('F1'));
  });

  it('el_adaptador_consulta_estadoDeCuenta_con_el_token_del_shell', async () => {
    const http = vi.fn(async () => new Response(JSON.stringify({ data: { estadoDeCuenta: cuenta } })));

    expect(await crearServicioCuenta(() => 'tok', 'http://gw', http).estadoDeCuenta('u1')).toEqual(cuenta);

    const [url, init] = http.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://gw/gestion/graphql');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer tok');
  });
});
