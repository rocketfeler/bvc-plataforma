'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { BVCData } from '@/app/types';
import { cn, formatValue, formatInt } from './utils';

// ============================================================================
// TYPES
// ============================================================================

interface MarketKPIsProps {
  bvc: BVCData[];
}

interface KPICardData {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateKPIs(bvc: BVCData[]) {
  const activos = bvc.filter((a) => (a.volumen ?? 0) > 0);
  const totalActivos = activos.length;

  const montoNegociado = activos.reduce((acc, a) => {
    const monto = a.monto_efectivo ?? 0;
    return acc + monto;
  }, 0);

  const volumenTotal = activos.reduce((acc, a) => {
    const vol = a.volumen ?? 0;
    return acc + vol;
  }, 0);

  const avanzan = bvc.filter((a) => (a.variacion_pct ?? 0) > 0).length;
  const retroceden = bvc.filter((a) => (a.variacion_pct ?? 0) < 0).length;
  const estables = bvc.length - avanzan - retroceden;

  // Índice del día: promedio ponderado por volumen de las variaciones
  const indexChange = (() => {
    const totalVol = bvc.reduce((acc, a) => acc + (a.volumen ?? 0), 0);
    if (totalVol === 0) return 0;
    const weightedSum = bvc.reduce((acc, a) => {
      const vol = a.volumen ?? 0;
      const pct = a.variacion_pct ?? 0;
      return acc + (vol * pct);
    }, 0);
    return weightedSum / totalVol;
  })();

  return {
    totalActivos,
    montoNegociado,
    volumenTotal,
    avanzan,
    retroceden,
    estables,
    indexChange,
  };
}

function formatMonto(monto: number): string {
  if (monto >= 1_000_000_000) {
    return `${(monto / 1_000_000_000).toFixed(2)}B`;
  }
  if (monto >= 1_000_000) {
    return `${(monto / 1_000_000).toFixed(2)}M`;
  }
  if (monto >= 1_000) {
    return `${(monto / 1_000).toFixed(1)}K`;
  }
  return monto.toFixed(2);
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function MarketKPIs({ bvc }: MarketKPIsProps) {
  const kpis = calculateKPIs(bvc);

  const cards: KPICardData[] = [
    {
      icon: BarChart3,
      label: 'ACCIONES ACTIVAS',
      value: String(kpis.totalActivos),
      subValue: `de ${bvc.length} listadas`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      icon: DollarSign,
      label: 'MONTO NEGOCIADO',
      value: `Bs. ${formatMonto(kpis.montoNegociado)}`,
      subValue: kpis.montoNegociado > 0 ? 'en efectivo' : undefined,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
    {
      icon: Activity,
      label: 'VOLUMEN TOTAL',
      value: formatInt(kpis.volumenTotal),
      subValue: 'acciones',
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20',
    },
    {
      icon: kpis.avanzan >= kpis.retroceden ? TrendingUp : TrendingDown,
      label: 'AVANZAN / RETROCEDEN',
      value: `${kpis.avanzan} / ${kpis.retroceden}`,
      subValue: kpis.estables > 0 ? `${kpis.estables} estables` : undefined,
      color: kpis.avanzan >= kpis.retroceden ? 'text-emerald-600' : 'text-rose-600',
      bgColor: kpis.avanzan >= kpis.retroceden ? 'bg-emerald-50' : 'bg-rose-50',
      borderColor: kpis.avanzan >= kpis.retroceden ? 'border-emerald-200' : 'border-red-500/20',
    },
    {
      icon: kpis.indexChange >= 0 ? ArrowUpRight : ArrowDownRight,
      label: 'ÍNDICE DEL DÍA',
      value: `${kpis.indexChange >= 0 ? '+' : ''}${kpis.indexChange.toFixed(2)}%`,
      subValue: kpis.indexChange >= 0 ? 'alcista' : 'bajista',
      color: kpis.indexChange >= 0 ? 'text-emerald-600' : 'text-rose-600',
      bgColor: kpis.indexChange >= 0 ? 'bg-emerald-50' : 'bg-rose-50',
      borderColor: kpis.indexChange >= 0 ? 'border-emerald-200' : 'border-red-500/20',
    },
  ];

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
      role="region"
      aria-label="Indicadores clave del mercado (KPIs)"
      aria-live="polite"
    >
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.3 }}
            className={cn(
              "rounded-[var(--radius-md)] border p-3 transition-all hover:scale-[1.02] focus-within:ring-2 focus-within:ring-emerald-500",
              card.bgColor,
              card.borderColor
            )}
            role="group"
            aria-label={card.label}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className={cn("w-3.5 h-3.5", card.color)} aria-hidden="true" />
                  <span className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-medium">
                    {card.label}
                  </span>
                </div>
                <p className={cn("text-base sm:text-lg font-bold font-mono truncate", card.color)} aria-live="polite" aria-atomic="true">
                  {card.value}
                </p>
                {card.subValue && (
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono mt-0.5">
                    {card.subValue}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
