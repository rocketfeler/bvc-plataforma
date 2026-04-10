'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { cn } from '@/components/utils';
import type { BVCData } from '@/app/types';

// ============================================================================
// TYPES
// ============================================================================

interface MarketOverviewCardProps {
  bvc: BVCData[];
  previousBvc: BVCData[];
  tasaBinance: number;
  onStockClick?: (stock: BVCData) => void;
}

// ============================================================================
// HELPER
// ============================================================================

function fmtVE(val: number | null | undefined, dec = 2): string {
  if (val === null || val === undefined) return '—';
  return val.toLocaleString('es-VE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// ============================================================================
// MARKET OVERVIEW CARD
// ============================================================================

export function MarketOverviewCard({ bvc, previousBvc, tasaBinance, onStockClick }: MarketOverviewCardProps) {
  // Top 10 acciones por variación absoluta, desempate por monto_efectivo
  const bvcRelevantes = [...(bvc ?? [])].sort((a, b) => {
    const varAbsA = Math.abs(a.variacion_pct ?? 0);
    const varAbsB = Math.abs(b.variacion_pct ?? 0);
    if (varAbsA !== varAbsB) return varAbsB - varAbsA;
    return (b.monto_efectivo ?? 0) - (a.monto_efectivo ?? 0);
  }).slice(0, 10);

  if (bvcRelevantes.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center">
        <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">Sin datos de mercado</p>
        <p className="text-sm text-slate-400 mt-1">Los datos del mercado BVC se cargarán pronto.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-800">Mercado BVC</h3>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-xs font-medium text-slate-500">
          {bvc?.length || 0} acciones
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" role="region" aria-label="Tabla de mercado BVC" tabIndex={0}>
        <table className="w-full" aria-label="Top 10 acciones más relevantes">
          <caption className="sr-only">Las 10 acciones con mayor variación en la Bolsa de Valores de Caracas</caption>
          <thead>
            <tr className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-slate-50/50">
              <th className="text-left py-3 px-4 font-medium" scope="col">Símbolo</th>
              <th className="text-right py-3 px-4 font-medium" scope="col">Precio Bs</th>
              <th className="text-center py-3 px-4 font-medium" scope="col">Var %</th>
              <th className="text-right py-3 px-4 font-medium hidden sm:table-cell" scope="col">Volumen</th>
              <th className="text-right py-3 px-4 font-medium hidden md:table-cell" scope="col">Monto Bs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bvcRelevantes.map((accion) => {
              const variacion = accion.variacion_pct ?? 0;
              const isPositive = variacion >= 0;

              return (
                <tr
                  key={accion.simbolo || 'S/N'}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => onStockClick?.(accion)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${accion.simbolo}: ${fmtVE(accion.precio)} Bs, ${variacion >= 0 ? '+' : ''}${variacion.toFixed(2)}%`}
                  onKeyDown={(e) => e.key === 'Enter' && onStockClick?.(accion)}
                >
                  {/* Símbolo */}
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{accion.simbolo}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[150px]">{accion.desc_simb}</p>
                    </div>
                  </td>

                  {/* Precio */}
                  <td className="py-3.5 px-4 text-right font-mono text-sm font-semibold text-slate-800">
                    {fmtVE(accion.precio)}
                  </td>

                  {/* Variación */}
                  <td className="py-3.5 px-4 text-center">
                    <span className={cn(
                      'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold',
                      isPositive
                        ? 'bg-emerald-50 text-emerald-700'
                        : variacion === 0
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-rose-50 text-rose-700'
                    )}>
                      {isPositive && variacion !== 0 && <ArrowUpRight className="w-3 h-3" />}
                      {variacion < 0 && <ArrowDownRight className="w-3 h-3" />}
                      {variacion >= 0 ? '+' : ''}{variacion.toFixed(2)}%
                    </span>
                  </td>

                  {/* Volumen */}
                  <td className="py-3.5 px-4 text-right font-mono text-sm text-slate-500 hidden sm:table-cell">
                    {accion.volumen?.toLocaleString('es-VE') ?? '—'}
                  </td>

                  {/* Monto */}
                  <td className="py-3.5 px-4 text-right font-mono text-sm text-slate-500 hidden md:table-cell">
                    {fmtVE(accion.monto_efectivo)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MarketOverviewCard;
