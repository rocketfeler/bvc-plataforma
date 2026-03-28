import { cn } from './utils';
import { Card } from './Card';

interface MetricCardProps {
  title: string;
  value: string | number;
  suffix: string;
  icon: React.ReactNode;
  variant: 'blue' | 'amber' | 'purple' | 'emerald' | 'red';
  subValue?: string;
}

const variants = {
  blue: { border: 'border-l-blue-500', icon: 'bg-blue-500/10 text-blue-400' },
  amber: { border: 'border-l-amber-500', icon: 'bg-amber-500/10 text-amber-400' },
  purple: { border: 'border-l-purple-500', icon: 'bg-purple-500/10 text-purple-400' },
  emerald: { border: 'border-l-emerald-500', icon: 'bg-emerald-500/10 text-emerald-400' },
  red: { border: 'border-l-red-500', icon: 'bg-red-500/10 text-red-400' },
} as const;

/**
 * Componente para mostrar métricas principales
 */
export function MetricCard({ title, value, suffix, icon, variant, subValue }: MetricCardProps) {
  const currentVariant = variants[variant];

  return (
    <Card className={cn("p-4 border-l-2", currentVariant.border)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{title}</p>
        <div className={cn("p-1.5 rounded", currentVariant.icon)}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-2xl font-bold font-mono">{value}</p>
        <p className="text-xs text-slate-500 font-mono">{suffix}</p>
      </div>
      {subValue && (
        <p className="text-[10px] text-slate-500 mt-2 font-mono">{subValue}</p>
      )}
    </Card>
  );
}
