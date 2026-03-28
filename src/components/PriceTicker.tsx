'use client';

import { cn } from './utils';

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
    { label: 'BCV', value: ((tasasSafe.bcv ?? 0) > 0) ? tasasSafe.bcv.toFixed(2) : undefined, change: null, type: 'rate' as const },
    { label: 'BINANCE', value: ((tasasSafe.binance ?? 0) > 0) ? tasasSafe.binance.toFixed(2) : undefined, change: tasasSafe.brecha_binance_pct?.toFixed(2), type: 'rate' as const },
    // BLINDAJE: Slice seguro con verificación de longitud
    ...bvcSafe.slice(0, 8).map(a => {
      const precio = (a?.precio ?? a?.precio_vta ?? a?.precio_compra) ?? 0;
      const variacion = a?.variacion_pct;
      return ({
        label: a?.simbolo || 'S/N',
        value: precio.toFixed(2),
        change: variacion?.toFixed(2) ?? null,
        type: 'stock' as const
      });
    })
  ];

  return (
    <div className="w-full bg-[#0a0a0a] border-b border-[#262626] overflow-hidden py-2">
      <div className="flex animate-ticker gap-8 whitespace-nowrap">
        {[...items, ...items].map((item, idx) => {
          // BLINDAJE: Parseo seguro del cambio
          const changeNum = item.change ? parseFloat(item.change) : null;
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
              {item.change && changeNum !== null && (
                <span className={cn(
                  "flex items-center gap-0.5",
                  isPositive ? 'text-emerald-400' : 'text-red-400'
                )}>
                  {isPositive ? '▲' : '▼'}
                  {Math.abs(changeNum).toFixed(2)}%
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
