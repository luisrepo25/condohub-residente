import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ServicioCuenta } from '../../src/features/cuenta/application/useEstadoCuenta';
import type { EstadoCuenta } from '../../src/features/cuenta/domain/estadoCuenta';
import { ResumenCuenta } from '../../src/features/cuenta/ui/ResumenCuenta';

afterEach(cleanup);

const cuenta: EstadoCuenta = {
  unidadId: 'u1', codigo: 'B-101', bloque: 'B', deudaTotal: '810.00', deudaVencida: '540.00', expensasVencidas: 2, saldoAFavor: '0.00', moroso: true,
};
const unidades = [{ unidadId: 'u1', codigo: 'B-101' }];
const con = (c: EstadoCuenta): ServicioCuenta => ({ estadoDeCuenta: vi.fn(async () => c) });

describe('resumen del saldo', () => {
  it('F4_muestra_los_montos_tal_como_los_entrega_Gestion', async () => {
    render(<ResumenCuenta unidades={unidades} servicio={con(cuenta)} alPagar={vi.fn()} />);

    expect(await screen.findByText('810.00')).toBeTruthy();
    expect(screen.getByText('540.00')).toBeTruthy();
    expect(screen.getByText('2 expensa(s) vencida(s)')).toBeTruthy();
  });

  it('F4_la_mora_la_decide_Gestion_no_el_monto', async () => {
    render(<ResumenCuenta unidades={unidades} servicio={con({ ...cuenta, moroso: false })} alPagar={vi.fn()} />);

    expect(await screen.findByText('Estás al día')).toBeTruthy();
  });

  it('el_boton_lleva_a_pagar', () => {
    const alPagar = vi.fn();
    render(<ResumenCuenta unidades={unidades} servicio={con(cuenta)} alPagar={alPagar} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pagar' }));

    expect(alPagar).toHaveBeenCalled();
  });

  it('si_Gestion_falla_avisa_sin_romper_el_portal_ni_inventar_cifras', async () => {
    const servicio: ServicioCuenta = { estadoDeCuenta: vi.fn(async () => Promise.reject(new Error('502'))) };
    render(<ResumenCuenta unidades={unidades} servicio={servicio} alPagar={vi.fn()} />);

    expect(await screen.findByText('No se pudo cargar tu saldo por ahora.')).toBeTruthy();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});
