import { useConsentimiento } from '../application/useConsentimiento';
import type { ServicioConsentimiento } from '../application/puertos';

interface Props {
  servicio: ServicioConsentimiento;
  personaId: string | null;
}

const cuando = (iso: string) => new Date(iso).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' });

/** Privacidad: el reconocimiento facial solo funciona con tu consentimiento (I1) y puedes retirarlo cuando quieras. */
export function ConsentimientoPage({ servicio, personaId }: Props) {
  const { estado, plazo, error, retirar } = useConsentimiento(servicio, personaId);
  const confirmarYRetirar = () => {
    if (window.confirm('¿Retirar tu consentimiento? Se borrarán tus fotos y tu perfil facial y dejarás de ser reconocido en portería.')) void retirar();
  };
  return (
    <section className="ch-consentimiento" aria-label="Privacidad">
      <p className="ch-etiqueta">
        La portería solo reconoce tu rostro si diste tu consentimiento. Si lo retiras, tus fotos y tu perfil facial se borran en menos de 24 horas
        y el guardia te registra a mano.
      </p>
      {error && <p className="ch-error" role="alert">{error}</p>}
      {estado === 'RETIRADO' ? (
        <p role="status">Consentimiento retirado. Tus datos faciales se borran antes del {plazo ? cuando(plazo) : 'plazo de 24 horas'}.</p>
      ) : (
        <button type="button" disabled={estado === 'RETIRANDO'} onClick={confirmarYRetirar} style={{ padding: '0.55rem 1rem', border: '1px solid #b91c1c', borderRadius: '0.5rem', background: 'none', color: '#b91c1c', font: 'inherit', cursor: 'pointer' }}>
          {estado === 'RETIRANDO' ? 'Retirando…' : 'Retirar mi consentimiento'}
        </button>
      )}
    </section>
  );
}
