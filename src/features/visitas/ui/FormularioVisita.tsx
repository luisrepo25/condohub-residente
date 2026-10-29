import { useState, type FormEvent } from 'react';
import { hoyLocal, type DatosVisita, type ErroresFormulario, type UnidadOpcion } from '../domain/visita';
import { TEXTOS } from './textos';

interface Props {
  unidades: UnidadOpcion[];
  enviando: boolean;
  errores: ErroresFormulario;
  error: string | null;
  alEnviar: (datos: DatosVisita) => void;
}

/** Solo recoge los datos y los entrega: validar, enviar y guardar es del hook `useVisitas`. */
export function FormularioVisita({ unidades, enviando, errores, error, alEnviar }: Props) {
  const [datos, setDatos] = useState<DatosVisita>({ unidadCodigo: unidades[0]?.codigo ?? '', nombre: '', documento: '', fecha: hoyLocal() });
  const cambiar = (campo: keyof DatosVisita) => (e: { target: { value: string } }) => setDatos({ ...datos, [campo]: e.target.value });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    alEnviar(datos);
  };

  return (
    <form className="ch-visita-form" onSubmit={enviar} noValidate>
      <p className="ch-etiqueta">{TEXTOS.ayuda}</p>
      <label>
        {TEXTOS.unidad}
        <select value={datos.unidadCodigo} onChange={cambiar('unidadCodigo')}>
          {unidades.map((u) => (
            <option key={u.unidadId} value={u.codigo}>
              {u.codigo}
            </option>
          ))}
        </select>
        {errores.unidadCodigo && <span className="ch-campo-error">{errores.unidadCodigo}</span>}
      </label>
      <label>
        {TEXTOS.nombre}
        <input value={datos.nombre} onChange={cambiar('nombre')} maxLength={120} autoComplete="off" />
        {errores.nombre && <span className="ch-campo-error">{errores.nombre}</span>}
      </label>
      <label>
        {TEXTOS.documento}
        <input value={datos.documento} onChange={cambiar('documento')} maxLength={30} autoComplete="off" />
      </label>
      <label>
        {TEXTOS.fecha}
        <input type="date" value={datos.fecha} onChange={cambiar('fecha')} />
        {errores.fecha && <span className="ch-campo-error">{errores.fecha}</span>}
      </label>
      {error && (
        <p className="ch-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="ch-boton" disabled={enviando}>
        {enviando ? TEXTOS.enviando : TEXTOS.enviar}
      </button>
    </form>
  );
}
