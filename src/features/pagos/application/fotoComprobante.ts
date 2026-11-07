import type { SubidorComprobante } from './puertos';

/** F8: sube la foto si hay una y un subidor; nunca impide registrar el pago (sin conexión se registra sin foto). */
export async function subirFoto(
  subidor: SubidorComprobante | undefined,
  imagen: Blob | null,
  unidadId: string,
  clave: string,
): Promise<string | null> {
  if (!subidor || !imagen) return null;
  try {
    return await subidor.subir(unidadId, clave, imagen);
  } catch {
    return null;
  }
}
