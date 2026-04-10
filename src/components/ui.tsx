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
 * Componente Card institucional — fondo blanco, bordes slate-200, shadow suave
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
    default: 'bg-white border border-slate-200 shadow-sm',
    elevated: 'bg-white border border-slate-200 shadow-md',
    ghost: 'bg-transparent border border-transparent',
  };

  const cardContent = (
    <div
      className={cn(
        'rounded-xl',
        hover && 'transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
        hover && 'hover:border-slate-300 hover:shadow-md',
        onClick && 'cursor-pointer active:scale-[0.99]',
        variants[variant],
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
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

export const CardHeader = ({ children, className }: CardHeaderProps) => (
  <div className={cn('px-5 py-4 border-b border-slate-100', className)}>
    {children}
  </div>
);

// ─── CardContent ───────────────────────────────────────────────────────────

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent = ({ children, className }: CardContentProps) => (
  <div className={cn('p-5', className)}>
    {children}
  </div>
);

// ─── CardFooter ────────────────────────────────────────────────────────────

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter = ({ children, className }: CardFooterProps) => (
  <div className={cn('px-5 py-3 border-t border-slate-100 bg-slate-50/50', className)}>
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
 * Badge institucional — fondos suaves, colores sobrios
 */
export const Badge = ({
  children,
  variant = 'neutral',
  className,
  animate = true,
  pulse = false
}: BadgeProps) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10',
    error: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/10',
    info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10',
    neutral: 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/10',
  };

  const badgeContent = (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-[11px] font-medium rounded-full',
        'transition-all duration-150',
        pulse && 'animate-pulse',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );

  if (animate) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.95 }}
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
 * Componente KPI institucional — fondo blanco, borde sutil, acento lateral
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
    up: 'text-emerald-600',
    down: 'text-rose-600',
    stable: 'text-slate-400',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: 'easeOut',
        delay: delay * 0.06
      }}
      className="h-full"
    >
      <Card
        className={cn(
          'p-5 h-full',
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
        hover={true}
        animate={false}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
            {label}
          </p>
          <div className="p-2 rounded-lg bg-slate-50 text-slate-400">
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="text-2xl font-bold font-mono text-slate-900">
            {value}
          </p>
          {suffix && (
            <p className="text-sm text-slate-400 font-mono">
              {suffix}
            </p>
          )}
        </div>
        {trend && trendValue && (
          <motion.div
            className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trendColors[trend])}
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

export const SectionHeader = ({ title, subtitle, action, className }: SectionHeaderProps) => (
  <div className={cn('flex items-start justify-between mb-4', className)}>
    <div className="flex flex-col gap-0.5">
      <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-slate-500">
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

export const Divider = ({ className, orientation = 'horizontal' }: DividerProps) => (
  <div
    className={cn(
      orientation === 'horizontal'
        ? 'w-full h-px bg-slate-200'
        : 'w-px h-full bg-slate-200',
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

export const Skeleton = ({ className, variant = 'rectangular', shimmer = false }: SkeletonProps) => {
  const variants = {
    'text': 'h-4 w-full rounded',
    'text-sm': 'h-3 w-full rounded',
    'text-lg': 'h-5 w-3/4 rounded',
    'text-xl': 'h-6 w-2/3 rounded',
    'circular': 'rounded-full',
    'rectangular': 'rounded-lg',
  };

  return (
    <div className={cn('relative overflow-hidden animate-pulse bg-slate-200', variants[variant], className)}>
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
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
          }}
        />
      )}
    </div>
  );
};
