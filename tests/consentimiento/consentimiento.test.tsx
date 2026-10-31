import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorConsentimiento, type ServicioConsentimiento } from '../../src/features/consentimiento/application/puertos';
import { useConsentimiento } from '../../src/features/consentimiento/application/useConsentimiento';
import { crearServicioConsentimiento } from '../../src/features/consentimiento/infrastructure/consentimientoHttp';
import { ConsentimientoPage } from '../../src/features/consentimiento/ui/ConsentimientoPage';

afterEach(cleanup);

const PERSONA = '625479e8-cc07-4ffd-a5c6-7fe0263acdbe';
const plazo = { residenteId: PERSONA, borradoAntesDe: '2026-11-01T12:00:00Z' };
const json = (status: number, cuerpo: unknown = {}) => vi.fn(async () => new Response(JSON.stringify(cuerpo), { status }));

describe('retirar el consentimiento facial (I1)', () => {
  it('I1_manda_DELETE_a_la_IA_con_el_id_de_la_persona_y_el_token_del_shell', async () => {
    const http = json(202, plazo);

    const r = await crearServicioConsentimiento(() => 'tok', 'http://gw', http).retirar(PERSONA);

    const [url, init] = http.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`http://gw/ia/rostros/${PERSONA}`);
    expect(init.method).toBe('DELETE');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer tok');
    expect(r.borradoAntesDe).toBe('2026-11-01T12:00:00Z');
  });

  it.each([
    [404, /no tienes un perfil facial/i],
    [403, /no puedes retirar/i],
    [401, /sesión/i],
    [503, /intenta de nuevo/i],
  ])('un %i se explica con un mensaje legible', async (status, mensaje) => {
    const error = await crearServicioConsentimiento(() => 't', 'http://gw', json(status)).retirar(PERSONA).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ErrorConsentimiento);
    expect((error as Error).message).toMatch(mensaje);
  });

  it('sin_red_avisa_que_hace_falta_conexion', async () => {
    const sinRed = vi.fn(async () => Promise.reject(new TypeError('Failed to fetch')));

    await expect(crearServicioConsentimiento(() => 't', 'http://gw', sinRed).retirar(PERSONA)).rejects.toThrow(/conexión/i);
  });

  it('I1_el_caso_de_uso_pasa_de_inicial_a_retirado_con_el_plazo_de_borrado', async () => {
    const servicio: ServicioConsentimiento = { retirar: vi.fn(async () => plazo) };
    const { result } = renderHook(() => useConsentimiento(servicio, PERSONA));

    await act(async () => void (await result.current.retirar()));

    expect(servicio.retirar).toHaveBeenCalledWith(PERSONA);
    expect(result.current.estado).toBe('RETIRADO');
    expect(result.current.plazo).toBe('2026-11-01T12:00:00Z');
  });

  it('si_la_cuenta_no_esta_enlazada_a_una_persona_no_se_llama_a_la_IA', async () => {
    const servicio: ServicioConsentimiento = { retirar: vi.fn() };
    const { result } = renderHook(() => useConsentimiento(servicio, null));

    await act(async () => void (await result.current.retirar()));

    expect(servicio.retirar).not.toHaveBeenCalled();
    expect(result.current.error).toMatch(/no está enlazada/i);
  });

  it('un_error_de_la_IA_queda_visible_y_no_marca_el_consentimiento_como_retirado', async () => {
    const servicio: ServicioConsentimiento = { retirar: vi.fn(async () => Promise.reject(new ErrorConsentimiento('No tienes un perfil facial registrado'))) };
    const { result } = renderHook(() => useConsentimiento(servicio, PERSONA));

    await act(async () => void (await result.current.retirar()));

    expect(result.current.estado).toBe('INICIAL');
    expect(result.current.error).toContain('perfil facial');
  });
});

describe('pantalla de privacidad', () => {
  it('explica_que_se_borran_fotos_y_embeddings_en_menos_de_24_h_y_pide_confirmacion', async () => {
    const servicio: ServicioConsentimiento = { retirar: vi.fn(async () => plazo) };
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<ConsentimientoPage servicio={servicio} personaId={PERSONA} />);

    expect(screen.getByText(/24 horas/i)).toBeTruthy();
    screen.getByRole('button', { name: /retirar mi consentimiento/i }).click();

    expect(confirmar).toHaveBeenCalled();
    expect(servicio.retirar).not.toHaveBeenCalled();   // el residente canceló: no se envía nada
    confirmar.mockRestore();
  });

  it('al_confirmar_retira_y_muestra_el_plazo_del_borrado', async () => {
    const servicio: ServicioConsentimiento = { retirar: vi.fn(async () => plazo) };
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<ConsentimientoPage servicio={servicio} personaId={PERSONA} />);

    screen.getByRole('button', { name: /retirar mi consentimiento/i }).click();

    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/retirado/i));
    expect(screen.queryByRole('button', { name: /retirar mi consentimiento/i })).toBeNull();
    vi.restoreAllMocks();
  });
});
