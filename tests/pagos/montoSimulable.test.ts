import { describe, expect, it } from 'vitest';
import { montoParaSimular } from '../../src/features/pagos/domain/montoSimulable';

describe('F7 · solo se pide la vista previa de un monto válido', () => {
  it('F7_un_monto_valido_se_normaliza_a_dos_decimales_como_texto', () => {
    expect(montoParaSimular('300')).toBe('300.00');
    expect(montoParaSimular('300.5')).toBe('300.50');
    expect(montoParaSimular(' 1250.75 ')).toBe('1250.75');
  });

  it('F7_acepta_la_coma_decimal', () => {
    expect(montoParaSimular('270,00')).toBe('270.00');
  });

  it('F7_un_monto_vacio_incompleto_o_en_cero_no_pide_vista_previa', () => {
    for (const texto of ['', '  ', '0', '0.00', '0,0', 'abc', '12.', '.5', '-10', '10.123', '1.250,50']) {
      expect(montoParaSimular(texto)).toBeNull();
    }
  });
});
