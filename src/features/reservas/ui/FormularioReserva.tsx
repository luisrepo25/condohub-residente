import { useState, type FormEvent } from 'react';
import type { Area, DatosReserva, ErroresReserva } from '../domain/reserva';
import { TEXTOS } from './textos';

interface Props {
  areas: Area[];
  unidades: { unidadId: string; codigo: string }[];
  errores: ErroresReserva;
  enviando: boolean;
  alEnviar: (datos: DatosReserva) => Promise<boolean>;
}

const VACIO = { fecha: '', horaInicio: '14:00', horaFin: '18:00', invitados: '' };

/** Solo recoge los datos: validar, convertir a UTC y enviar es del hook `useReservas`. */
export function FormularioReserva({ areas, unidades, errores, enviando, alEnviar }: Props) {
  const [datos, setDatos] = useState<DatosReserva>({ areaId: '', unidadId: unidades[0]?.unidadId ?? '', ...VACIO });
  const cambiar = (campo: keyof DatosReserva) => (e: { target: { value: string } }) => setDatos({ ...datos, [campo]: e.target.value });
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (await alEnviar(datos)) setDatos({ ...datos, ...VACIO });
  };
  const campo = (nombre: keyof DatosReserva, etiqueta: string, control: JSX.Element) => (
    <label>
      {etiqueta}
      {control}
      {errores[nombre] && <span className="ch-campo-error">{errores[nombre]}</span>}
    </label>
  );

  return (
    <form className="ch-reserva-form" onSubmit={enviar} noValidate>
      <p className="ch-etiqueta">{TEXTOS.ayuda}</p>
      {campo('areaId', TEXTOS.area, (
        <select value={datos.areaId} onChange={cambiar('areaId')}>
          <option value="">Elige un área…</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{`${a.nombre} · aforo ${a.aforo} · ${a.horaApertura}–${a.horaCierre}`}</option>)}
        </select>
      ))}
      {unidades.length > 1 && campo('unidadId', TEXTOS.unidad, (
        <select value={datos.unidadId} onChange={cambiar('unidadId')}>
          {unidades.map((u) => <option key={u.unidadId} value={u.unidadId}>{u.codigo}</option>)}
        </select>
      ))}
      {campo('fecha', TEXTOS.fecha, <input type="date" value={datos.fecha} onChange={cambiar('fecha')} />)}
      <div className="ch-reserva-horas">
        {campo('horaInicio', TEXTOS.inicio, <input type="time" value={datos.horaInicio} onChange={cambiar('horaInicio')} />)}
        {campo('horaFin', TEXTOS.fin, <input type="time" value={datos.horaFin} onChange={cambiar('horaFin')} />)}
      </div>
      {campo('invitados', TEXTOS.invitados, <textarea rows={3} value={datos.invitados} onChange={cambiar('invitados')} />)}
      <button type="submit" className="ch-boton" disabled={enviando}>{enviando ? TEXTOS.enviando : TEXTOS.enviar}</button>
    </form>
  );
}
