import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from './utils';
import { FlashPrice } from './FlashPrice';
import { BVCData } from '@/app/types';

interface BVCRowProps {
  accion: BVCData;
  previous?: BVCData;
  tasaBinance: number;
}

/**
 * Formatea enteros - Muestra '-' solo si es null/undefined
 */
function formatInt(val: number | null | undefined): string {
  if (val === null || val === undefined) return '-';
  const num = Number(val);
  if (isNaN(num)) return '-';
  return num.toLocaleString('de-DE');
}

/**
 * Fila de la tabla de cotizaciones BVC (versión resumida para Dashboard)
 * OPTIMIZADO: Envuelto en React.memo para evitar re-renderizados innecesarios
 */
export const BVCRow = memo(function BVCRow({ accion, previous, tasaBinance }: BVCRowProps) {
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

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "border-b border-[#262626] hover:bg-[#1a1a1a] transition-colors",
        priceChanged && (isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10')
      )}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded flex items-center justify-center font-bold text-xs border",
            isPositive
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          )}>
            {simboloCorto}
          </div>
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
        <span className={cn(
          "inline-flex items-center gap-1 font-bold text-sm",
          isPositive ? 'text-emerald-400' : 'text-red-400'
        )}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(variacionPct).toFixed(2)}%
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-slate-500 font-mono text-sm">{formatInt(accion.volumen)}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-slate-400 font-mono text-sm">
          ${(precioPrincipal / tasaBinance).toFixed(2)}
        </span>
      </td>
    </motion.tr>
  );
});
