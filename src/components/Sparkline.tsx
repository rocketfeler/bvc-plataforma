'use client';

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { cn } from './utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  className?: string;
}

/**
 * Componente Sparkline - Mini gráfico de tendencia
 * Muestra la tendencia de precios en un gráfico compacto
 * OPTIMIZADO: Envuelto en React.memo para evitar re-renderizados innecesarios
 */
export const Sparkline = React.memo(function Sparkline({
  data,
  width = 80,
  height = 32,
  positive = true,
  className
}: SparklineProps) {
  // Generar datos para el gráfico a partir del array de precios
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // Si hay un solo dato, duplicarlo para crear una línea visible
    if (data.length === 1) {
      return [
        { value: data[0], index: 0 },
        { value: data[0], index: 1 },
      ];
    }

    return data.map((value, index) => ({
      value,
      index,
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div 
        className={cn('inline-flex items-center justify-center', className)}
        style={{ width, height }}
      >
        <span className="text-slate-600 text-[10px]">-</span>
      </div>
    );
  }

  // Determinar si la tendencia es positiva o negativa
  const isPositive = data.length >= 2 
    ? data[data.length - 1] >= data[0] 
    : positive;

  const strokeColor = isPositive ? '#10b981' : '#ef4444';
  const fillColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <div 
      className={cn('inline-flex items-center justify-center', className)}
      style={{ width, height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${isPositive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={fillColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="index" hide />
          <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#gradient-${isPositive ? 'up' : 'down'})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
