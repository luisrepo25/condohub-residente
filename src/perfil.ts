export interface UnidadDePersona {
  unidadId: string;
  codigo: string;
  bloque: string;
  titular: boolean;
}

export interface Perfil {
  roles: string[];
  personaId: string | null;
  nombre: string | null;
  unidades: UnidadDePersona[];
}

const GATEWAY = import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:8080';

const CONSULTA = '{ miPerfil { roles personaId nombre unidades { unidadId codigo bloque titular } } }';

/** Consulta `miPerfil` de GestiÃ³n (por el gateway) con el token del shell. */
export async function cargarPerfil(getToken: () => string): Promise<Perfil> {
  const r = await fetch(`${GATEWAY}/gestion/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ query: CONSULTA }),
  });
  if (!r.ok) throw new Error(`GestiÃ³n respondiÃ³ ${r.status}`);
  const cuerpo = (await r.json()) as { data?: { miPerfil: Perfil }; errors?: { message: string }[] };
  if (!cuerpo.data) throw new Error(cuerpo.errors?.[0]?.message ?? 'Respuesta vacÃ­a de GestiÃ³n');
  return cuerpo.data.miPerfil;
}