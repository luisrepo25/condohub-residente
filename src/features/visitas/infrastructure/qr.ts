import QRCode from 'qrcode';
import type { GeneradorQr } from '../application/puertos';

/** En pantalla, SVG (nítido, sin canvas); para descargar, PNG. */
export const generadorQr: GeneradorQr = {
  async aImagen(texto: string): Promise<string> {
    const svg = await QRCode.toString(texto, { type: 'svg', margin: 2, width: 256 });
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  },
  aPng: (texto: string) => QRCode.toDataURL(texto, { margin: 2, width: 512 }),
};
