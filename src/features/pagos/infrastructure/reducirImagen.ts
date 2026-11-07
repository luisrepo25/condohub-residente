import { escalaParaOcr } from '../domain/escalaOcr';

const MAX_LADO_OCR = 1200;

/** Reduce la foto para el OCR (solo la copia que se lee; la que se sube a S3 es la original). Ante cualquier fallo devuelve la original. */
export async function reducirParaOcr(imagen: Blob): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(imagen);
    const destino = escalaParaOcr({ ancho: bitmap.width, alto: bitmap.height }, MAX_LADO_OCR);
    if (destino.ancho === bitmap.width) {
      bitmap.close();
      return imagen;
    }
    const lienzo = document.createElement('canvas');
    lienzo.width = destino.ancho;
    lienzo.height = destino.alto;
    lienzo.getContext('2d')?.drawImage(bitmap, 0, 0, destino.ancho, destino.alto);
    bitmap.close();
    return await new Promise<Blob>((resolver) => lienzo.toBlob((b) => resolver(b ?? imagen), 'image/png'));
  } catch {
    return imagen;
  }
}
