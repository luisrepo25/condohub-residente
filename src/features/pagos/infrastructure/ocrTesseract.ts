import type { LectorComprobante } from '../application/puertos';

/**
 * OCR en el navegador con Tesseract.js (IA local en el frontend web). La librería y el idioma se cargan al leer la primera
 * foto, no al montar el remoto, y el trabajador se libera al terminar. Se usa `eng`: para monto, fecha y banco alcanza y pesa poco.
 */
export const lectorTesseract: LectorComprobante = {
  async leer(imagen: Blob): Promise<string> {
    const { createWorker } = await import('tesseract.js');
    const trabajador = await createWorker('eng');
    try {
      const { data } = await trabajador.recognize(imagen);
      return data.text;
    } finally {
      await trabajador.terminate();
    }
  },
};
