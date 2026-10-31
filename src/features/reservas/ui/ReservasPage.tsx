import estilos from './reservas.css?inline';
import { useReservas, type Dependencias } from '../application/useReservas';
import { FormularioReserva } from './FormularioReserva';
import { ListaReservas } from './ListaReservas';
import { TEXTOS } from './textos';

interface Props extends Dependencias {
  unidades: { unidadId: string; codigo: string }[];
}

/** Página de la feature: compone el formulario y la lista; el estado y los efectos viven en `useReservas`. */
export function ReservasPage({ unidades, ...dependencias }: Props) {
  const { areas, reservas, errores, error, enviando, solicitar, cancelar } = useReservas(dependencias);
  const confirmarCancelacion = (r: Parameters<typeof cancelar>[0]) => {
    if (window.confirm('¿Cancelar esta reserva? Hasta 48 h antes se anulan los cargos.')) void cancelar(r);
  };
  return (
    <section className="ch-reservas" aria-label={TEXTOS.titulo}>
      <style>{estilos}</style>
      <FormularioReserva areas={areas} unidades={unidades} errores={errores} enviando={enviando} alEnviar={solicitar} />
      {error && <p className="ch-error" role="alert">{error}</p>}
      <h3>{TEXTOS.historial}</h3>
      <ListaReservas reservas={reservas} areas={areas} alCancelar={confirmarCancelacion} />
    </section>
  );
}
