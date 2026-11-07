import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SimuladorContexto } from '../../src/features/pagos/application/simuladorContexto';
import type { SimuladorPago } from '../../src/features/pagos/application/puertos';
import type { SimulacionPago } from '../../src/features/pagos/domain/simulacion';
import { VistaPreviaImputacion } from '../../src/features/pagos/ui/VistaPreviaImputacion';

afterEach(cleanup);

function ver(simulador: SimuladorPago | null, monto = '300') {
  return render(
    <SimuladorContexto.Provider value={simulador}>
      <VistaPreviaImputacion unidadId="u1" monto={monto} />
    </SimuladorContexto.Provider>,
  );
}

const REPARTO: SimulacionPago = {
  excedente: '0.00',
  lineas: [{ cargoId: 'c1', tipo: 'USO_AREA', concepto: 'Uso de SALON', fechaVencimiento: '2026-12-10', saldoActual: '500.00', aplicado: '300.00', saldoResultante: '200.00' }],
};

describe('F7 · «se aplicará a» antes de enviar el pago', () => {
  it('F7_muestra_el_cargo_al_que_llega_el_pago_su_saldo_antes_y_despues', async () => {
    ver({ simular: vi.fn(async () => REPARTO) });

    expect(await screen.findByText(/Se aplicará a/i)).toBeTruthy();
    expect(screen.getByText(/Uso de SALON/)).toBeTruthy();
    expect(screen.getByText(/10\/12\/2026/)).toBeTruthy();
    expect(screen.getByText(/500\.00/)).toBeTruthy();
    expect(screen.getByText(/200\.00/)).toBeTruthy();
  });

  it('F7_avisa_del_saldo_a_favor_cuando_sobra', async () => {
    ver({ simular: vi.fn(async () => ({ excedente: '160.00', lineas: [] })) });

    expect(await screen.findByText(/saldo a favor/i)).toBeTruthy();
    expect(screen.getByText(/160\.00/)).toBeTruthy();
  });

  it('F7_sin_cargos_pendientes_todo_el_pago_seria_saldo_a_favor', async () => {
    ver({ simular: vi.fn(async () => ({ excedente: '300.00', lineas: [] })) });

    expect(await screen.findByText(/no tienes cargos pendientes/i)).toBeTruthy();
  });

  it('F9_aclara_que_es_una_estimacion_y_que_el_administrador_confirma', async () => {
    ver({ simular: vi.fn(async () => REPARTO) });

    expect(await screen.findByText(/estimación/i)).toBeTruthy();
    expect(screen.getByText(/administrador/i)).toBeTruthy();
  });

  it('si_no_se_puede_calcular_lo_dice_con_role_status_y_deja_enviar_igual', async () => {
    ver({ simular: vi.fn(async () => null) });

    const aviso = await screen.findByText(/no se pudo calcular/i);
    expect(aviso.closest('[role="status"]')).toBeTruthy();
  });

  it('sin_monto_o_sin_simulador_no_pinta_nada', () => {
    const vacio = ver({ simular: vi.fn(async () => REPARTO) }, '');
    expect(vacio.container.innerHTML).toBe('');
    cleanup();
    expect(ver(null).container.innerHTML).toBe('');
  });
});
