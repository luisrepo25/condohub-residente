import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AvisoTemporal } from '../../src/features/pagos/ui/AvisoTemporal';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('un aviso que no se queda para siempre', () => {
  it('se_muestra_y_desaparece_solo_pasado_el_tiempo', async () => {
    render(<AvisoTemporal texto="Pago registrado como PENDIENTE" senal={1} ms={6000} />);
    expect(screen.getByRole('status').textContent).toBe('Pago registrado como PENDIENTE');

    await act(async () => void (await vi.advanceTimersByTimeAsync(6000)));

    expect(screen.queryByRole('status')).toBeNull();
  });

  it('un_aviso_igual_vuelve_a_mostrarse_cuando_cambia_la_senal', async () => {
    const { rerender } = render(<AvisoTemporal texto="Pago registrado" senal={1} ms={6000} />);
    await act(async () => void (await vi.advanceTimersByTimeAsync(6000)));
    expect(screen.queryByRole('status')).toBeNull();

    rerender(<AvisoTemporal texto="Pago registrado" senal={2} ms={6000} />);

    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('sin_texto_no_pinta_nada', () => {
    const { container } = render(<AvisoTemporal texto={null} senal={1} />);

    expect(container.innerHTML).toBe('');
  });

  it('al_desmontar_cancela_su_temporizador', async () => {
    const { unmount } = render(<AvisoTemporal texto="Pago registrado" senal={1} ms={6000} />);

    unmount();

    await expect(act(async () => void (await vi.advanceTimersByTimeAsync(6000)))).resolves.toBeUndefined();
  });
});
