'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { cn } from '@/components/utils';
import type { MacroRow } from '@/app/types';

// ============================================================================
// SPREAD CHART
// ============================================================================

interface SpreadChartProps {
  macro: MacroRow[];
  mounted: boolean;
}

export function SpreadChart({ macro, mounted }: SpreadChartProps) {
  const brechaData = useMemo(() => {
    if (!Array.isArray(macro) || macro.length === 0) return [];
    return [...macro].reverse().slice(-15).map(item => {
      const bcv = item?.tasa_bcv || 0;
      const binance = item?.tasa_binance_p2p || 0;
      const brecha = (bcv > 0 && binance > 0)
        ? Number((((binance - bcv) / bcv) * 100).toFixed(2))
        : 0;
      const fecha = item?.fecha ? String(item.fecha).substring(5) : '--/--';
      return { fecha, brecha };
    });
  }, [macro]);

  const lastBrecha = brechaData.length > 0 ? brechaData[brechaData.length - 1].brecha : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-slate-800">Brecha Cambiaria</h3>
        </div>
        <span className={cn(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
          lastBrecha >= 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
        )}>
          {lastBrecha >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {lastBrecha >= 0 ? '+' : ''}{lastBrecha.toFixed(2)}%
        </span>
      </div>
      <div className="p-4">
        <div className="h-52 min-h-[200px]">
          {mounted && brechaData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={brechaData}>
                <defs>
                  <linearGradient id="colorBrechaInst" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="fecha"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  }}
                  itemStyle={{ color: '#d97706' }}
                  formatter={(value: any) => [`${value}%`, 'Brecha']}
                />
                <Area
                  type="monotone"
                  dataKey="brecha"
                  stroke="#d97706"
                  strokeWidth={2}
                  fill="url(#colorBrechaInst)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              {!mounted ? 'Cargando gráfico...' : 'Sin datos disponibles'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// RATES EVOLUTION CHART
// ============================================================================

interface RatesChartProps {
  macro: MacroRow[];
  mounted: boolean;
}

export function RatesChart({ macro, mounted }: RatesChartProps) {
  const ratesData = useMemo(() => {
    if (!Array.isArray(macro) || macro.length < 2) return [];
    return [...macro].reverse().slice(-30);
  }, [macro]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-800">Evolución de Tasas</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full bg-blue-500 inline-block" />
            <span className="text-slate-500">BCV</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full bg-amber-500 inline-block" />
            <span className="text-slate-500">Binance</span>
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="h-52 min-h-[200px]">
          {mounted && ratesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ratesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="fecha"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  tickFormatter={(tick) => tick ? String(tick).substring(5) : '--/--'}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  }}
                />
                <Line type="monotone" dataKey="tasa_bcv" stroke="#2563eb" strokeWidth={2} dot={false} name="BCV" />
                <Line type="monotone" dataKey="tasa_binance_p2p" stroke="#d97706" strokeWidth={2} dot={false} name="Binance" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              {!mounted ? 'Cargando gráfico...' : 'Sin datos disponibles'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SpreadChart;
