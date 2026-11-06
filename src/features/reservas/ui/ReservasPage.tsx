import estilos from './reservas.css?inline';
import { confirmar } from '../../../shared/confirmar';
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
  const confirmarCancelacion = async (r: Parameters<typeof cancelar>[0]) => {
    if (await confirmar('¿Cancelar esta reserva? Hasta 48 h antes se anulan los cargos.', { aceptar: 'Sí, cancelar reserva', peligro: true })) void cancelar(r);
  };
  return (
    <section className="ch-reservas" aria-label={TEXTOS.titulo}>
      <style>{estilos}</style>
      <h2>{TEXTOS.titulo}</h2>
      <FormularioReserva areas={areas} unidades={unidades} errores={errores} enviando={enviando} alEnviar={solicitar} />
      {error && <p className="ch-error" role="alert">{error}</p>}
      <h3>{TEXTOS.historial}</h3>
      <ListaReservas reservas={reservas} areas={areas} alCancelar={confirmarCancelacion} />
    </section>
  );
}
