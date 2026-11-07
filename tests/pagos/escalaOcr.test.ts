import { describe, expect, it } from 'vitest';
import { escalaParaOcr } from '../../src/features/pagos/domain/escalaOcr';

/** F9: el OCR solo prellena; leer bien el monto depende de que Tesseract reciba letras de tamaño normal (un 800 se leía 300). */
describe('escala de la foto antes del OCR', () => {
  it('F9_una_foto_grande_se_reduce_para_que_su_lado_mayor_sea_el_maximo', () => {
    expect(escalaParaOcr({ ancho: 1792, alto: 2400 }, 1200)).toEqual({ ancho: 896, alto: 1200 });
  });

  it('F9_una_foto_apaisada_se_reduce_por_su_ancho', () => {
    expect(escalaParaOcr({ ancho: 4000, alto: 3000 }, 1200)).toEqual({ ancho: 1200, alto: 900 });
  });

  it('F9_una_foto_que_ya_cabe_no_se_modifica_ni_se_agranda', () => {
    expect(escalaParaOcr({ ancho: 800, alto: 600 }, 1200)).toEqual({ ancho: 800, alto: 600 });
  });
});
