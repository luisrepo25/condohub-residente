import { formatearMonto } from './comprobante';

/**
 * El monto que se puede simular, o `null` si todavía no lo es (vacío, incompleto, en cero o con más de 2 decimales). Así la
 * vista previa solo se pide cuando el residente terminó de escribir un monto válido. Solo manipula texto (F10).
 */
export function montoParaSimular(texto: string): string | null {
  const limpio = texto.trim();
  if (!/^\d+([.,]\d{1,2})?$/.test(limpio)) return null;
  const normal = limpio.replace(',', '.');
  return /[1-9]/.test(normal) ? formatearMonto(normal) : null;
}
