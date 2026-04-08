'use client';

import React, { useEffect, useState } from 'react';
import { cn, formatValue } from './utils';

interface FlashPriceProps {
  value: number | undefined;
  previous?: number;
  decimals?: number;
  suffix?: string;
}

/**
 * Precio con efecto flash cuando cambia
 * OPTIMIZADO: Envuelto en React.memo para evitar re-renderizados innecesarios
 */
export const FlashPrice = React.memo(function FlashPrice({ value, previous, decimals = 2, suffix }: FlashPriceProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (previous !== undefined && value !== previous) {
      setFlash((value ?? 0) > (previous ?? 0) ? 'up' : 'down');
      const timer = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(timer);
    }
  }, [value, previous]);

  const flashClass = flash === 'up'
    ? 'bg-emerald-500/30 text-emerald-400'
    : flash === 'down'
    ? 'bg-red-500/30 text-red-400'
    : '';

  return (
    <span className={cn("font-mono font-bold transition-all duration-200 px-1 rounded", flashClass)}>
      {formatValue(value, decimals)}{suffix && ` ${suffix}`}
    </span>
  );
});
