'use client';

import { cn } from './utils';
import { motion } from 'framer-motion';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type SkeletonVariant = 
  | 'text' 
  | 'text-sm' 
  | 'text-lg' 
  | 'text-xl'
  | 'circular' 
  | 'rectangular'
  | 'card'
  | 'table-row'
  | 'button'
  | 'avatar'
  | 'thumbnail';

export interface SkeletonProps {
  className?: string;
  variant?: SkeletonVariant;
  count?: number;
  shimmer?: boolean;
}

// ─── Variantes predefinidas ─────────────────────────────────────────────────

const variantStyles: Record<SkeletonVariant, string> = {
  'text': 'h-4 w-full rounded',
  'text-sm': 'h-3 w-full rounded',
  'text-lg': 'h-5 w-3/4 rounded',
  'text-xl': 'h-6 w-2/3 rounded',
  'circular': 'rounded-full',
  'rectangular': 'rounded-[var(--radius-sm)]',
  'card': 'h-32 w-full rounded-[var(--radius-md)]',
  'table-row': 'h-12 w-full rounded',
  'button': 'h-10 w-24 rounded-[var(--radius-sm)]',
  'avatar': 'h-10 w-10 rounded-full',
  'thumbnail': 'h-20 w-20 rounded-[var(--radius-sm)]',
};

// ─── Componente Shimmer (efecto de brillo deslizante) ───────────────────────

interface ShimmerProps {
  className?: string;
}

function Shimmer({ className }: ShimmerProps) {
  return (
    <motion.div
      className={cn('absolute inset-0 overflow-hidden', className)}
      initial={{ x: '-100%' }}
      animate={{ x: '100%' }}
      transition={{
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear',
      }}
      style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
      }}
    />
  );
}

// ─── Componente SkeletonRow (para tablas) ───────────────────────────────────

interface SkeletonRowProps {
  columns?: number;
  className?: string;
}

function SkeletonRow({ columns = 5, className }: SkeletonRowProps) {
  return (
    <tr className={cn('border-b border-[var(--border)]', className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton variant="text" className={cn(
            i === 0 ? 'w-24' : i === 1 ? 'w-16' : 'w-12'
          )} />
        </td>
      ))}
    </tr>
  );
}

// ─── Componente SkeletonCard (para cards de métricas) ───────────────────────

interface SkeletonCardProps {
  className?: string;
}

function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn('p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Skeleton variant="text-sm" className="w-20" />
        <Skeleton variant="circular" className="w-6 h-6" />
      </div>
      <Skeleton variant="text-xl" className="w-2/3" />
      <Skeleton variant="text-sm" className="w-1/2" />
    </div>
  );
}

// ─── Componente SkeletonTable (para tablas completas) ───────────────────────

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

function SkeletonTable({ rows = 5, columns = 5, className }: SkeletonTableProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex gap-4 px-4 py-2 border-b border-[var(--border)]">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text-sm" className={cn(
            'flex-1',
            i === 0 ? 'flex-[2]' : 'flex-1'
          )} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} variant="text" className={cn(
              'flex-1',
              j === 0 ? 'flex-[2]' : 'flex-1'
            )} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Componente Principal Skeleton ──────────────────────────────────────────

/**
 * Skeleton mejorado con efecto shimmer y variantes avanzadas
 * 
 * @example
 * // Uso básico
 * <Skeleton variant="text" />
 * 
 * @example
 * // Con shimmer effect
 * <Skeleton variant="card" shimmer count={3} />
 * 
 * @example
 * // Tabla skeleton
 * <SkeletonTable rows={8} columns={6} />
 * 
 * @example
 * // Card skeleton
 * <SkeletonCard />
 */
export const Skeleton = ({ 
  className, 
  variant = 'rectangular', 
  count = 1,
  shimmer = false 
}: SkeletonProps) => {
  const baseStyle = 'relative overflow-hidden bg-[var(--border)]';
  const variantStyle = variantStyles[variant];

  // Si count > 1, renderizar múltiples skeletons
  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(baseStyle, variantStyle, className)}
          >
            {shimmer && <Shimmer />}
          </div>
        ))}
      </>
    );
  }

  return (
    <div className={cn(baseStyle, variantStyle, className)}>
      {shimmer && <Shimmer />}
    </div>
  );
};

// ─── Exportar componentes especializados ────────────────────────────────────

export { Shimmer };
export type { SkeletonRowProps, SkeletonCardProps, SkeletonTableProps };
export { SkeletonRow, SkeletonCard, SkeletonTable };
