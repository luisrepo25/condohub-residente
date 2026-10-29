import estilos from './visitas.css?inline';
import { useVisitas } from '../application/useVisitas';
import type { GeneradorQr, ServicioVisitas } from '../application/puertos';
import type { UnidadOpcion } from '../domain/visita';
import { FormularioVisita } from './FormularioVisita';
import { PaseQR } from './PaseQR';
import { TEXTOS } from './textos';

interface Props {
  unidades: UnidadOpcion[];
  servicio: ServicioVisitas;
  qr: GeneradorQr;
}

/** Página de la feature: compone el formulario o el pase emitido; no hace llamadas de red por sí misma. */
export function VisitasPage({ unidades, servicio, qr }: Props) {
  const { estado, anunciar, nueva } = useVisitas({ servicio, qr });
  return (
    <section className="ch-visitas" aria-label={TEXTOS.titulo}>
      <style>{estilos}</style>
      <h2>{TEXTOS.titulo}</h2>
      {estado.visita && estado.imagenQr ? (
        <PaseQR visita={estado.visita} imagenQr={estado.imagenQr} imagenPng={estado.imagenPng} alNueva={nueva} />
      ) : (
        <FormularioVisita unidades={unidades} enviando={estado.enviando} errores={estado.errores} error={estado.error} alEnviar={anunciar} />
      )}
    </section>
  );
}
