/** F8: el OCR solo prellena el número de operación; si el comprobante no lo trae, el residente lo completa o lo deja vacío. */

// «Nro. de operación: 48201937», «Nro 998877», «N° de transacción 123456»: el rótulo no puede ser «Nro. de cuenta».
const TRAS_NRO = /\b(?:nro\.?|n[úu]mero|n[°º]|no\.)\s*(?:de\s+)?(?:operaci[óo]n|transacci[óo]n|referencia|comprobante)?\s*[:#.]?\s*([A-Za-z]{0,3}-?\d[\dA-Za-z-]{3,28})/i;
// «Operación: 48201937», «Referencia 7788990011».
const TRAS_PALABRA = /(?:operaci[óo]n|transacci[óo]n|referencia)\s*[:#.]?\s*(?:n[°º]|nro\.?)?\s*([A-Za-z]{0,3}-?\d[\dA-Za-z-]{3,28})/i;

export function leerNroOperacion(texto: string): string {
  const crudo = TRAS_NRO.exec(texto)?.[1] ?? TRAS_PALABRA.exec(texto)?.[1];
  return crudo ? crudo.toUpperCase() : '';
}
