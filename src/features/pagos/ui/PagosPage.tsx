import estilos from './pagos.css?inline';
import type { SimuladorPago } from '../application/puertos';
import { SimuladorContexto } from '../application/simuladorContexto';
import { usePagos, type Dependencias } from '../application/usePagos';
import { FormularioPago } from './FormularioPago';
import { ListaOperaciones } from './ListaOperaciones';
import { TEXTOS } from './textos';

interface Props extends Dependencias {
  unidades: { unidadId: string; codigo: string }[];
  /** Opcional: con él, el formulario muestra «se aplicará a…» antes de enviar (F7). */
  simulador?: SimuladorPago;
}

/** Página de la feature: compone el formulario y el historial; el estado y los efectos viven en `usePagos`. */
export function PagosPage({ unidades, simulador, ...dependencias }: Props) {
  const { operaciones, leido, errores, leyendo, aviso, leer, enviar } = usePagos(dependencias);
  return (
    <SimuladorContexto.Provider value={simulador ?? null}>
      <section className="ch-pagos" aria-label={TEXTOS.titulo}>
        <style>{estilos}</style>
        <h2>{TEXTOS.titulo}</h2>
        <FormularioPago unidades={unidades} leido={leido} errores={errores} leyendo={leyendo} alLeer={leer} alEnviar={enviar} />
        {aviso && <p className="ch-aviso" role="status">{aviso}</p>}
        <h3>{TEXTOS.historial}</h3>
        <ListaOperaciones operaciones={operaciones} />
      </section>
    </SimuladorContexto.Provider>
  );
}
