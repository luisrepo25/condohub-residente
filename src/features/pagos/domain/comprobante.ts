/** Lo que el residente revisa antes de enviar (F9): todo en texto; el dinero nunca pasa por `number` (F10). */
export interface DatosComprobante {
  monto: string;
  fecha: string;
  banco: string;
}

export interface ErroresPago {
  monto?: string;
  fecha?: string;
}

const BANCOS: [RegExp, string][] = [
  [/banco union|\bunion\b/, 'Banco Unión'],
  [/mercantil/, 'Mercantil Santa Cruz'],
  [/\bbnb\b|nacional de bolivia/, 'BNB'],
  [/\bbcp\b|credito/, 'BCP'],
  [/ganadero/, 'Banco Ganadero'],
  [/\bbisa\b/, 'BISA'],
  [/economico/, 'Banco Económico'],
  [/banco sol|\bsol\b/, 'Banco Sol'],
  [/fassil/, 'Fassil'],
  [/ecofuturo/, 'Ecofuturo'],
  [/prodem/, 'Prodem'],
  [/\bfie\b/, 'FIE'],
  [/fortaleza/, 'Banco Fortaleza'],
];

const NUMERO = String.raw`(\d{1,3}(?:[.,\s]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)`;
const MONTO_CON_PALABRA = new RegExp(String.raw`(?:monto|importe|total|bs\.?|bob)\s*:?\s*(?:bs\.?|bob)?\s*${NUMERO}`, 'i');
const MONTO_CON_DECIMALES = /\d[\d.,]*[.,]\d{2}\b/;

function sinAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** «1.250,50» → «1250.50»; «270» → «270.00». Solo manipula texto. */
function normalizarMonto(crudo: string): string {
  const limpio = crudo.replace(/\s/g, '');
  const decimales = /[.,](\d{1,2})$/.exec(limpio);
  const enteros = (decimales ? limpio.slice(0, -decimales[0].length) : limpio).replace(/[.,]/g, '');
  return `${enteros}.${(decimales?.[1] ?? '').padEnd(2, '0')}`;
}

function leerMonto(texto: string): string {
  const crudo = MONTO_CON_PALABRA.exec(texto)?.[1] ?? MONTO_CON_DECIMALES.exec(texto)?.[0];
  return crudo ? normalizarMonto(crudo) : '';
}

function fechaReal(anio: string, mes: string, dia: string): string {
  const d = new Date(Date.UTC(Number(anio), Number(mes) - 1, Number(dia)));
  const valida = d.getUTCFullYear() === Number(anio) && d.getUTCMonth() === Number(mes) - 1 && d.getUTCDate() === Number(dia);
  return valida ? `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}` : '';
}

function leerFecha(texto: string): string {
  const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(texto);
  if (iso) return fechaReal(iso[1] ?? '', iso[2] ?? '', iso[3] ?? '');
  const latina = /(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/.exec(texto);
  return latina ? fechaReal(latina[3] ?? '', latina[2] ?? '', latina[1] ?? '') : '';
}

function leerBanco(texto: string): string {
  const plano = sinAcentos(texto);
  return BANCOS.find(([patron]) => patron.test(plano))?.[1] ?? '';
}

/** F9: el OCR solo prellena; lo que no se reconoce queda vacío para que el residente lo complete. */
export function leerComprobante(texto: string): DatosComprobante {
  return { monto: leerMonto(texto), fecha: leerFecha(texto), banco: leerBanco(texto) };
}

/** «270» → «270.00» (dos decimales, sin `number`). Se asume un monto ya válido. */
export function formatearMonto(monto: string): string {
  const [enteros = '0', decimales = ''] = monto.trim().split('.');
  return `${enteros}.${decimales.padEnd(2, '0')}`;
}

function montoValido(monto: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(monto) && /[1-9]/.test(monto);
}

/** F8: la fecha del comprobante no puede ser futura. `hoy` viene del reloj (ISO, UTC). Gestión vuelve a validar. */
export function validarPago(datos: DatosComprobante, hoy: string): ErroresPago {
  const errores: ErroresPago = {};
  if (!montoValido(datos.monto.trim())) errores.monto = 'Escribe un monto mayor a cero, con hasta 2 decimales.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha)) errores.fecha = 'Indica la fecha del comprobante.';
  else if (datos.fecha > hoy) errores.fecha = 'La fecha del comprobante no puede ser futura.';
  return errores;
}
