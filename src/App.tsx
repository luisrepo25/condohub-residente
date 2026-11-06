import { useEffect, useState } from 'react';
import estilosControles from './estilos-controles.css?inline';
import estilos from './estilos.css?inline';
import { ConsentimientoPanel } from './features/consentimiento';
import { CuentaPanel, ResumenCuentaPanel } from './features/cuenta';
import { PagosPanel } from './features/pagos';
import { ReservasPanel } from './features/reservas';
import { VisitasPanel } from './features/visitas';
import { NavPortal, type Pestana } from './NavPortal';
import { PanelUnidades } from './PanelUnidades';
import { cargarPerfil, type Perfil } from './perfil';

export interface Contexto {
  getToken: () => string;
  user: { sub: string; nombre: string; email: string };
}

/** Pantalla inicial del remoto: confirma que el login y el token llegan hasta Gestión. Aquí crecen las funciones propias. */
export function App({ getToken, user }: Contexto) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pestana, setPestana] = useState<Pestana>('unidades');

  useEffect(() => {
    cargarPerfil(getToken)
      .then(setPerfil)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'No se pudo cargar el perfil'));
  }, [getToken]);

  const unidades = perfil?.unidades ?? [];
  return (
    <section className="ch-remoto" data-remoto="residente">
      <style>{estilos}</style>
      <style>{estilosControles}</style>
      <div className="ch-marco">
        {unidades.length > 0 && <NavPortal actual={pestana} alElegir={setPestana} />}
        <div className="ch-area">
          <header className="ch-cabecera">
            <h1>Portal del residente</h1>
            <p className="ch-sesion">
              Sesión de {user.nombre} ({user.email})
            </p>
            {perfil && <p className="ch-etiqueta">Roles: {perfil.roles.join(', ')}</p>}
          </header>
          {error && (
            <p className="ch-error" role="alert">
              {error}
            </p>
          )}
          {perfil && unidades.length > 0 && (
            <>
              {pestana !== 'cuenta' && <ResumenCuentaPanel getToken={getToken} unidades={unidades} alPagar={() => setPestana('pagos')} />}
              <div className="ch-tarjeta" role="tabpanel">
                {pestana === 'cuenta' && <CuentaPanel getToken={getToken} unidades={unidades} />}
                {pestana === 'pagos' && <PagosPanel getToken={getToken} unidades={unidades} />}
                {pestana === 'reservas' && <ReservasPanel getToken={getToken} unidades={unidades} />}
                {pestana === 'unidades' && <PanelUnidades unidades={unidades} alElegir={setPestana} />}
                {pestana === 'visitas' && <VisitasPanel getToken={getToken} unidades={unidades} />}
                {pestana === 'privacidad' && <ConsentimientoPanel getToken={getToken} personaId={perfil.personaId} />}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
