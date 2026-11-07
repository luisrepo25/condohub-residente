import { describe, expect, it } from 'vitest';
import { leerNroOperacion } from '../../src/features/pagos/domain/nroOperacion';

describe('F8 · el OCR prellena el número de operación cuando lo encuentra', () => {
  it('F8_lee_el_numero_tras_Nro_de_operacion', () => {
    expect(leerNroOperacion('Banco Unión\nNro. de operación: 48201937\nMonto: Bs 800.00')).toBe('48201937');
  });

  it('F8_lee_el_numero_tras_Operacion', () => {
    expect(leerNroOperacion('Operación: 48201937')).toBe('48201937');
  });

  it('F8_lee_Nro_seguido_de_digitos', () => {
    expect(leerNroOperacion('BANCO UNIÓN\nFecha: 13/10/2026\nMonto: Bs. 1.250,50\nNro 998877')).toBe('998877');
  });

  it('F8_lee_numero_de_transaccion_y_referencia', () => {
    expect(leerNroOperacion('N° de transacción 123456789')).toBe('123456789');
    expect(leerNroOperacion('Referencia: 7788990011')).toBe('7788990011');
  });

  it('F8_acepta_un_prefijo_de_letras_y_lo_deja_en_mayusculas', () => {
    expect(leerNroOperacion('Nro. de operación: op-48201937')).toBe('OP-48201937');
  });

  it('F8_no_confunde_el_numero_de_cuenta_con_el_de_operacion', () => {
    expect(leerNroOperacion('Nro. de cuenta 100200300400')).toBe('');
    expect(leerNroOperacion('Cuenta destino: 1002003004')).toBe('');
  });

  it('F8_no_toma_el_monto_ni_la_fecha_como_numero_de_operacion', () => {
    expect(leerNroOperacion('Monto: Bs 800.00\nFecha: 05/11/2026')).toBe('');
  });

  it('F8_una_palabra_sin_digitos_tras_Operacion_no_es_un_numero', () => {
    expect(leerNroOperacion('Operación exitosa')).toBe('');
  });

  it('F8_si_no_hay_numero_queda_vacio_para_que_el_residente_lo_complete', () => {
    expect(leerNroOperacion('texto ilegible ###')).toBe('');
    expect(leerNroOperacion('')).toBe('');
  });
});
