import React from 'react';
import { cn } from './utils';
import { Card } from './ui';
import { motion } from 'framer-motion';
import { PriceFlash } from './PriceFlash';

interface MetricCardProps {
  title: string;
  value: string | number;
  suffix: string;
  icon: React.ReactNode;
  variant: 'blue' | 'amber' | 'purple' | 'emerald' | 'red';
  subValue?: string;
  previousValue?: number;
  delay?: number;
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
 * OPTIMIZADO: Envuelto en React.memo para evitar re-renderizados innecesarios
 * 
 * Micro-interacciones:
 * - Hover: elevación con sombra aumentada
 * - Entrada: animación con delay escalonado
 * - Flash de precios cuando el valor cambia (opcional)
 */
export const MetricCard = React.memo(function MetricCard({ 
  title, 
  value, 
  suffix, 
  icon, 
  variant, 
  subValue,
  previousValue,
  delay = 0
}: MetricCardProps) {
  const currentVariant = variants[variant];

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
        y: -4,
        transition: { duration: 0.2 }
      }}
    >
      <Card 
        className={cn(
          "p-4 border-l-2 transition-all duration-200",
          "hover:shadow-lg hover:border-[var(--border-hover)]",
          currentVariant.border
        )}
        hover={false}
        animate={false}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{title}</p>
          <motion.div 
            className={cn("p-1.5 rounded", currentVariant.icon)}
            whileHover={{ scale: 1.15, rotate: 8 }}
            transition={{ duration: 0.2 }}
          >
            {icon}
          </motion.div>
        </div>
        <div className="flex items-baseline gap-1">
          {/* Usar PriceFlash si hay previousValue, sino mostrar valor estático */}
          {previousValue !== undefined ? (
            <PriceFlash 
              value={typeof value === 'number' ? value : parseFloat(String(value))} 
              previous={previousValue}
              decimals={suffix.includes('%') ? 2 : 2}
              size="lg"
            />
          ) : (
            <motion.p 
              className="text-2xl font-bold font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 + delay * 0.06 }}
            >
              {value}
            </motion.p>
          )}
          <p className="text-xs text-slate-500 font-mono">{suffix}</p>
        </div>
        {subValue && (
          <motion.p 
            className="text-[10px] text-slate-500 mt-2 font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 + delay * 0.06 }}
          >
            {subValue}
          </motion.p>
        )}
      </Card>
    </motion.div>
  );
});
