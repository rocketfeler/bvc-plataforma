'use client';

import { useEffect, useState, useCallback } from 'react';
import { cn, formatValue } from './utils';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface PriceFlashProps {
  value: number | undefined | null;
  previous?: number | null;
  decimals?: number;
  suffix?: string;
  className?: string;
  duration?: number;
  showArrow?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

// ─── Componente Principal PriceFlash ────────────────────────────────────────

/**
 * Componente que muestra un precio con animación flash cuando cambia.
 * Detecta automáticamente si el precio subió o bajó y aplica colores.
 * 
 * @example
 * // Uso básico
 * <PriceFlash value={1234.56} previous={1200} />
 * 
 * @example
 * // Con duración personalizada
 * <PriceFlash value={precio} previous={precioAnterior} duration={500} />
 * 
 * @example
 * // Sin animación (solo flash)
 * <PriceFlash value={valor} previous={valorPrevio} animate={false} />
 */
export function PriceFlash({
  value,
  previous,
  decimals = 2,
  suffix,
  className,
  duration = 500,
  showArrow = false,
  size = 'md',
  animate = true,
}: PriceFlashProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [displayValue, setDisplayValue] = useState(value);

  // Detectar cambio de precio
  useEffect(() => {
    if (previous !== null && previous !== undefined && 
        value !== null && value !== undefined && 
        value !== previous) {
      
      const isUp = value > previous;
      setFlash(isUp ? 'up' : 'down');
      setDisplayValue(value);

      const timer = setTimeout(() => setFlash(null), duration);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, previous, duration]);

  // Clases según estado
  const flashClass = flash === 'up'
    ? 'bg-emerald-500/30 text-emerald-400'
    : flash === 'down'
    ? 'bg-red-500/30 text-red-400'
    : 'text-[var(--text-primary)]';

  // Tamaños
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  // Icono de flecha
  const ArrowIcon = flash === 'up' 
    ? '↑' 
    : flash === 'down' 
    ? '↓' 
    : '';

  return (
    <motion.span
      className={cn(
        'inline-flex items-center gap-1 font-mono font-bold rounded px-1',
        'transition-all ease-[cubic-bezier(0.4,0,0.2,1)]',
        animate ? 'duration-200' : 'duration-0',
        sizeClasses[size],
        flashClass,
        className
      )}
      animate={flash && animate ? {
        scale: [1, 1.05, 1],
      } : {}}
      transition={{
        duration: 0.3,
        ease: 'easeOut',
      }}
    >
      {showArrow && flash && (
        <motion.span
          initial={{ opacity: 0, y: flash === 'up' ? 4 : -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="inline-block"
        >
          {ArrowIcon}
        </motion.span>
      )}
      {formatValue(displayValue, decimals)}
      {suffix && <span className="text-xs opacity-70 ml-0.5">{suffix}</span>}
    </motion.span>
  );
}

// ─── Componente PriceChange (para mostrar cambio porcentual) ────────────────

export interface PriceChangeProps {
  current: number;
  previous: number;
  decimals?: number;
  showValue?: boolean;
  className?: string;
}

/**
 * Muestra el cambio de precio con flecha y porcentaje
 * 
 * @example
 * <PriceChange current={1250} previous={1200} />
 */
export function PriceChange({ 
  current, 
  previous, 
  decimals = 2, 
  showValue = true,
  className 
}: PriceChangeProps) {
  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <motion.span
      className={cn(
        'inline-flex items-center gap-1 font-mono text-sm font-semibold',
        isPositive ? 'text-emerald-400' : 'text-red-400',
        className
      )}
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <span className="text-base">
        {isPositive ? '↑' : '↓'}
      </span>
      {showValue && (
        <>
          <span>{formatValue(Math.abs(change), decimals)}</span>
          <span className="text-xs opacity-70">
            ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
          </span>
        </>
      )}
      {!showValue && (
        <span>
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      )}
    </motion.span>
  );
}

// ─── Hook usePriceFlash (para usar en componentes personalizados) ───────────

/**
 * Hook que retorna el estado de flash para usar en componentes personalizados
 * 
 * @example
 * const { flash, flashClass } = usePriceFlash(value, previous);
 * return <span className={flashClass}>{value}</span>;
 */
export function usePriceFlash(
  value: number | undefined | null,
  previous: number | null | undefined,
  duration = 500
) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (previous !== null && previous !== undefined &&
        value !== null && value !== undefined &&
        value !== previous) {
      
      const isUp = value > previous;
      setFlash(isUp ? 'up' : 'down');

      const timer = setTimeout(() => setFlash(null), duration);
      return () => clearTimeout(timer);
    }
  }, [value, previous, duration]);

  const flashClass = flash === 'up'
    ? 'text-emerald-400'
    : flash === 'down'
    ? 'text-red-400'
    : '';

  return { flash, flashClass };
}
