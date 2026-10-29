import { useEffect, useState } from 'react';
import estilos from './estilos.css?inline';
import { VisitasPanel } from './features/visitas';
import { cargarPerfil, type Perfil } from './perfil';

export interface Contexto {
  getToken: () => string;
  user: { sub: string; nombre: string; email: string };
}

/** Pantalla inicial del remoto: confirma que el login y el token llegan hasta Gestión. Aquí crecen las funciones propias. */
export function App({ getToken, user }: Contexto) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pestana, setPestana] = useState<'unidades' | 'visitas'>('unidades');

  useEffect(() => {
    cargarPerfil(getToken)
      .then(setPerfil)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'No se pudo cargar el perfil'));
  }, [getToken]);

  return (
    <section className="ch-remoto" data-remoto="residente">
      <style>{estilos}</style>
      <header className="ch-cabecera">
        <h1>Portal del residente</h1>
        <p className="ch-sesion">
          Sesión de {user.nombre} ({user.email})
        </p>
      </header>
      {error && (
        <p className="ch-error" role="alert">
          {error}
        </p>
      )}
      {perfil && (
        <div className="ch-tarjeta">
          <p className="ch-etiqueta">Roles: {perfil.roles.join(', ')}</p>
          {perfil.unidades.length > 0 && (
            <>
              <div className="ch-pestanas" role="tablist" aria-label="Secciones del portal">
                {(['unidades', 'visitas'] as const).map((id) => (
                  <button key={id} role="tab" aria-selected={pestana === id} className="ch-pestana" onClick={() => setPestana(id)}>
                    {id === 'unidades' ? 'Mis unidades' : 'Anunciar visita'}
                  </button>
                ))}
              </div>
              {pestana === 'unidades' ? (
                <ul className="ch-unidades">
                  {perfil.unidades.map((u) => (
                    <li key={u.unidadId}>
                      <strong>{u.codigo}</strong>
                      <span>Bloque {u.bloque}</span>
                      <span className={u.titular ? 'ch-insignia ch-insignia--titular' : 'ch-insignia'}>
                        {u.titular ? 'Titular' : 'Residente'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <VisitasPanel getToken={getToken} unidades={perfil.unidades} />
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}