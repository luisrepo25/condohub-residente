export type Pestana = 'unidades' | 'cuenta' | 'pagos' | 'reservas' | 'visitas' | 'privacidad';

const ITEMS: { id: Pestana; titulo: string; ayuda: string; icono: string }[] = [
  { id: 'unidades', titulo: 'Mis unidades', ayuda: 'Inicio y accesos', icono: 'M4 20V9l8-5 8 5v11M9 20v-6h6v6' },
  { id: 'cuenta', titulo: 'Estado de cuenta', ayuda: 'Deuda y saldo', icono: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6' },
  { id: 'pagos', titulo: 'Pagar', ayuda: 'Subir comprobante', icono: 'M3 7h18v11H3zM3 11h18M7 15h4' },
  { id: 'reservas', titulo: 'Reservar', ayuda: 'Áreas comunes', icono: 'M4 7h16v12H4zM4 11h16M8 3v4M16 3v4' },
  { id: 'visitas', titulo: 'Anunciar visita', ayuda: 'Pase QR', icono: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 20h2M20 14v2' },
  { id: 'privacidad', titulo: 'Privacidad', ayuda: 'Consentimiento facial', icono: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z' },
];

interface Props {
  actual: Pestana;
  alElegir: (pestana: Pestana) => void;
}

/** Menú del portal: lateral en pantallas grandes y barra inferior en el celular. */
export function NavPortal({ actual, alElegir }: Props) {
  return (
    <nav className="ch-pestanas" role="tablist" aria-label="Secciones del portal">
      {ITEMS.map((p) => (
        <button key={p.id} type="button" role="tab" aria-selected={actual === p.id} className="ch-pestana" onClick={() => alElegir(p.id)}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={p.icono} />
          </svg>
          <span className="ch-nav-t" data-ayuda={p.ayuda}>{p.titulo}</span>
        </button>
      ))}
    </nav>
  );
}
