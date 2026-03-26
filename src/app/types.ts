/**
 * Tipos compartidos para el frontend
 */

export interface TasasData {
  fecha: string;
  bcv: number;
  bcv_eur?: number;
  binance: number | null;
  brecha_binance_pct?: number | null;
  brecha_binance_bs?: number | null;
  /** true cuando Binance API falló y se usa último valor de BD */
  stale_binance?: boolean;
  /** Alias de stale_binance para compatibilidad */
  stale_data?: boolean;
  // Legacy - para compatibilidad
  tasa_bcv?: number;
  tasa_binance?: number;
}

export interface BVCData {
  desc_simb: string;
  simbolo: string;
  precio: number | null;           // Precio actual
  vol_cmp: number | null;          // Volumen compra
  precio_compra: number | null;    // Precio compra
  precio_vta: number | null;       // Precio venta
  vol_vta: number | null;          // Volumen venta
  precio_apert: number | null;     // Precio apertura
  variacion_pct: number | null;    // Variación porcentual
  variacion_abs: number | null;    // Variación absoluta
  volumen: number | null;          // Volumen total
  monto_efectivo: number | null;   // Monto en efectivo
  tot_op_negoc: number | null;     // Total operaciones
  precio_max: number | null;       // Precio máximo
  precio_min: number | null;       // Precio mínimo
  fecha: string;
}

export interface PatrimonioDetalle {
  ticker: string;
  nombre?: string;
  cantidad: number;
  precio_promedio_compra?: number;
  precio_bvc: number;
  valor_ves: number;
  valor_usd?: number;
  valor_usdt: number;
  inversion_ves?: number;
  ganancia_perdida_ves?: number;
  gain_loss_pct?: number;
  sector?: string;
}

export interface PatrimonioData {
  total_ves: number;
  total_usd?: number;
  total_usdt: number;
  total_inversion?: number;
  roi_pct?: number;
  ganancia_perdida?: number;
  tasa_bcv_usada?: number;
  tasa_binance_usada: number;
  fecha_calculo?: string;
  detalles: PatrimonioDetalle[];
  resumen?: {
    variacion_diaria?: number;
  };
}

export interface MacroRow {
  fecha: string;
  tasa_bcv: number;
  tasa_binance_p2p: number;
  brecha_cambiaria: number;
}

export type ActiveTab = 'dashboard' | 'calculadora' | 'pizarra' | 'portafolio';
