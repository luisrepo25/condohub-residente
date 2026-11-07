/** F7: cómo se repartiría un pago entre los cargos pendientes. Todo texto: el dinero nunca pasa por `number` (F10). */
export interface LineaSimulacion {
  cargoId: string;
  tipo: string;
  concepto: string;
  /** ISO-8601 (yyyy-MM-dd). */
  fechaVencimiento: string;
  saldoActual: string;
  aplicado: string;
  saldoResultante: string;
}

export interface SimulacionPago {
  /** Solo los cargos a los que llegaría el pago, en el orden de aplicación. */
  lineas: LineaSimulacion[];
  /** Lo que sobraría como saldo a favor. */
  excedente: string;
}
