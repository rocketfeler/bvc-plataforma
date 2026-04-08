import { cn } from './utils';

// ─── Card ──────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'ghost';
  onClick?: () => void;
}

/**
 * Componente Card reutilizable con bordes redondeados, fondo surface, border sutil
 * Variantes: default (estándar), elevated (sombra mayor), ghost (sin fondo)
 */
export const Card = ({ children, className, variant = 'default', onClick }: CardProps) => {
  const variants = {
    default: 'bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-md)]',
    elevated: 'bg-[var(--surface-elevated)] border border-[var(--border-hover)] shadow-[var(--shadow-xl)]',
    ghost: 'bg-transparent border border-transparent',
  };

  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
        'hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-lg)]',
        variants[variant],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
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
}

/**
 * Badge para estados (ganador/perdedor/estable)
 * Variantes: success (verde), warning (amarillo), error (rojo), info (azul), neutral (gris)
 */
export const Badge = ({ children, variant = 'neutral', className }: BadgeProps) => {
  const variants = {
    success: 'bg-[rgba(16,185,129,0.15)] text-[var(--success)]',
    warning: 'bg-[rgba(245,158,11,0.15)] text-[var(--warning)]',
    error: 'bg-[rgba(239,68,68,0.15)] text-[var(--error)]',
    info: 'bg-[rgba(59,130,246,0.15)] text-[var(--info)]',
    neutral: 'bg-[rgba(113,113,122,0.15)] text-[var(--text-muted)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full',
        'transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
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
}

/**
 * Componente para KPIs con icono, valor, label y tendencia opcional
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
    <Card
      className={cn(
        'p-4 border-l-2 border-l-[var(--primary-500)]',
        onClick && 'hover:border-l-[var(--accent-500)]',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-[var(--tracking-wider)]">
          {label}
        </p>
        <div className="p-1.5 rounded-[var(--radius-sm)] bg-[rgba(16,185,129,0.1)] text-[var(--primary-500)]">
          {icon}
        </div>
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
        <div className={cn('flex items-center gap-1 mt-2 text-xs font-mono', trendColors[trend])}>
          <span>{trendIcons[trend]}</span>
          <span>{trendValue}</span>
        </div>
      )}
    </Card>
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
  variant?: 'text' | 'circular' | 'rectangular';
}

/**
 * Skeleton loading para estados de carga
 */
export const Skeleton = ({ className, variant = 'rectangular' }: SkeletonProps) => {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-[var(--radius-sm)]',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--border)]',
        variants[variant],
        className
      )}
    />
  );
};
