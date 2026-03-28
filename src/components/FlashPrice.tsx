'use client';

import { useEffect, useState } from 'react';
import { cn } from './utils';

interface FlashPriceProps {
  value: number | undefined;
  previous?: number;
  decimals?: number;
}

/**
 * Precio con efecto flash cuando cambia
 */
export function FlashPrice({ value, previous, decimals = 2 }: FlashPriceProps) {
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
      {(value ?? 0).toFixed(decimals)}
    </span>
  );
}
