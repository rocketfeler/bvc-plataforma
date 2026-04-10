'use client';

import React from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, ArrowUpRight,
  ArrowDownRight, Activity, BarChart3
} from 'lucide-react';
import { cn } from '@/components/utils';

// ============================================================================
// TYPES
// ============================================================================

interface KpiCardData {
  label: string;
  value: string;
  suffix?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  subtext?: string;
}

interface KpiCardsProps {
  cards: KpiCardData[];
}

// ============================================================================
// SINGLE KPI CARD
// ============================================================================

function KpiCard({ label, value, suffix, change, changeType = 'neutral', icon, subtext }: KpiCardData) {
  const changeColors = {
    positive: 'text-emerald-600 bg-emerald-50',
    negative: 'text-rose-600 bg-rose-50',
    neutral: 'text-slate-500 bg-slate-100',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            {label}
          </p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl font-bold text-slate-900 font-mono truncate">
              {value}
            </p>
            {suffix && (
              <span className="text-sm font-medium text-slate-400">{suffix}</span>
            )}
          </div>
          {change && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className={cn(
                'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium',
                changeColors[changeType]
              )}>
                {changeType === 'positive' && <ArrowUpRight className="w-3 h-3" />}
                {changeType === 'negative' && <ArrowDownRight className="w-3 h-3" />}
                {change}
              </span>
            </div>
          )}
          {subtext && (
            <p className="mt-1.5 text-xs text-slate-400 font-mono">{subtext}</p>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 text-slate-400 flex-shrink-0 ml-3">
          {icon}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KPI CARDS GRID — PARA PORTAFOLIO
// ============================================================================

interface PortfolioKpiCardsProps {
  totalVes: number;
  totalUsd: number; 
  totalUsdt: number;
  roiPct: number;
  gananciaPerdida: number;
  totalInversion: number;
  tasaBcv: number;
  tasaBinance: number;
}

export function PortfolioKpiCards({
  totalVes,
  totalUsd,
  totalUsdt,
  roiPct,
  gananciaPerdida,
  totalInversion,
  tasaBcv,
  tasaBinance,
}: PortfolioKpiCardsProps) {
  const isProfit = gananciaPerdida >= 0;

  const formatVE = (val: number, dec = 2) =>
    val.toLocaleString('es-VE', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  const cards: KpiCardData[] = [
    {
      label: 'Valor Total',
      value: formatVE(totalVes),
      suffix: 'Bs',
      change: `ROI: ${roiPct >= 0 ? '+' : ''}${roiPct.toFixed(2)}%`,
      changeType: roiPct >= 0 ? 'positive' : 'negative',
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      label: 'USD (BCV)',
      value: formatVE(totalUsd),
      suffix: '$',
      icon: <DollarSign className="w-5 h-5" />,
      subtext: `Tasa: ${formatVE(tasaBcv)} Bs/$`,
    },
    {
      label: 'USDT (P2P)',
      value: formatVE(totalUsdt),
      suffix: 'USDT',
      icon: <Activity className="w-5 h-5" />,
      subtext: `Tasa: ${formatVE(tasaBinance)} Bs/USDT`,
    },
    {
      label: 'Ganancia / Pérdida',
      value: `${isProfit ? '+' : ''}${formatVE(gananciaPerdida)}`,
      suffix: 'Bs',
      change: `Inversión: ${formatVE(totalInversion)} Bs`,
      changeType: isProfit ? 'positive' : 'negative',
      icon: isProfit
        ? <TrendingUp className="w-5 h-5" />
        : <TrendingDown className="w-5 h-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}

// ============================================================================
// KPI CARDS GRID — PARA DASHBOARD (Tasas)
// ============================================================================

interface DashboardKpiCardsProps {
  tasaBcv: number;
  tasaBinance: number | null;
  brechaPct: number;
  totalAcciones: number;
  accionesUp: number;
  accionesDown: number;
  indiceDia: number;
}

export function DashboardKpiCards({
  tasaBcv,
  tasaBinance,
  brechaPct,
  totalAcciones,
  accionesUp,
  accionesDown,
  indiceDia,
}: DashboardKpiCardsProps) {
  const formatVE = (val: number, dec = 2) =>
    val.toLocaleString('es-VE', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  const cards: KpiCardData[] = [
    {
      label: 'Tasa BCV',
      value: formatVE(tasaBcv),
      suffix: 'Bs/$',
      icon: <DollarSign className="w-5 h-5" />,
      change: 'Oficial',
      changeType: 'neutral',
    },
    {
      label: 'Tasa Binance P2P',
      value: tasaBinance ? formatVE(tasaBinance) : '—',
      suffix: 'Bs/USDT',
      icon: <Activity className="w-5 h-5" />,
      change: `Brecha: ${brechaPct >= 0 ? '+' : ''}${brechaPct.toFixed(2)}%`,
      changeType: brechaPct > 5 ? 'negative' : brechaPct > 0 ? 'neutral' : 'positive',
    },
    {
      label: 'Mercado BVC',
      value: totalAcciones.toString(),
      suffix: 'acciones',
      icon: <BarChart3 className="w-5 h-5" />,
      change: `↑${accionesUp} ↓${accionesDown}`,
      changeType: accionesUp >= accionesDown ? 'positive' : 'negative',
    },
    {
      label: 'Índice del Día',
      value: `${indiceDia >= 0 ? '+' : ''}${indiceDia.toFixed(2)}%`,
      icon: indiceDia >= 0
        ? <TrendingUp className="w-5 h-5" />
        : <TrendingDown className="w-5 h-5" />,
      changeType: indiceDia >= 0 ? 'positive' : 'negative',
      change: indiceDia >= 0 ? 'Alcista' : 'Bajista',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}

export default KpiCard;
