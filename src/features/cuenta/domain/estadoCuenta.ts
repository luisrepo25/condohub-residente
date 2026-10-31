/** Estado de cuenta de una unidad tal como lo calcula Gestión (F4, F7). El front solo lo muestra: no calcula montos. */
export interface EstadoCuenta {
  unidadId: string;
  codigo: string;
  bloque: string;
  deudaTotal: string;
  deudaVencida: string;
  expensasVencidas: number;
  saldoAFavor: string;
  moroso: boolean;
}
