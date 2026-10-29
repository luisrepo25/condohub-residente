import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorVisita, type GeneradorQr, type ServicioVisitas } from '../../src/features/visitas/application/puertos';
import { useVisitas } from '../../src/features/visitas/application/useVisitas';
import { hoyLocal, mismosDatos, validarVisita, type DatosVisita, type VisitaEmitida } from '../../src/features/visitas/domain/visita';
import { crearServicioVisitas } from '../../src/features/visitas/infrastructure/visitasHttp';
import { generadorQr } from '../../src/features/visitas/infrastructure/qr';
import { VisitasPage } from '../../src/features/visitas/ui/VisitasPage';

const datos: DatosVisita = { unidadCodigo: 'A-101', nombre: 'Ana Pérez', documento: '', fecha: '2030-10-30' };
const emitida: VisitaEmitida = {
  visitaId: 'v1',
  nombre: 'Ana Pérez',
  fecha: '2030-10-30',
  pase: { codigo: 'CH-abc123', unidadCodigo: 'A-101', validoDesde: '2030-10-30T07:00:00-04:00', validoHasta: '2030-10-30T23:59:59-04:00', usosMaximos: 1 },
};
const qrFalso: GeneradorQr = { aImagen: async (t) => `data:image/svg+xml,${t}`, aPng: async (t) => `data:image/png;base64,${t}` };
const unidades = [{ unidadId: 'u1', codigo: 'A-101' }];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('dominio de visitas', () => {
  it('A1_exige_unidad_nombre_y_fecha_valida', () => {
    expect(validarVisita(datos)).toEqual({});
    expect(validarVisita({ ...datos, nombre: '  ' }).nombre).toBeTruthy();
    expect(validarVisita({ ...datos, unidadCodigo: '' }).unidadCodigo).toBeTruthy();
    expect(validarVisita({ ...datos, fecha: '30/10/2030' }).fecha).toBeTruthy();
    expect(validarVisita({ ...datos, fecha: '2030-13-45' }).fecha).toBeTruthy();
  });

  it('A1_respeta_los_limites_del_contrato_nombre_120_y_documento_30', () => {
    expect(validarVisita({ ...datos, nombre: 'x'.repeat(121) }).nombre).toBeTruthy();
    expect(validarVisita({ ...datos, documento: 'x'.repeat(31) }).documento).toBeTruthy();
  });

  it('hoyLocal_da_el_dia_del_dispositivo_y_mismosDatos_compara_por_valor', () => {
    expect(hoyLocal(new Date(2030, 9, 5))).toBe('2030-10-05');
    expect(mismosDatos(datos, { ...datos })).toBe(true);
    expect(mismosDatos(datos, { ...datos, nombre: 'Otro' })).toBe(false);
  });
});

describe('useVisitas', () => {
  it('A1_anunciar_devuelve_el_pase_y_su_imagen_QR', async () => {
    const servicio: ServicioVisitas = { registrar: vi.fn(async () => emitida) };
    const { result } = renderHook(() => useVisitas({ servicio, qr: qrFalso, uuid: () => 'k1' }));
    await act(() => result.current.anunciar(datos));
    expect(result.current.estado.visita?.pase.codigo).toBe('CH-abc123');
    expect(result.current.estado.imagenQr).toBe('data:image/svg+xml,CH-abc123');
  });

  it('O3_si_falla_y_se_reintenta_con_los_mismos_datos_usa_la_misma_Idempotency_Key', async () => {
    const registrar = vi.fn<(d: DatosVisita, k: string) => Promise<VisitaEmitida>>().mockRejectedValueOnce(new ErrorVisita('Sin conexión')).mockResolvedValueOnce(emitida);
    let n = 0;
    const { result } = renderHook(() => useVisitas({ servicio: { registrar }, qr: qrFalso, uuid: () => `clave-${++n}` }));
    await act(() => result.current.anunciar(datos));
    expect(result.current.estado.error).toBe('Sin conexión');
    await act(() => result.current.anunciar(datos));
    expect(registrar.mock.calls.map((c) => c[1])).toEqual(['clave-1', 'clave-1']);
    expect(result.current.estado.visita).not.toBeNull();
  });

  it('O1_con_datos_distintos_o_tras_un_exito_la_clave_es_nueva', async () => {
    const registrar = vi.fn(async (_d: DatosVisita, _k: string) => emitida);
    let n = 0;
    const { result } = renderHook(() => useVisitas({ servicio: { registrar }, qr: qrFalso, uuid: () => `clave-${++n}` }));
    await act(() => result.current.anunciar(datos));
    await act(() => result.current.anunciar(datos));
    expect(registrar.mock.calls.map((c) => c[1])).toEqual(['clave-1', 'clave-2']);
  });

  it('datos_invalidos_no_llaman_al_servidor', async () => {
    const registrar = vi.fn(async () => emitida);
    const { result } = renderHook(() => useVisitas({ servicio: { registrar }, qr: qrFalso }));
    await act(() => result.current.anunciar({ ...datos, nombre: '' }));
    expect(registrar).not.toHaveBeenCalled();
    expect(result.current.estado.errores.nombre).toBeTruthy();
  });
});

