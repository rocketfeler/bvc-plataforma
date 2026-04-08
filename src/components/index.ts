// Componentes UI base
export { Card, CardHeader, CardContent, CardFooter, Badge, StatCard, SectionHeader, Divider } from './ui';
export { Skeleton } from './ui';
export { MetricCard } from './MetricCard';
export { FlashPrice } from './FlashPrice';

// Skeletons avanzados (renombrados para evitar conflictos)
export {
  Skeleton as SkeletonAdv,
  SkeletonRow,
  SkeletonCard,
  SkeletonTable,
  Shimmer
} from './Skeleton';

// PriceFlash mejorado
export { PriceFlash, PriceChange, usePriceFlash } from './PriceFlash';

// Componentes de negocio
export { PriceTicker } from './PriceTicker';
export { BVCRow } from './BVCRow';
export { NewsTicker } from './NewsTicker';
export { Header } from './Header';
export { DashboardCards } from './DashboardCards';

// Tablas y gráficos
export { MarketTable } from './MarketTable';
export { Sparkline } from './Sparkline';
export { MarketKPIs } from './MarketKPIs';
export { MarketRankings } from './MarketRankings';

// Error Boundary
export { ErrorBoundary } from './ErrorBoundary';

// Libro de órdenes y estadísticas
export { OrderBook } from './OrderBook';
export { StockStats } from './StockStats';

// Vista detallada de acciones
export { default as StockDetailView } from './StockDetailView';

// Utilidades
export { cn, CONFIG, CHART_COLORS, formatValue, formatInt, formatPercent, formatPercentSimple, formatSimple } from './utils';
