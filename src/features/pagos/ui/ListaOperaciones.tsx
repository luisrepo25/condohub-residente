import type { OperacionPago } from '../application/puertos';
import { fechaLegible } from './fecha';
import { TEXTOS } from './textos';

/** Estado de cada pago enviado desde este dispositivo (O4): «Enviado» solo tras una respuesta 2xx de Gestión. */
export function ListaOperaciones({ operaciones }: { operaciones: OperacionPago[] }) {
  if (operaciones.length === 0) return <p className="ch-etiqueta">{TEXTOS.vacio}</p>;
  return (
    <ul className="ch-pago-lista" aria-label={TEXTOS.historial}>
      {operaciones.map((o) => (
        <li key={o.clave} data-estado={o.estado}>
          <strong>{o.datos.monto}</strong>
          <span>{fechaLegible(o.datos.fechaPago)}</span>
          {(o.datos.banco || o.datos.nroOperacion) && (
            <small className="ch-pago-detalle">
              {[o.datos.banco, o.datos.nroOperacion && `${TEXTOS.operacionCorta} ${o.datos.nroOperacion}`].filter(Boolean).join(' · ')}
            </small>
          )}
          <span role="status">{TEXTOS.estados[o.estado]}</span>
          {o.motivo && <span className="ch-campo-error">{o.motivo}</span>}
        </li>
      ))}
    </ul>
  );
}