describe('servicio HTTP', () => {
  const respuesta = (cuerpo: unknown, status: number) => vi.fn(async () => new Response(JSON.stringify(cuerpo), { status }));

  it('O1_envia_token_clave_de_idempotencia_y_el_cuerpo_del_contrato', async () => {
    const http = respuesta(emitida, 201);
    const visita = await crearServicioVisitas(() => 'jwt', 'http://gw', http as unknown as typeof fetch).registrar({ ...datos, documento: ' CI-9 ' }, 'k-1');
    const [url, opciones] = http.mock.calls[0] as unknown as [string, RequestInit & { headers: Record<string, string> }];
    expect(url).toBe('http://gw/acceso/api/visitas');
    expect(opciones.headers).toMatchObject({ authorization: 'Bearer jwt', 'idempotency-key': 'k-1' });
    expect(JSON.parse(String(opciones.body))).toEqual({ unidadCodigo: 'A-101', nombre: 'Ana Pérez', fecha: '2030-10-30', documento: 'CI-9' });
    expect(visita.pase.codigo).toBe('CH-abc123');
  });

  it('F1_una_unidad_ajena_da_un_mensaje_claro_con_su_codigo', async () => {
    const http = respuesta({ status: 403, code: 'F1', detail: 'La unidad no pertenece al solicitante' }, 403);
    const intento = crearServicioVisitas(() => 't', 'http://gw', http as unknown as typeof fetch).registrar(datos, 'k');
    await expect(intento).rejects.toMatchObject({ codigo: 'F1', message: 'Esa unidad no pertenece a tu cuenta.' });
  });

  it('si_Gestion_no_responde_503_se_avisa_que_se_reintente', async () => {
    const http = respuesta({ status: 503 }, 503);
    await expect(crearServicioVisitas(() => 't', 'http://gw', http as unknown as typeof fetch).registrar(datos, 'k')).rejects.toThrow(/Gestión/);
  });

  it('O6_sin_red_se_explica_que_anunciar_una_visita_necesita_conexion', async () => {
    const http = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    await expect(crearServicioVisitas(() => 't', 'http://gw', http as unknown as typeof fetch).registrar(datos, 'k')).rejects.toThrow(/Sin conexión/);
  });
});

describe('generador de QR', () => {
  it('A1_el_QR_real_es_un_svg_que_contiene_el_codigo_del_pase', async () => {
    const url = await generadorQr.aImagen('CH-abc123');
    expect(url.startsWith('data:image/svg+xml')).toBe(true);
    expect(decodeURIComponent(url)).toContain('<svg');
  });

  it('A1_la_descarga_es_un_PNG_real_que_se_puede_abrir_y_compartir', async () => {
    const png = await generadorQr.aPng('CH-abc123');
    expect(png.startsWith('data:image/png;base64,')).toBe(true);
    const cabecera = Buffer.from(png.split(',')[1] ?? '', 'base64').subarray(0, 4);
    expect([...cabecera]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });
});

describe('pantalla de visitas', () => {
  it('A1_el_residente_llena_el_formulario_y_ve_su_pase_QR', async () => {
    const servicio: ServicioVisitas = { registrar: vi.fn(async () => emitida) };
    render(<VisitasPage unidades={unidades} servicio={servicio} qr={qrFalso} />);
    fireEvent.change(screen.getByLabelText(/Nombre de la visita/), { target: { value: 'Ana Pérez' } });
    fireEvent.change(screen.getByLabelText(/Día de la visita/), { target: { value: '2030-10-30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generar pase QR' }));

    expect(await screen.findByText('CH-abc123')).toBeTruthy();
    expect(screen.getByAltText('Código QR del pase de Ana Pérez')).toBeTruthy();
    expect(screen.getByText('Un solo uso de ingreso')).toBeTruthy();
    const descarga = screen.getByRole('link', { name: 'Descargar QR' });
    expect(descarga.getAttribute('download')).toBe('pase-A-101.png');
    expect(descarga.getAttribute('href')).toContain('image/png');
  });

  it('si_el_navegador_no_puede_generar_el_PNG_se_descarga_el_SVG_como_respaldo', async () => {
    const sinPng: GeneradorQr = { ...qrFalso, aPng: async () => Promise.reject(new Error('sin canvas')) };
    render(<VisitasPage unidades={unidades} servicio={{ registrar: vi.fn(async () => emitida) }} qr={sinPng} />);
    fireEvent.change(screen.getByLabelText(/Nombre de la visita/), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generar pase QR' }));
    const descarga = await screen.findByRole('link', { name: 'Descargar QR' });
    expect(descarga.getAttribute('download')).toBe('pase-A-101.svg');
  });

  it('un_nombre_vacio_muestra_el_error_en_el_campo_y_no_envia', async () => {
    const registrar = vi.fn(async () => emitida);
    render(<VisitasPage unidades={unidades} servicio={{ registrar }} qr={qrFalso} />);
    fireEvent.click(screen.getByRole('button', { name: 'Generar pase QR' }));
    expect(await screen.findByText('Escribe el nombre de la visita')).toBeTruthy();
    expect(registrar).not.toHaveBeenCalled();
  });

  it('un_error_del_servidor_se_muestra_como_alerta_sin_romper_la_pantalla', async () => {
    const servicio: ServicioVisitas = { registrar: vi.fn(async () => Promise.reject(new ErrorVisita('Esa unidad no pertenece a tu cuenta.', 'F1'))) };
    render(<VisitasPage unidades={unidades} servicio={servicio} qr={qrFalso} />);
    fireEvent.change(screen.getByLabelText(/Nombre de la visita/), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generar pase QR' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('no pertenece a tu cuenta'));
  });

  it('anunciar_otra_visita_vuelve_al_formulario', async () => {
    render(<VisitasPage unidades={unidades} servicio={{ registrar: vi.fn(async () => emitida) }} qr={qrFalso} />);
    fireEvent.change(screen.getByLabelText(/Nombre de la visita/), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generar pase QR' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Anunciar otra visita' }));
    expect(screen.getByLabelText(/Nombre de la visita/)).toBeTruthy();
  });
});
