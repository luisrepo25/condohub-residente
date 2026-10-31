import { describe, expect, it } from 'vitest';
import { formatearMonto, leerComprobante, validarPago } from '../../src/features/pagos/domain/comprobante';

const HOY = '2026-10-30';

describe('F9 · el OCR solo prellena monto, fecha y banco', () => {
  it('F9_lee_monto_fecha_y_banco_de_un_comprobante_en_espanol', () => {
    const texto = 'BANCO UNIÓN\nTransferencia exitosa\nFecha: 13/10/2026\nMonto: Bs. 1.250,50\nNro 998877';
    expect(leerComprobante(texto)).toEqual({ monto: '1250.50', fecha: '2026-10-13', banco: 'Banco Unión' });
  });

  it('F9_acepta_punto_decimal_y_fecha_ISO', () => {
    const texto = 'Mercantil Santa Cruz  Importe 270.00 BOB  2026-10-20';
    expect(leerComprobante(texto)).toEqual({ monto: '270.00', fecha: '2026-10-20', banco: 'Mercantil Santa Cruz' });
  });

  it('F9_lo_que_no_se_lee_queda_vacio_para_que_el_residente_lo_complete', () => {
    expect(leerComprobante('texto ilegible ###')).toEqual({ monto: '', fecha: '', banco: '' });
  });

  it('F9_una_fecha_imposible_no_se_toma_como_fecha', () => {
    expect(leerComprobante('Monto 100,00 Fecha 31/02/2026').fecha).toBe('');
  });
});

describe('F8 · validación antes de enviar', () => {
  const ok = { monto: '270.00', fecha: '2026-10-13', banco: 'BNB' };

  it('F8_un_pago_correcto_no_tiene_errores', () => {
    expect(validarPago(ok, HOY)).toEqual({});
  });

  it('F8_la_fecha_del_comprobante_no_puede_ser_futura', () => {
    expect(validarPago({ ...ok, fecha: '2026-10-31' }, HOY).fecha).toMatch(/futura/i);
    expect(validarPago({ ...ok, fecha: HOY }, HOY)).toEqual({});
  });

  it('F10_el_monto_es_un_decimal_positivo_de_a_lo_sumo_2_decimales', () => {
    expect(validarPago({ ...ok, monto: '0' }, HOY).monto).toBeTruthy();
    expect(validarPago({ ...ok, monto: '-5.00' }, HOY).monto).toBeTruthy();
    expect(validarPago({ ...ok, monto: '10.555' }, HOY).monto).toBeTruthy();
    expect(validarPago({ ...ok, monto: '' }, HOY).monto).toBeTruthy();
    expect(validarPago({ ...ok, monto: '270' }, HOY)).toEqual({});
  });

  it('F10_el_monto_se_formatea_con_2_decimales_sin_usar_number', () => {
    expect(formatearMonto('270')).toBe('270.00');
    expect(formatearMonto('270.5')).toBe('270.50');
    expect(formatearMonto('1250.50')).toBe('1250.50');
    expect(formatearMonto('12345678901234.1')).toBe('12345678901234.10');
  });
});
