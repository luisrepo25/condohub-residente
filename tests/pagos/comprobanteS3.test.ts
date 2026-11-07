import { describe, expect, it, vi } from 'vitest';
import { crearSubidorComprobante } from '../../src/features/pagos/infrastructure/comprobanteS3';

const foto = new Blob(['foto'], { type: 'image/png' });
const ok = (cuerpo: unknown) => ({ ok: true, status: 200, json: async () => cuerpo }) as Response;
const subida = { data: { solicitarSubidaComprobante: { clave: 'comprobantes/A-101/k.png', url: 'https://s3/put?firma', expiraEn: 'x' } } };

describe('F8 · subida de la foto del comprobante directo a S3', () => {
  it('F8_pide_el_enlace_a_Gestion_sube_la_foto_con_PUT_y_devuelve_la_clave', async () => {
    const http = vi.fn().mockResolvedValueOnce(ok(subida)).mockResolvedValueOnce({ ok: true, status: 200 } as Response);

    const clave = await crearSubidorComprobante(() => 't', 'https://gw', http).subir('u1', 'k', foto);

    expect(clave).toBe('comprobantes/A-101/k.png');
    const [urlGestion, init] = http.mock.calls[0]!;
    expect(urlGestion).toBe('https://gw/gestion/graphql');
    expect(JSON.parse(init.body).variables).toEqual({ unidadId: 'u1', clave: 'k', tipo: 'image/png' });
    expect(http.mock.calls[1]![0]).toBe('https://s3/put?firma');
    expect(http.mock.calls[1]![1]).toMatchObject({ method: 'PUT', body: foto, headers: { 'content-type': 'image/png' } });
  });

  it('F8_sin_conexion_devuelve_null_y_no_lanza', async () => {
    const http = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    expect(await crearSubidorComprobante(() => 't', 'https://gw', http).subir('u1', 'k', foto)).toBeNull();
  });

  it('F8_si_Gestion_responde_con_error_no_se_sube_nada_y_devuelve_null', async () => {
    const http = vi.fn().mockResolvedValue(ok({ errors: [{ message: 'sin almacén', extensions: { code: 'ALMACEN_NO_DISPONIBLE' } }] }));

    expect(await crearSubidorComprobante(() => 't', 'https://gw', http).subir('u1', 'k', foto)).toBeNull();
    expect(http).toHaveBeenCalledTimes(1);
  });

  it('F8_si_S3_rechaza_la_subida_devuelve_null', async () => {
    const http = vi.fn().mockResolvedValueOnce(ok(subida)).mockResolvedValueOnce({ ok: false, status: 403 } as Response);

    expect(await crearSubidorComprobante(() => 't', 'https://gw', http).subir('u1', 'k', foto)).toBeNull();
  });
});
