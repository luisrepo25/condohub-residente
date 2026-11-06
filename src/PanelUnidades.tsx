import type { Pestana } from './NavPortal';
import type { UnidadDePersona } from './perfil';

const ACCESOS: { id: Pestana; titulo: string; texto: string }[] = [
  { id: 'pagos', titulo: 'Pagar', texto: 'Fotografía tu comprobante y regístralo.' },
  { id: 'reservas', titulo: 'Reservar', texto: 'Salón, piscina o churrasquera.' },
  { id: 'visitas', titulo: 'Anunciar visita', texto: 'Genera un pase QR de un solo uso.' },
];

interface Props {
  unidades: UnidadDePersona[];
  alElegir: (pestana: Pestana) => void;
}

/** Inicio del portal: las unidades de la persona y lo que más suele necesitar. */
export function PanelUnidades({ unidades, alElegir }: Props) {
  return (
    <>
      <h2>Mis unidades</h2>
      <ul className="ch-unidades">
        {unidades.map((u) => (
          <li key={u.unidadId}>
            <strong>{u.codigo}</strong>
            <span>Bloque {u.bloque}</span>
            <span className={u.titular ? 'ch-insignia ch-insignia--titular' : 'ch-insignia'}>{u.titular ? 'Titular' : 'Residente'}</span>
          </li>
        ))}
      </ul>
      <h2>¿Qué necesitas hoy?</h2>
      <div className="ch-accesos">
        {ACCESOS.map((a) => (
          <button key={a.id} type="button" className="ch-acceso" onClick={() => alElegir(a.id)}>
            <strong>{a.titulo}</strong>
            <span>{a.texto}</span>
          </button>
        ))}
      </div>
    </>
  );
}
