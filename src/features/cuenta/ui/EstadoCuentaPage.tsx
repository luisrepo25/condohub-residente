import { useState } from 'react';
import { useEstadoCuenta, type ServicioCuenta } from '../application/useEstadoCuenta';

interface Props {
  unidades: { unidadId: string; codigo: string }[];
  servicio: ServicioCuenta;
}

/** Muestra el estado de cuenta que calcula Gestión; los montos llegan como texto decimal y no se operan aquí (F10). */
export function EstadoCuentaPage({ unidades, servicio }: Props) {
  const [unidadId, setUnidadId] = useState(unidades[0]?.unidadId ?? '');
  const { cuenta, error } = useEstadoCuenta(servicio, unidadId);
  return (
    <section className="ch-cuenta ch-consentimiento" aria-label="Estado de cuenta">
      <h2>Estado de cuenta</h2>
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
          <dl className="ch-montos">
            <div><dt>Deuda total</dt><dd>{cuenta.deudaTotal}</dd></div>
            <div><dt>Deuda vencida</dt><dd>{cuenta.deudaVencida}</dd></div>
            <div><dt>Saldo a favor</dt><dd>{cuenta.saldoAFavor}</dd></div>
          </dl>
        </>
      )}
    </section>
  );
}
