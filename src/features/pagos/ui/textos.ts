export const TEXTOS = {
  titulo: 'Pagar una expensa',
  ayuda: 'Fotografía tu comprobante: se lee en tu dispositivo y solo prellena los datos. Revísalos antes de enviar.',
  foto: 'Foto del comprobante',
  leyendo: 'Leyendo el comprobante…',
  unidad: 'Unidad',
  monto: 'Monto',
  fecha: 'Fecha del comprobante',
  banco: 'Banco',
  nroOperacion: 'Número de operación (opcional)',
  enviar: 'Registrar pago',
  historial: 'Mis pagos enviados',
  vacio: 'Todavía no registraste pagos desde este dispositivo.',
  estados: {
    PENDIENTE: 'Esperando conexión',
    SINCRONIZADA: 'Enviado · pendiente de conciliación',
    RECHAZADA: 'No se pudo registrar',
  },
} as const;
