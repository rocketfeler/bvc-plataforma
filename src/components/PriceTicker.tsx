'use client';

import { cn, formatValue, formatPercent } from './utils';

interface TickerItem {
  label: string;
  value: string | undefined;
  change: string | null;
  type: 'rate' | 'stock';
}

interface PriceTickerProps {
  tasas: any;
  bvc: any[];
}

/**
 * Cinta de precios en movimiento
 * BLINDADO: Maneja casos donde tasas o bvc son undefined/null
 */
export function PriceTicker({ tasas, bvc }: PriceTickerProps) {
  // BLINDAJE: Verificar que tasas exista antes de acceder a sus propiedades
  const tasasSafe = tasas || { bcv: 0, binance: 0, brecha_binance_pct: 0 };
  const bvcSafe = Array.isArray(bvc) ? bvc : [];

  const items: TickerItem[] = [
    { label: 'BCV', value: formatValue(tasasSafe.bcv, 2), change: null, type: 'rate' as const },
    { label: 'BINANCE', value: formatValue(tasasSafe.binance, 2), change: formatPercent(tasasSafe.brecha_binance_pct, 2), type: 'rate' as const },
    // BLINDAJE: Slice seguro con verificación de longitud
    ...bvcSafe.slice(0, 8).map(a => {
      const precio = (a?.precio ?? a?.precio_vta ?? a?.precio_compra) ?? 0;
      const variacion = a?.variacion_pct;
      return ({
        label: a?.simbolo || 'S/N',
        value: formatValue(precio, 2),
        change: formatPercent(variacion, 2),
        type: 'stock' as const
      });
    })
  ];

  return (
    <div className="w-full bg-[#0a0a0a] border-b border-[#262626] overflow-hidden py-2">
      <div className="flex animate-ticker gap-8 whitespace-nowrap">
        {[...items, ...items].map((item, idx) => {
          // BLINDAJE: Parseo seguro del cambio
          const changeNum = item.change && item.change !== '-' ? parseFloat(item.change.replace('%', '').replace('+', '')) : null;
          const isPositive = changeNum !== null && changeNum >= 0;

          return (
            <div key={idx} className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-500">{item.label}</span>
              <span className={cn(
                "font-bold",
                item.type === 'rate' ? 'text-amber-400' : 'text-white'
              )}>
                {item.value || '—'}
              </span>
              {item.change && item.change !== '-' && (
                <span className={cn(
                  "flex items-center gap-0.5",
                  isPositive ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {isPositive ? '▲' : '▼'}
                  {item.change}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 30s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
