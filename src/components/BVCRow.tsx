import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn, formatInt, formatPercent, formatValue } from './utils';
import { FlashPrice } from './FlashPrice';
import { BVCData } from '@/app/types';

interface BVCRowProps {
  accion: BVCData;
  previous?: BVCData;
  tasaBinance: number;
  onStockClick?: (accion: BVCData) => void;
}

/**
 * Fila de la tabla de cotizaciones BVC (versión resumida para Dashboard)
 * OPTIMIZADO: Envuelto en React.memo para evitar re-renderizados innecesarios
 * 
 * Micro-interacciones:
 * - Hover: fondo sutil + borde izquierdo accent
 * - Click: feedback táctil con scale
 * - Entrada: fade-in suave
 */
export const BVCRow = memo(function BVCRow({ accion, previous, tasaBinance, onStockClick }: BVCRowProps) {
  // Usamos precio actual como principal, con fallbacks
  const precioPrincipal = accion.precio ?? accion.precio_vta ?? accion.precio_compra ?? 0;
  const previousPrecio = previous ? (previous.precio ?? previous.precio_vta ?? previous.precio_compra ?? 0) : 0;
  const priceChanged = previous && precioPrincipal !== previousPrecio;

  // Manejar null para variacion_pct
  const variacionPct = accion.variacion_pct ?? 0;
  const isPositive = variacionPct >= 0;

  // BLINDAJE: Símbolo seguro con valor por defecto
  const simbolo = accion.simbolo || 'S/N';
  const descSimb = accion.desc_simb || 'Sin descripción';
  const simboloCorto = simbolo.substring(0, 3).toUpperCase();

  // Calcular precio en USD
  const precioUSD = tasaBinance > 0 ? precioPrincipal / tasaBinance : 0;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      whileHover={{ 
        backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
        transition: { duration: 0.15 }
      }}
      className={cn(
        "border-b border-slate-200 transition-all duration-150 cursor-pointer relative",
        "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:transition-all before:duration-150",
        "hover:before:w-0.5",
        isPositive 
          ? 'hover:bg-emerald-500/5 before:bg-transparent hover:before:bg-emerald-400' 
          : 'hover:bg-red-500/5 before:bg-transparent hover:before:bg-red-400',
        priceChanged && (isPositive ? 'bg-emerald-50' : 'bg-rose-50')
      )}
      onClick={() => onStockClick?.(accion)}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <motion.div 
            className={cn(
              "w-8 h-8 rounded flex items-center justify-center font-bold text-xs border",
              isPositive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-rose-50 border-rose-200 text-rose-600'
            )}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            {simboloCorto}
          </motion.div>
          <div>
            <span className="font-semibold text-sm block">{simbolo}</span>
            <span className="text-[10px] text-slate-500 truncate block max-w-[120px]">{descSimb}</span>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <FlashPrice value={precioPrincipal} previous={previousPrecio} decimals={2} suffix="Bs" />
      </td>
      <td className="py-3 px-4 text-center">
        <motion.span 
          className={cn(
            "inline-flex items-center gap-1 font-bold text-sm",
            isPositive ? 'text-emerald-600' : 'text-rose-600'
          )}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {formatPercent(variacionPct, 2)}
        </motion.span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-slate-500 font-mono text-sm">{formatInt(accion.volumen)}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-slate-400 font-mono text-sm">
          ${formatValue(precioUSD, 2)}
        </span>
      </td>
    </motion.tr>
  );
});
