import { cn } from './utils';

/**
 * Componente Card genérico
 */
export const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-[#0a0a0a] border border-[#262626] rounded shadow-xl", className)}>
    {children}
  </div>
);
