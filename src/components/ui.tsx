import { cn } from './utils';
import { motion } from 'framer-motion';

// ─── Card ──────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'ghost';
  onClick?: () => void;
  hover?: boolean;
  animate?: boolean;
}

/**
 * Componente Card reutilizable con bordes redondeados, fondo surface, border sutil
 * Variantes: default (estándar), elevated (sombra mayor), ghost (sin fondo)
 * 
 * Micro-interacciones:
 * - Hover: elevación sutil con sombra aumentada
 * - Click: scale down mínimo (feedback táctil)
 * - Border izquierdo se intensifica en hover
 */
export const Card = ({ 
  children, 
  className, 
  variant = 'default', 
  onClick,
  hover = true,
  animate = true 
}: CardProps) => {
  const variants = {
    default: 'bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-md)]',
    elevated: 'bg-[var(--surface-elevated)] border border-[var(--border-hover)] shadow-[var(--shadow-xl)]',
    ghost: 'bg-transparent border border-transparent',
  };

  const cardContent = (
    <div
      className={cn(
        'rounded-[var(--radius-md)]',
        hover && 'transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
        hover && 'hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5',
        onClick && 'cursor-pointer active:scale-[0.98]',
        variants[variant],
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );

  // Si animate es true, agregar animación de entrada con framer-motion
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

// ─── CardHeader ────────────────────────────────────────────────────────────

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Header de Card con padding y border inferior
 */
export const CardHeader = ({ children, className }: CardHeaderProps) => (
  <div className={cn('px-4 py-3 border-b border-[var(--border)]', className)}>
    {children}
  </div>
);

// ─── CardContent ───────────────────────────────────────────────────────────

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Contenido de Card con padding estándar
 */
export const CardContent = ({ children, className }: CardContentProps) => (
  <div className={cn('p-4', className)}>
    {children}
  </div>
);

// ─── CardFooter ────────────────────────────────────────────────────────────

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Footer de Card con padding y border superior
 */
export const CardFooter = ({ children, className }: CardFooterProps) => (
  <div className={cn('px-4 py-3 border-t border-[var(--border)]', className)}>
    {children}
  </div>
);

// ─── Badge ─────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
  animate?: boolean;
  pulse?: boolean;
}

/**
 * Badge para estados (ganador/perdedor/estable)
 * Variantes: success (verde), warning (amarillo), error (rojo), info (azul), neutral (gris)
 * 
 * Micro-interacciones:
 * - Hover: cambio de opacidad y escala sutil
 * - Pulse: animación de pulso para estados activos
 * - Entrada animada con fade-in
 */
export const Badge = ({ 
  children, 
  variant = 'neutral', 
  className,
  animate = true,
  pulse = false
}: BadgeProps) => {
  const variants = {
    success: 'bg-[rgba(16,185,129,0.15)] text-[var(--success)]',
    warning: 'bg-[rgba(245,158,11,0.15)] text-[var(--warning)]',
    error: 'bg-[rgba(239,68,68,0.15)] text-[var(--error)]',
    info: 'bg-[rgba(59,130,246,0.15)] text-[var(--info)]',
    neutral: 'bg-[rgba(113,113,122,0.15)] text-[var(--text-muted)]',
  };

  const badgeContent = (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full',
        'transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]',
        'hover:scale-105 hover:opacity-90',
        pulse && 'animate-pulse',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );

  // Si animate es true, envolver con motion para entrada suave
  if (animate) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {badgeContent}
      </motion.span>
    );
  }

  return badgeContent;
};

// ─── StatCard ──────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  className?: string;
  onClick?: () => void;
  delay?: number;
}

/**
 * Componente para KPIs con icono, valor, label y tendencia opcional
 * 
 * Micro-interacciones:
 * - Hover: elevación con sombra aumentada
 * - Entrada: animación escalonada con delay opcional
 * - Click: feedback táctil con scale
 */
export const StatCard = ({
  icon,
  label,
  value,
  suffix,
  trend,
  trendValue,
  className,
  onClick,
  delay = 0,
}: StatCardProps) => {
  const trendColors = {
    up: 'text-[var(--success)]',
    down: 'text-[var(--error)]',
    stable: 'text-[var(--text-muted)]',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        ease: 'easeOut',
        delay: delay * 0.06 
      }}
      whileHover={{ 
        y: -2,
        transition: { duration: 0.2 }
      }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className="h-full"
    >
      <Card
        className={cn(
          'p-4 border-l-2 border-l-[var(--primary-500)] h-full',
          'hover:border-l-[var(--accent-500)]',
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
        hover={false}
        animate={false}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-[var(--tracking-wider)]">
            {label}
          </p>
          <motion.div 
            className="p-1.5 rounded-[var(--radius-sm)] bg-[rgba(16,185,129,0.1)] text-[var(--primary-500)]"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-2xl font-bold font-mono text-[var(--text-primary)]">
            {value}
          </p>
          {suffix && (
            <p className="text-xs text-[var(--text-secondary)] font-mono">
              {suffix}
            </p>
          )}
        </div>
        {trend && trendValue && (
          <motion.div 
            className={cn('flex items-center gap-1 mt-2 text-xs font-mono', trendColors[trend])}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + delay * 0.06 }}
          >
            <span>{trendIcons[trend]}</span>
            <span>{trendValue}</span>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};

// ─── SectionHeader ─────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Header de sección con título, subtítulo y acción opcional a la derecha
 */
export const SectionHeader = ({ title, subtitle, action, className }: SectionHeaderProps) => (
  <div className={cn('flex items-start justify-between mb-4', className)}>
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-[var(--text-secondary)]">
          {subtitle}
        </p>
      )}
    </div>
    {action && (
      <div className="flex items-center gap-2">
        {action}
      </div>
    )}
  </div>
);

// ─── Divider ───────────────────────────────────────────────────────────────

interface DividerProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Línea divisoria horizontal o vertical
 */
export const Divider = ({ className, orientation = 'horizontal' }: DividerProps) => (
  <div
    className={cn(
      orientation === 'horizontal'
        ? 'w-full h-px bg-[var(--border)]'
        : 'w-px h-full bg-[var(--border)]',
      className
    )}
  />
);

// ─── Skeleton ──────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'text-sm' | 'text-lg' | 'text-xl' | 'circular' | 'rectangular';
  shimmer?: boolean;
}

/**
 * Skeleton loading para estados de carga con efecto shimmer opcional
 *
 * @example
 * // Uso básico
 * <Skeleton variant="text" />
 *
 * @example
 * // Con efecto shimmer
 * <Skeleton variant="rectangular" shimmer />
 */
export const Skeleton = ({ className, variant = 'rectangular', shimmer = false }: SkeletonProps) => {
  const variants = {
    'text': 'h-4 w-full rounded',
    'text-sm': 'h-3 w-full rounded',
    'text-lg': 'h-5 w-3/4 rounded',
    'text-xl': 'h-6 w-2/3 rounded',
    'circular': 'rounded-full',
    'rectangular': 'rounded-[var(--radius-sm)]',
  };

  return (
    <div className={cn('relative overflow-hidden animate-pulse bg-[var(--border)]', variants[variant], className)}>
      {shimmer && (
        <motion.div
          className="absolute inset-0"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: 'linear',
          }}
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
          }}
        />
      )}
    </div>
  );
};
