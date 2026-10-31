import { useState } from 'react';
import { useEstadoCuenta, type ServicioCuenta } from '../application/useEstadoCuenta';

interface Props {
  unidades: { unidadId: string; codigo: string }[];
  servicio: ServicioCuenta;
}

const ESTILO = `.ch-cuenta{display:grid;gap:.75rem}.ch-cuenta dl{display:grid;grid-template-columns:1fr auto;gap:.35rem 1rem;margin:0}
.ch-cuenta dt{color:var(--ch-muted,#6b7280)}.ch-cuenta dd{margin:0;text-align:right;font-variant-numeric:tabular-nums}
.ch-cuenta select{padding:.4rem .6rem;border:1px solid var(--ch-border,#e5e7eb);border-radius:.5rem;font:inherit}
.ch-moroso{color:#b91c1c;font-weight:600}.ch-aldia{color:#166534;font-weight:600}`;

/** Muestra el estado de cuenta que calcula Gestión; los montos llegan como texto decimal y no se operan aquí (F10). */
export function EstadoCuentaPage({ unidades, servicio }: Props) {
  const [unidadId, setUnidadId] = useState(unidades[0]?.unidadId ?? '');
  const { cuenta, error } = useEstadoCuenta(servicio, unidadId);
  return (
    <section className="ch-cuenta" aria-label="Estado de cuenta">
      <style>{ESTILO}</style>
      {unidades.length > 1 && (
        <select aria-label="Unidad" value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
          {unidades.map((u) => <option key={u.unidadId} value={u.unidadId}>{u.codigo}</option>)}
        </select>
      )}
      {error && <p className="ch-error" role="alert">{error}</p>}
      {cuenta && (
        <>
          <p role="status" className={cuenta.moroso ? 'ch-moroso' : 'ch-aldia'}>
            {cuenta.moroso ? `Unidad morosa: ${cuenta.expensasVencidas} expensa(s) vencida(s)` : 'Estás al día'}
          </p>
          <dl>
            <dt>Deuda total</dt><dd>{cuenta.deudaTotal}</dd>
            <dt>Deuda vencida</dt><dd>{cuenta.deudaVencida}</dd>
            <dt>Saldo a favor</dt><dd>{cuenta.saldoAFavor}</dd>
          </dl>
        </>
      )}
    </section>
  );
}
