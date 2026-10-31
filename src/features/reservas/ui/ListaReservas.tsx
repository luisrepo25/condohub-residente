import { puedeCancelar, type Area, type Reserva } from '../domain/reserva';
import { ESTADOS, TEXTOS } from './textos';

interface Props {
  reservas: Reserva[];
  areas: Area[];
  alCancelar: (reserva: Reserva) => void;
}

/** Fecha y hora en la zona del dispositivo; la lógica de negocio sigue en Reservas. */
const cuando = (iso: string) => new Date(iso).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' });

export function ListaReservas({ reservas, areas, alCancelar }: Props) {
  if (reservas.length === 0) return <p className="ch-etiqueta">{TEXTOS.vacio}</p>;
  const nombreDe = (id: string) => areas.find((a) => a.id === id)?.nombre ?? 'Área común';
  return (
    <ul className="ch-reserva-lista" aria-label={TEXTOS.historial}>
      {reservas.map((r) => (
        <li key={r.id} data-estado={r.estado}>
          <strong>{nombreDe(r.areaId)}</strong>
          <span>{`${cuando(r.inicio)} → ${cuando(r.fin)}`}</span>
          <span role="status">{ESTADOS[r.estado]}</span>
          <span className="ch-etiqueta">{`${TEXTOS.costo} ${r.costoUso} · ${TEXTOS.garantia} ${r.garantia}`}</span>
          {r.motivo && <span className="ch-campo-error">{r.motivo}</span>}
          {puedeCancelar(r.estado) && (
            <button type="button" className="ch-boton-secundario" onClick={() => alCancelar(r)}>{TEXTOS.cancelar}</button>
          )}
        </li>
      ))}
    </ul>
  );
}
