import type { VisitaEmitida } from '../domain/visita';
import { TEXTOS } from './textos';

interface Props {
  visita: VisitaEmitida;
  imagenQr: string;
  imagenPng: string | null;
  alNueva: () => void;
}

/** El formateo de fechas vive aquí, en la capa de interfaz (las fechas viajan en UTC). */
const hora = (iso: string) => new Date(iso).toLocaleString('es-BO', { timeZone: 'America/La_Paz', dateStyle: 'medium', timeStyle: 'short' });

export function PaseQR({ visita, imagenQr, imagenPng, alNueva }: Props) {
  const { pase } = visita;
  const descarga = imagenPng ? { href: imagenPng, nombre: `pase-${pase.unidadCodigo}.png` } : { href: imagenQr, nombre: `pase-${pase.unidadCodigo}.svg` };
  return (
    <div className="ch-pase" role="status">
      <h3>{TEXTOS.listo}</h3>
      <img src={imagenQr} alt={`Código QR del pase de ${visita.nombre}`} width={256} height={256} />
      <dl>
        <dt>Visita</dt>
        <dd>
          {visita.nombre} · unidad {pase.unidadCodigo}
        </dd>
        <dt>{TEXTOS.vigencia}</dt>
        <dd>
          {hora(pase.validoDesde)} a {hora(pase.validoHasta)}
        </dd>
        <dt>{TEXTOS.codigo}</dt>
        <dd className="ch-codigo">{pase.codigo}</dd>
      </dl>
      <p className="ch-etiqueta">{TEXTOS.unUso}</p>
      <div className="ch-acciones">
        <a className="ch-boton" href={descarga.href} download={descarga.nombre}>
          {TEXTOS.descargar}
        </a>
        <button type="button" className="ch-boton ch-boton--suave" onClick={alNueva}>
          {TEXTOS.otra}
        </button>
      </div>
    </div>
  );
}
