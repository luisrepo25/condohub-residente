import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ServicioCuenta } from '../../src/features/cuenta/application/useEstadoCuenta';
import type { EstadoCuenta } from '../../src/features/cuenta/domain/estadoCuenta';
import { ResumenCuenta } from '../../src/features/cuenta/ui/ResumenCuenta';

afterEach(cleanup);

const base: EstadoCuenta = {
  unidadId: 'u1', codigo: 'A-101', bloque: 'A', deudaTotal: '800.00', deudaVencida: '0.00', expensasVencidas: 0, saldoAFavor: '0.00', moroso: false,
};
const unidades = [{ unidadId: 'u1', codigo: 'A-101' }];
const con = (c: EstadoCuenta): ServicioCuenta => ({ estadoDeCuenta: vi.fn(async () => c) });
const ver = (c: EstadoCuenta, servicio = con(c)) => render(<ResumenCuenta unidades={unidades} servicio={servicio} alPagar={vi.fn()} />);

describe('el saldo se entiende de un vistazo', () => {
  it('F4_aclara_que_nada_esta_vencido_cuando_hay_deuda_pero_sin_mora', async () => {
    ver(base);

    expect(await screen.findByText('Estás al día')).toBeTruthy();
    expect(screen.getByText(/nada vencido todavía/i)).toBeTruthy();
  });

  it('F4_sin_deuda_no_hace_falta_la_aclaracion', async () => {
    ver({ ...base, deudaTotal: '0.00' });

    expect(await screen.findByText('Estás al día')).toBeTruthy();
    expect(screen.queryByText(/nada vencido todavía/i)).toBeNull();
  });

  it('F4_con_mora_no_muestra_la_aclaracion', async () => {
    ver({ ...base, moroso: true, deudaVencida: '540.00', expensasVencidas: 2 });

    expect(await screen.findByText('2 expensa(s) vencida(s)')).toBeTruthy();
    expect(screen.queryByText(/nada vencido todavía/i)).toBeNull();
  });

  it('la_deuda_vencida_se_marca_en_peligro_solo_si_hay', async () => {
    const { unmount } = ver({ ...base, moroso: true, deudaVencida: '540.00' });
    expect((await screen.findByText('540.00')).className).toContain('ch-monto--peligro');
    unmount();

    ver(base);
    expect((await screen.findAllByText('0.00'))[0]!.className).not.toContain('ch-monto--peligro');
  });

  it('el_saldo_a_favor_se_marca_en_verde_solo_si_hay', async () => {
    ver({ ...base, saldoAFavor: '700.00' });

    expect((await screen.findByText('700.00')).className).toContain('ch-monto--ok');
  });

  it('mientras_carga_muestra_un_esqueleto_y_no_cifras_inventadas', () => {
    const { container } = ver(base, { estadoDeCuenta: vi.fn(() => new Promise<EstadoCuenta>(() => {})) });

    expect(container.querySelectorAll('.ch-esqueleto').length).toBeGreaterThan(0);
    expect(screen.queryByText('—')).toBeNull();
  });

  it('el_boton_actualizar_vuelve_a_pedir_el_saldo_y_dice_cuando_se_actualizo', async () => {
    const servicio = con(base);
    ver(base, servicio);
    await screen.findByText('Estás al día');

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar saldo' }));

    await screen.findByText(/actualizado a las/i);
    expect(servicio.estadoDeCuenta).toHaveBeenCalledTimes(2);
  });
});
