import { describe, expect, it } from 'vitest';
import { aInstantes, invitadosDe, puedeCancelar, validarReserva, type DatosReserva } from '../../src/features/reservas/domain/reserva';

const datos: DatosReserva = { areaId: 'a1', unidadId: 'u1', fecha: '2026-11-20', horaInicio: '14:00', horaFin: '18:00', invitados: '' };

describe('validación de la solicitud (solo la forma: las reglas R2-R4 las decide Reservas)', () => {
  it('R2_una_solicitud_completa_no_tiene_errores', () => {
    expect(validarReserva(datos)).toEqual({});
  });

  it('R2_exige_area_unidad_fecha_y_horas', () => {
    const errores = validarReserva({ ...datos, areaId: '', unidadId: '', fecha: '', horaInicio: '', horaFin: '' });
    expect(Object.keys(errores).sort()).toEqual(['areaId', 'fecha', 'horaFin', 'horaInicio', 'unidadId']);
  });

  it('R2_el_fin_debe_ser_posterior_al_inicio', () => {
    expect(validarReserva({ ...datos, horaInicio: '18:00', horaFin: '14:00' }).horaFin).toBeTruthy();
    expect(validarReserva({ ...datos, horaInicio: '14:00', horaFin: '14:00' }).horaFin).toBeTruthy();
  });

  it('R1_cada_invitado_tiene_un_nombre_de_hasta_120_caracteres', () => {
    expect(validarReserva({ ...datos, invitados: 'x'.repeat(121) }).invitados).toBeTruthy();
    expect(validarReserva({ ...datos, invitados: 'Ana\nBeto' })).toEqual({});
  });
});

describe('conversión a instantes UTC (las fechas viajan en UTC)', () => {
  it('convierte_la_fecha_y_las_horas_del_dispositivo_a_ISO_UTC', () => {
    const { inicio, fin } = aInstantes(datos);

    expect(inicio).toBe(new Date(2026, 10, 20, 14, 0).toISOString());
    expect(fin).toBe(new Date(2026, 10, 20, 18, 0).toISOString());
    expect(inicio.endsWith('Z')).toBe(true);
  });
});

describe('invitados', () => {
  it('uno_por_linea_sin_vacios_ni_espacios_sobrantes', () => {
    expect(invitadosDe('  Ana Pérez \n\n Beto \n')).toEqual([{ nombre: 'Ana Pérez' }, { nombre: 'Beto' }]);
    expect(invitadosDe('')).toEqual([]);
  });
});

describe('cancelar (R7, R8)', () => {
  it('R8_solo_se_cancela_desde_CONFIRMADA', () => {
    expect(puedeCancelar('CONFIRMADA')).toBe(true);
    for (const estado of ['SOLICITADA', 'FALLIDA', 'CANCELADA', 'FINALIZADA'] as const) expect(puedeCancelar(estado)).toBe(false);
  });
});
