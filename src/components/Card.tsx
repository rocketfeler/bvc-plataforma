import { cn } from './utils';

/**
 * Componente Card genérico (legacy - usar Card desde ui.tsx)
 * @deprecated Usar Card desde './ui' en su lugar
 */
export const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] transition-all duration-200 hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-lg)]", className)}>
    {children}
  </div>
);
