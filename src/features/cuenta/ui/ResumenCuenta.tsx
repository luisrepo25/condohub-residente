import { useState } from 'react';
import { useEstadoCuenta, type ServicioCuenta } from '../application/useEstadoCuenta';

interface Props {
  unidades: { unidadId: string; codigo: string }[];
  servicio: ServicioCuenta;
  alPagar: () => void;
}

/** Saldo siempre a la vista, con la acción de pagar. Muestra lo que calcula Gestión: no opera montos ni decide la mora (F4, F10). */
export function ResumenCuenta({ unidades, servicio, alPagar }: Props) {
  const [unidadId, setUnidadId] = useState(unidades[0]?.unidadId ?? '');
  const { cuenta, error } = useEstadoCuenta(servicio, unidadId);
  return (
    <section className="ch-saldo" aria-label="Tu saldo">
      <div className="ch-saldo-principal">
        <span className="ch-saldo-t">Deuda total{cuenta ? ` de ${cuenta.codigo}` : ''}</span>
        <b>{cuenta?.deudaTotal ?? '—'}</b>
        {cuenta && (
          <span className={cuenta.moroso ? 'ch-insignia ch-insignia--peligro' : 'ch-insignia ch-insignia--ok'}>
            {cuenta.moroso ? `${cuenta.expensasVencidas} expensa(s) vencida(s)` : 'Estás al día'}
          </span>
        )}
        {error && <span className="ch-saldo-t">No se pudo cargar tu saldo por ahora.</span>}
      </div>
      {unidades.length > 1 && (
        <select aria-label="Unidad del saldo" value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
          {unidades.map((u) => <option key={u.unidadId} value={u.unidadId}>{u.codigo}</option>)}
        </select>
      )}
      <dl className="ch-montos">
        <div><dt>Deuda vencida</dt><dd>{cuenta?.deudaVencida ?? '—'}</dd></div>
        <div><dt>Saldo a favor</dt><dd>{cuenta?.saldoAFavor ?? '—'}</dd></div>
      </dl>
      <button type="button" className="ch-boton ch-saldo-pagar" onClick={alPagar}>Pagar</button>
    </section>
  );
}
