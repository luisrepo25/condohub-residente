import { useEffect, useState } from 'react';
import { cargarPerfil, type Perfil } from './perfil';

export interface Contexto {
  getToken: () => string;
  user: { sub: string; nombre: string; email: string };
}

/** Pantalla inicial del remoto: confirma que el login y el token llegan hasta GestiÃ³n. AquÃ­ crecen las funciones propias. */
export function App({ getToken, user }: Contexto) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarPerfil(getToken)
      .then(setPerfil)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'No se pudo cargar el perfil'));
  }, [getToken]);

  return (
    <section data-remoto="residente">
      <h1>Portal del residente</h1>
      <p>SesiÃ³n de {user.nombre} ({user.email})</p>
      {error && <p role="alert">{error}</p>}
      {perfil && (
        <>
          <p>Roles: {perfil.roles.join(', ')}</p>
          {perfil.unidades.length > 0 && (
            <ul>
              {perfil.unidades.map((u) => (
                <li key={u.unidadId}>
                  {u.codigo} Â· bloque {u.bloque} Â· {u.titular ? 'titular' : 'residente'}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}