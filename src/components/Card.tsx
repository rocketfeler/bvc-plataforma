import { cn } from './utils';

/**
 * Componente Card genérico
 */
export const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-[#141414] border border-[#262626] rounded shadow-xl", className)}>
    {children}
  </div>
);
