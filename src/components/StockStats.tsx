'use client';

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Activity, Calendar, Target } from 'lucide-react';
import { cn, formatValue, formatInt, formatPercentSimple } from '@/components/utils';
import type { BVCData } from '@/app/types';

// ============================================================================
// INTERFACES
// ============================================================================

interface StockStatsProps {
  stock: BVCData;
  className?: string;
}

interface StatItemProps {
  label: string;
  value: string;
  variant?: 'default' | 'green' | 'red' | 'blue';
  className?: string;
}

interface PriceRangeBarProps {
  current: number;
  min: number;
  max: number;
  label: string;
  showLabels?: boolean;
}

// ============================================================================
// COMPONENTE: ITEM DE ESTADÍSTICA
// ============================================================================

function StatItem({ label, value, variant = 'default', className }: StatItemProps) {
  const colorMap = {
    default: 'text-slate-900',
    green: 'text-emerald-600',
    red: 'text-rose-600',
    blue: 'text-blue-600',
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-b-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={cn("text-sm font-bold font-mono", colorMap[variant])}>{value}</span>
    </div>
  );
}

// ============================================================================
// COMPONENTE: BARRA DE RANGO DE PRECIOS
// ============================================================================

function PriceRangeBar({ current, min, max, label, showLabels = true }: PriceRangeBarProps) {
  // Calcular la posición relativa del precio actual en el rango
  const range = max - min;
  const position = range > 0 ? ((current - min) / range) * 100 : 50;
  const clampedPosition = Math.min(100, Math.max(0, position));

  return (
    <div className="space-y-2">
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">{label}</span>
          <span className="text-slate-900 font-mono font-bold">
            {formatValue(current, 2)} Bs
          </span>
        </div>
      )}

      {/* Barra de rango con gradiente */}
      <div className="relative h-3 bg-white rounded-full overflow-hidden">
        {/* Gradiente rojo-verde */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)',
            opacity: 0.3,
          }}
        />

        {/* Marcador de posición actual */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-lg shadow-white/50 transition-all duration-500"
          style={{ left: `${clampedPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-full shadow-lg shadow-white/50" />
        </div>
      </div>

      {/* Etiquetas de min/max */}
      {showLabels && (
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-rose-600">{formatValue(min, 2)}</span>
          <span className="text-emerald-600">{formatValue(max, 2)}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL: STOCK STATS
// ============================================================================

export function StockStats({ stock, className }: StockStatsProps) {
  // Calcular estadísticas derivadas
  const stats = useMemo(() => {
    const apertura = stock.precio_apert ?? 0;
    const maximo = stock.precio_max ?? stock.precio ?? 0;
    const minimo = stock.precio_min ?? stock.precio ?? 0;
    const precioActual = stock.precio ?? 0;
    const volumen = stock.volumen ?? 0;
    const monto = stock.monto_efectivo ?? 0;
    const operaciones = stock.tot_op_negoc ?? 0;

    // Promedio ponderado (monto / volumen) si hay volumen
    const promedio = volumen > 0 ? monto / volumen : precioActual;

    // Rango anual estimado (usamos el rango diario como proxy si no hay datos anuales)
    // En una implementación real, esto vendría de un endpoint histórico
    const rangoAnualMin = minimo * 0.85; // Estimación conservadora
    const rangoAnualMax = maximo * 1.15;

    return {
      apertura,
      maximo,
      minimo,
      precioActual,
      promedio,
      volumen,
      monto,
      operaciones,
      rangoAnualMin,
      rangoAnualMax,
    };
  }, [stock]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* GRID DE 3 COLUMNAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* CARD 1: SESIÓN DEL DÍA */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-white">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Sesión del Día
            </h3>
          </div>

          <div className="p-4 space-y-1">
            <StatItem
              label="Apertura"
              value={stats.apertura > 0 ? `${formatValue(stats.apertura, 2)} Bs` : '-'}
              variant="blue"
            />
            <StatItem
              label="Máximo"
              value={stats.maximo > 0 ? `${formatValue(stats.maximo, 2)} Bs` : '-'}
              variant="green"
            />
            <StatItem
              label="Mínimo"
              value={stats.minimo > 0 ? `${formatValue(stats.minimo, 2)} Bs` : '-'}
              variant="red"
            />
            <StatItem
              label="Promedio"
              value={stats.promedio > 0 ? `${formatValue(stats.promedio, 2)} Bs` : '-'}
              variant="default"
            />
          </div>
        </div>

        {/* CARD 2: ACTIVIDAD */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-white">
            <Activity className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Actividad
            </h3>
          </div>

          <div className="p-4 space-y-1">
            <StatItem
              label="Operaciones"
              value={stats.operaciones > 0 ? formatInt(stats.operaciones) : '-'}
              variant="blue"
            />
            <StatItem
              label="Volumen"
              value={stats.volumen > 0 ? formatInt(stats.volumen) : '-'}
              variant="default"
            />
            <StatItem
              label="Monto"
              value={
                stats.monto > 0
                  ? `${formatInt(stats.monto)} Bs`
                  : '-'
              }
              variant="default"
            />
            <StatItem
              label="Acciones"
              value="—"
              variant="default"
            />
          </div>
        </div>

        {/* CARD 3: RANGO DE PRECIOS */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-white">
            <Target className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Rango de Precios
            </h3>
          </div>

          <div className="p-4 space-y-4">
            {/* Rango diario */}
            {stats.minimo > 0 && stats.maximo > 0 && stats.precioActual > 0 && (
              <PriceRangeBar
                current={stats.precioActual}
                min={stats.minimo}
                max={stats.maximo}
                label="Rango Diario"
              />
            )}

            {/* Separador */}
            <div className="border-t border-slate-200" />

            {/* Rango anual (estimado) */}
            {stats.precioActual > 0 && (
              <PriceRangeBar
                current={stats.precioActual}
                min={stats.rangoAnualMin}
                max={stats.rangoAnualMax}
                label="Rango Anual (est.)"
              />
            )}
          </div>
        </div>
      </div>

      {/* VARIACIÓN DEL DÍA - Banner inferior */}
      {stock.variacion_pct !== null && stock.variacion_pct !== undefined && (
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 rounded-lg border",
            stock.variacion_pct >= 0
              ? "bg-emerald-50 border-emerald-200"
              : "bg-rose-50 border-red-500/20"
          )}
        >
          <div className="flex items-center gap-2">
            {stock.variacion_pct >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600" />
            )}
            <span className="text-xs text-slate-400">Variación</span>
          </div>

          <div className="flex items-center gap-4">
            <span
              className={cn(
                "text-sm font-bold font-mono",
                stock.variacion_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {formatPercentSimple(Math.abs(stock.variacion_pct), 2)}
            </span>
            {stock.variacion_abs !== null && stock.variacion_abs !== undefined && (
              <span
                className={cn(
                  "text-xs font-mono",
                  stock.variacion_abs >= 0 ? 'text-emerald-600' : 'text-rose-600'
                )}
              >
                ({stock.variacion_abs >= 0 ? '+' : ''}
                {formatValue(stock.variacion_abs, 2)} Bs)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StockStats;
