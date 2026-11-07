import { useContext } from 'react';
import { SimuladorContexto } from '../application/simuladorContexto';
import { useSimulacionPago } from '../application/useSimulacionPago';
import type { LineaSimulacion } from '../domain/simulacion';
import { fechaLegible } from './fecha';
import { TEXTOS } from './textos';

interface Props {
  unidadId: string;
  monto: string;
}

function Linea({ l }: { l: LineaSimulacion }) {
  return (
    <li>
      <strong>{l.concepto}</strong> · {TEXTOS.vence} {fechaLegible(l.fechaVencimiento)}: {l.saldoActual} → {l.saldoResultante}{' '}
      <small>({TEXTOS.aplicas} {l.aplicado})</small>
    </li>
  );
}

/** F7: antes de enviar, muestra a qué cargos se aplicaría el pago (lo calcula Gestión). Es una ayuda: nunca bloquea el envío. */
export function VistaPreviaImputacion({ unidadId, monto }: Props) {
  const { estado, simulacion } = useSimulacionPago(useContext(SimuladorContexto), unidadId, monto);
  if (estado === 'inactiva') return null;
  if (estado === 'calculando') return <p role="status" className="ch-etiqueta">{TEXTOS.calculando}</p>;
  if (estado === 'no-disponible' || !simulacion) return <p role="status" className="ch-etiqueta">{TEXTOS.sinVistaPrevia}</p>;
  return (
    <section className="ch-vista-previa" role="status" aria-label={TEXTOS.vistaPrevia}>
      {simulacion.lineas.length > 0 ? (
        <>
          <p>{TEXTOS.seAplicaraA}</p>
          <ul>{simulacion.lineas.map((l) => <Linea key={l.cargoId} l={l} />)}</ul>
        </>
      ) : (
        <p>{TEXTOS.sinCargos}</p>
      )}
      {simulacion.excedente !== '0.00' && <p>{TEXTOS.saldoAFavor}: <strong>{simulacion.excedente}</strong></p>}
      <small>{TEXTOS.estimacion}</small>
    </section>
  );
}
