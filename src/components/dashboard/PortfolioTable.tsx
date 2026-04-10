'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight, ArrowDownRight, ArrowUpDown, ChevronUp, ChevronDown,
  Edit2, History, Trash2
} from 'lucide-react';
import { cn } from '@/components/utils';
import type { PatrimonioDetalle } from '@/app/types';

// ============================================================================
// TYPES
// ============================================================================

interface PortfolioTableProps {
  detalles: PatrimonioDetalle[];
  tasaBinance: number;
  chartColors: readonly string[];
  onEdit?: (item: PatrimonioDetalle) => void;
  onHistory?: (ticker: string) => void;
  onDelete?: (id: number) => void;
}

type SortKey = 'ticker' | 'cantidad' | 'precio_bvc' | 'gain_loss_pct' | 'valor_ves' | 'valor_usdt';
type SortDir = 'asc' | 'desc';

// ============================================================================
// HELPER: Formato venezolano
// ============================================================================

function fmtVE(val: number | null | undefined, dec = 2): string {
  if (val === null || val === undefined) return '—';
  return val.toLocaleString('es-VE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function fmtPct(val: number | null | undefined, dec = 2): string {
  if (val === null || val === undefined) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(dec)}%`;
}

// ============================================================================
// SORT HEADER COMPONENT
// ============================================================================

function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  align?: 'left' | 'center' | 'right';
}) {
  const isActive = currentSort === sortKey;
  const alignClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';

  return (
    <th
      className={cn(
        'py-3 px-4 font-medium cursor-pointer select-none group transition-colors',
        isActive ? 'text-slate-700' : 'text-slate-400 hover:text-slate-600'
      )}
      onClick={() => onSort(sortKey)}
      scope="col"
    >
      <div className={cn('inline-flex items-center gap-1', alignClass)}>
        <span>{label}</span>
        <span className="inline-flex flex-col -space-y-1">
          {isActive ? (
            currentDir === 'asc' ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
          )}
        </span>
      </div>
    </th>
  );
}

// ============================================================================
// MAIN: PORTFOLIO TABLE
// ============================================================================

export function PortfolioTable({
  detalles,
  tasaBinance,
  chartColors,
  onEdit,
  onHistory,
  onDelete,
}: PortfolioTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('valor_ves');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedData = useMemo(() => {
    const sorted = [...detalles].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortKey) {
        case 'ticker':
          aVal = a.ticker;
          bVal = b.ticker;
          return sortDir === 'asc'
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
        case 'cantidad':
          aVal = a.cantidad ?? 0;
          bVal = b.cantidad ?? 0;
          break;
        case 'precio_bvc':
          aVal = a.precio_bvc ?? 0;
          bVal = b.precio_bvc ?? 0;
          break;
        case 'gain_loss_pct':
          aVal = a.gain_loss_pct ?? 0;
          bVal = b.gain_loss_pct ?? 0;
          break;
        case 'valor_ves':
          aVal = a.valor_ves ?? 0;
          bVal = b.valor_ves ?? 0;
          break;
        case 'valor_usdt':
          aVal = a.valor_usdt ?? 0;
          bVal = b.valor_usdt ?? 0;
          break;
      }

      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return sorted;
  }, [detalles, sortKey, sortDir]);

  if (!detalles || detalles.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
        <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <ArrowUpDown className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-600 font-medium mb-1">Sin posiciones activas</p>
        <p className="text-sm text-slate-400">Agrega acciones a tu portafolio para verlas aquí.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800">Posiciones Activas</h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium text-slate-500">
            {detalles.length} activo{detalles.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" aria-label="Posiciones de portafolio">
          <thead>
            <tr className="text-xs uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
              <SortableHeader label="Activo" sortKey="ticker" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Cant." sortKey="cantidad" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="center" />
              <th className="py-3 px-4 text-center text-xs uppercase tracking-wider text-slate-400 font-medium" scope="col">P. Compra</th>
              <SortableHeader label="P. Actual" sortKey="precio_bvc" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="center" />
              <SortableHeader label="P&L %" sortKey="gain_loss_pct" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="center" />
              <SortableHeader label="Valor Bs" sortKey="valor_ves" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="right" />
              <SortableHeader label="Valor USDT" sortKey="valor_usdt" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} align="right" />
              {(onEdit || onHistory || onDelete) && (
                <th className="py-3 px-4 text-center text-xs uppercase tracking-wider text-slate-400 font-medium w-24" scope="col">
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.map((item, idx) => {
              const glPct = item.gain_loss_pct ?? 0;
              const isPositive = glPct >= 0;
              const montoValor = (item.cantidad ?? 0) * (item.precio_bvc ?? 0);
              const montoUsdt = tasaBinance > 0 ? montoValor / tasaBinance : 0;

              return (
                <tr
                  key={item.ticker}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  {/* Activo */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                      />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{item.ticker}</p>
                        {item.sector && (
                          <p className="text-xs text-slate-400">{item.sector}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Cantidad */}
                  <td className="py-4 px-4 text-center text-sm font-mono text-slate-700">
                    {Math.floor(item.cantidad ?? 0).toLocaleString('es-VE')}
                  </td>

                  {/* P. Compra */}
                  <td className="py-4 px-4 text-center text-sm font-mono text-slate-400">
                    {fmtVE(item.precio_promedio_compra, 2)}
                  </td>

                  {/* P. Actual */}
                  <td className="py-4 px-4 text-center text-sm font-mono text-slate-700">
                    {fmtVE(item.precio_bvc, 2)}
                  </td>

                  {/* P&L % */}
                  <td className="py-4 px-4 text-center">
                    <span className={cn(
                      'inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-sm font-semibold font-mono',
                      isPositive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    )}>
                      {isPositive
                        ? <ArrowUpRight className="w-3.5 h-3.5" />
                        : <ArrowDownRight className="w-3.5 h-3.5" />
                      }
                      {fmtPct(glPct)}
                    </span>
                  </td>

                  {/* Valor Bs */}
                  <td className={cn(
                    'py-4 px-4 text-right text-sm font-mono font-semibold',
                    isPositive ? 'text-emerald-600' : 'text-rose-600'
                  )}>
                    {fmtVE(montoValor)}
                  </td>

                  {/* Valor USDT */}
                  <td className="py-4 px-4 text-right text-sm font-mono text-slate-600">
                    {fmtVE(montoUsdt)}
                  </td>

                  {/* Acciones */}
                  {(onEdit || onHistory || onDelete) && (
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors"
                            aria-label={`Editar ${item.ticker}`}
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onHistory && (
                          <button
                            onClick={() => onHistory(item.ticker)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                            aria-label={`Histórico ${item.ticker}`}
                            title="Histórico"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => {
                              const id = (item as any).id || (item as any).portafolio_id;
                              if (id) onDelete(id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            aria-label={`Eliminar ${item.ticker}`}
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PortfolioTable;
