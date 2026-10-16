import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, unmount } from '../src/remote';

const usuario = { sub: 'sub-1', nombre: 'Persona Demo', email: 'demo@condohub.test' };

function respuesta(data: unknown, ok = true) {
  return vi.fn(() => Promise.resolve({ ok, status: ok ? 200 : 502, json: () => Promise.resolve(data) }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('remoto residente', () => {
  it('mount pinta la sesión y el perfil de Gestión con el token del shell', async () => {
    const fetchFalso = respuesta({
      data: { miPerfil: { roles: ['RESIDENTE'], personaId: null, nombre: null, unidades: [] } },
    });
    vi.stubGlobal('fetch', fetchFalso);
    const el = document.body.appendChild(document.createElement('div'));

    mount(el, { getToken: () => 'token-del-shell', user: usuario });

    expect(await screen.findByText('Roles: RESIDENTE')).toBeTruthy();
    expect(screen.getByText('Sesión de Persona Demo (demo@condohub.test)')).toBeTruthy();
    const [, opciones] = fetchFalso.mock.calls[0] as unknown as [string, { headers: Record<string, string> }];
    expect(opciones.headers.authorization).toBe('Bearer token-del-shell');
  });

  it('si Gestión no responde muestra el error sin romper el shell', async () => {
    vi.stubGlobal('fetch', respuesta({}, false));
    const el = document.body.appendChild(document.createElement('div'));

    mount(el, { getToken: () => 't', user: usuario });

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('502'));
  });

  it('unmount deja vacío el contenedor', async () => {
    vi.stubGlobal('fetch', respuesta({ data: { miPerfil: { roles: ['RESIDENTE'], personaId: null, nombre: null, unidades: [] } } }));
    const el = document.body.appendChild(document.createElement('div'));
    mount(el, { getToken: () => 't', user: usuario });
    await screen.findByText('Roles: RESIDENTE');

    unmount(el);

    await waitFor(() => expect(el.innerHTML).toBe(''));
  });
});