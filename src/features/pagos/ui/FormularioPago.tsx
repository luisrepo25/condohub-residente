import { useEffect, useState, type FormEvent } from 'react';
import type { DatosComprobante, ErroresPago } from '../domain/comprobante';
import { TEXTOS } from './textos';
import { VistaPreviaImputacion } from './VistaPreviaImputacion';

interface Props {
  unidades: { unidadId: string; codigo: string }[];
  leido: DatosComprobante;
  errores: ErroresPago;
  leyendo: boolean;
  alLeer: (imagen: File) => void;
  alEnviar: (unidadId: string, datos: DatosComprobante) => Promise<boolean>;
}

/** Recoge y revisa los datos (F9): el OCR prellena, pero lo que se envía es lo que el residente confirma aquí. */
export function FormularioPago({ unidades, leido, errores, leyendo, alLeer, alEnviar }: Props) {
  const [unidadId, setUnidadId] = useState(unidades[0]?.unidadId ?? '');
  const [datos, setDatos] = useState<DatosComprobante>(leido);
  useEffect(() => setDatos(leido), [leido]);
  const cambiar = (campo: keyof DatosComprobante) => (e: { target: { value: string } }) => setDatos({ ...datos, [campo]: e.target.value });
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    void alEnviar(unidadId, datos);
  };

  return (
    <form className="ch-pago-form" onSubmit={enviar} noValidate>
      <p className="ch-etiqueta">{TEXTOS.ayuda}</p>
      <label>
        {TEXTOS.foto}
        <input type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && alLeer(e.target.files[0])} />
      </label>
      {leyendo && <p role="status">{TEXTOS.leyendo}</p>}
      <label>
        {TEXTOS.unidad}
        <select value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
          {unidades.map((u) => <option key={u.unidadId} value={u.unidadId}>{u.codigo}</option>)}
        </select>
      </label>
      <label>
        {TEXTOS.monto}
        <input inputMode="decimal" value={datos.monto} onChange={cambiar('monto')} autoComplete="off" />
        {errores.monto && <span className="ch-campo-error">{errores.monto}</span>}
      </label>
      <label>
        {TEXTOS.fecha}
        <input type="date" value={datos.fecha} onChange={cambiar('fecha')} />
        {errores.fecha && <span className="ch-campo-error">{errores.fecha}</span>}
      </label>
      <label>
        {TEXTOS.banco}
        <input value={datos.banco} onChange={cambiar('banco')} autoComplete="off" />
      </label>
      <label>
        {TEXTOS.nroOperacion}
        <input value={datos.nroOperacion ?? ''} onChange={cambiar('nroOperacion')} autoComplete="off" />
      </label>
      <VistaPreviaImputacion unidadId={unidadId} monto={datos.monto} />
      <button type="submit" className="ch-boton" disabled={leyendo}>{TEXTOS.enviar}</button>
    </form>
  );
}
