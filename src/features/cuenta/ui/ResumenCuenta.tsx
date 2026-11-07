import { useState } from 'react';
import { useEstadoCuenta, type ServicioCuenta } from '../application/useEstadoCuenta';

interface Props {
  unidades: { unidadId: string; codigo: string }[];
  servicio: ServicioCuenta;
  alPagar: () => void;
}

const hora = (ms: number) => new Date(ms).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

/** Saldo siempre a la vista, con la acción de pagar. Muestra lo que calcula Gestión: no opera montos ni decide la mora (F4, F10). */
export function ResumenCuenta({ unidades, servicio, alPagar }: Props) {
  const [unidadId, setUnidadId] = useState(unidades[0]?.unidadId ?? '');
  const { cuenta, error, actualizando, actualizadoEn, recargar } = useEstadoCuenta(servicio, unidadId);
  const cargando = !cuenta && !error;
  const valor = (texto: string | undefined) => (cargando ? <i className="ch-esqueleto" aria-hidden="true" /> : (texto ?? '—'));
  return (
    <section className="ch-saldo" aria-label="Tu saldo">
      <div className="ch-saldo-principal">
        <span className="ch-saldo-t">Deuda total{cuenta ? ` de ${cuenta.codigo}` : ''}</span>
        <b>{valor(cuenta?.deudaTotal)}</b>
        {cuenta && (
          <span className={cuenta.moroso ? 'ch-insignia ch-insignia--peligro' : 'ch-insignia ch-insignia--ok'}>
            {cuenta.moroso ? `${cuenta.expensasVencidas} expensa(s) vencida(s)` : 'Estás al día'}
          </span>
        )}
        {cuenta && !cuenta.moroso && cuenta.deudaTotal !== '0.00' && (
          <span className="ch-saldo-t">Nada vencido todavía: pagas antes del vencimiento y no hay mora.</span>
        )}
        {error && <span className="ch-saldo-t">No se pudo cargar tu saldo por ahora.</span>}
      </div>
      {unidades.length > 1 && (
        <select aria-label="Unidad del saldo" value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
          {unidades.map((u) => <option key={u.unidadId} value={u.unidadId}>{u.codigo}</option>)}
        </select>
      )}
      <dl className="ch-montos">
        <div><dt>Deuda vencida</dt><dd className={cuenta && cuenta.deudaVencida !== '0.00' ? 'ch-monto--peligro' : undefined}>{valor(cuenta?.deudaVencida)}</dd></div>
        <div><dt>Saldo a favor</dt><dd className={cuenta && cuenta.saldoAFavor !== '0.00' ? 'ch-monto--ok' : undefined}>{valor(cuenta?.saldoAFavor)}</dd></div>
      </dl>
      <div className="ch-saldo-actualiza">
        {actualizadoEn && <span className="ch-saldo-t">Actualizado a las {hora(actualizadoEn)}</span>}
        <button type="button" className="ch-boton-icono" aria-label="Actualizar saldo" disabled={actualizando} onClick={() => void recargar()}>↻</button>
      </div>
      <button type="button" className="ch-boton ch-saldo-pagar" onClick={alPagar}>Pagar</button>
    </section>
  );
}
