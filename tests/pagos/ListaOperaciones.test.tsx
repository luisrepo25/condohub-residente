import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { OperacionPago } from '../../src/features/pagos/application/puertos';
import { ListaOperaciones } from '../../src/features/pagos/ui/ListaOperaciones';

afterEach(cleanup);

const op = (cambios: Partial<OperacionPago> = {}, datos: Partial<OperacionPago['datos']> = {}): OperacionPago => ({
  clave: 'k1',
  horaDispositivo: '2026-11-06T15:00:00.000Z',
  estado: 'SINCRONIZADA',
  intentos: 0,
  datos: { unidadId: 'u1', monto: '300.00', fechaPago: '2026-11-06', banco: 'Banco Unión', ...datos },
  ...cambios,
});

describe('la lista de pagos enviados', () => {
  it('muestra_la_fecha_como_dia_mes_anio', () => {
    render(<ListaOperaciones operaciones={[op()]} />);

    expect(screen.getByText('06/11/2026')).toBeTruthy();
  });

  it('F8_muestra_el_banco_y_el_numero_de_operacion_cuando_los_hay', () => {
    render(<ListaOperaciones operaciones={[op({}, { nroOperacion: '48201937' })]} />);

    expect(screen.getByText(/Banco Unión/)).toBeTruthy();
    expect(screen.getByText(/48201937/)).toBeTruthy();
  });

  it('sin_banco_ni_numero_no_inventa_datos', () => {
    render(<ListaOperaciones operaciones={[op({}, { banco: null })]} />);

    expect(screen.queryByText(/Op\./)).toBeNull();
    expect(screen.queryByText(/null/)).toBeNull();
  });

  it('un_pago_rechazado_muestra_su_motivo', () => {
    render(<ListaOperaciones operaciones={[op({ estado: 'RECHAZADA', motivo: 'Ese comprobante ya fue registrado (F8)' })]} />);

    expect(screen.getByText('Ese comprobante ya fue registrado (F8)')).toBeTruthy();
  });

  it('sin_pagos_dice_que_no_hay', () => {
    render(<ListaOperaciones operaciones={[]} />);

    expect(screen.getByText(/todavía no registraste pagos/i)).toBeTruthy();
  });
});
