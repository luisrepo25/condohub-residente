export interface Medidas {
  ancho: number;
  alto: number;
}

/** Tamaño al que se reduce la foto para el OCR: lado mayor ≤ `maxLado`, sin agrandar. Con letras enormes Tesseract confunde dígitos (8 → 3). */
export function escalaParaOcr({ ancho, alto }: Medidas, maxLado: number): Medidas {
  const mayor = Math.max(ancho, alto);
  if (mayor <= maxLado) return { ancho, alto };
  const factor = maxLado / mayor;
  return { ancho: Math.round(ancho * factor), alto: Math.round(alto * factor) };
}
