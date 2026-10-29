/** Una unidad del residente, tal como la entrega su perfil de Gestión (F1). */
export interface UnidadOpcion {
  unidadId: string;
  codigo: string;
}

/** Lo que escribe el residente para anunciar una visita (A1). */
export interface DatosVisita {
  unidadCodigo: string;
  nombre: string;
  documento: string;
  fecha: string;
}

export interface PaseVisita {
  codigo: string;
  unidadCodigo: string;
  validoDesde: string;
  validoHasta: string;
  usosMaximos: number;
}

/** Respuesta de `POST /acceso/api/visitas`: la visita y su pase QR de un solo uso. */
export interface VisitaEmitida {
  visitaId: string;
  nombre: string;
  fecha: string;
  pase: PaseVisita;
}

export type ErroresFormulario = Partial<Record<keyof DatosVisita, string>>;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Mismas comprobaciones de forma que hace el servidor (contrato `NuevaVisita`), para avisar antes de enviar. */
export function validarVisita(d: DatosVisita): ErroresFormulario {
  const errores: ErroresFormulario = {};
  if (d.unidadCodigo.trim() === '') errores.unidadCodigo = 'Elige la unidad que recibe la visita';
  if (d.nombre.trim() === '') errores.nombre = 'Escribe el nombre de la visita';
  else if (d.nombre.trim().length > 120) errores.nombre = 'El nombre no puede pasar de 120 caracteres';
  if (d.documento.trim().length > 30) errores.documento = 'El documento no puede pasar de 30 caracteres';
  if (!FECHA.test(d.fecha) || Number.isNaN(Date.parse(`${d.fecha}T00:00:00Z`))) errores.fecha = 'Elige el día de la visita';
  return errores;
}

/** Hoy en la zona del dispositivo, como `yyyy-mm-dd`. */
export function hoyLocal(ahora: Date = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`;
}

export function mismosDatos(a: DatosVisita, b: DatosVisita): boolean {
  return a.unidadCodigo === b.unidadCodigo && a.nombre === b.nombre && a.documento === b.documento && a.fecha === b.fecha;
}
