/** URL del gateway (Kong). Se configura por entorno, nunca dentro de componentes. */
export const gatewayUrl: string = import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:8080';
