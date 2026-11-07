import { useEffect, useState } from 'react';

interface Props {
  texto: string | null;
  /** Cambia cada vez que hay un aviso nuevo, aunque el texto sea el mismo (así el segundo pago también se anuncia). */
  senal: unknown;
  /** Cuánto tiempo se queda a la vista. */
  ms?: number;
}

/** Un aviso que se oculta solo: no se queda fijo en pantalla para siempre. */
export function AvisoTemporal({ texto, senal, ms = 6000 }: Props) {
  const [visible, setVisible] = useState(Boolean(texto));
  useEffect(() => {
    if (!texto) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const espera = setTimeout(() => setVisible(false), ms);
    return () => clearTimeout(espera);
  }, [texto, senal, ms]);
  if (!texto || !visible) return null;
  return <p className="ch-aviso" role="status">{texto}</p>;
}
