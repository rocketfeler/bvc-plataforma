/**
 * StockDetailView - Vista detallada de acción individual con gráfico de velas
 *
 * Muestra:
 * - Header con símbolo, nombre completo y precio actual
 * - Botones Comprar/Vender (deshabilitados con tooltip "Próximamente")
 * - Toggle de tipo de gráfico: Velas / Línea / Área
 * - Selector de período: 1S, 1M, 3M, 6M, 1A
 * - Gráfico de velas profesional con volumen debajo
 * - Datos del libro de órdenes actual
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ComposedChart,
  Line,
  Area,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Loader2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Info, ShoppingCart, ShoppingBag } from 'lucide-react';
import { cn, formatValue, formatInt } from './utils';
import { HistoricalCandleData, ChartType, TimePeriod, LibroOrdenesData } from '../app/types';

// ============================================================================
// TYPES INTERNOS
// ============================================================================

interface StockDetailViewProps {
  simbolo: string;
  nombre: string;
  precioActual: number | null;
  variacionPct: number | null;
  volumen: number | null;
  precioMax: number | null;
  precioMin: number | null;
  precioApert: number | null;
  montoEfectivo: number | null;
  libroOrdenes?: LibroOrdenesData | null;
  apiUrl: string;
  onClose: () => void;
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

/** Tooltip personalizado para el gráfico de velas */
function CandleTooltip({ active, payload }: any) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const isUp = data.close >= data.open;

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xl min-w-[200px]">
        <p className="text-xs text-slate-400 mb-2">{data.fecha}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-slate-400">Apertura:</span>
          <span className="text-right font-mono">{formatValue(data.open, 2)}</span>
          <span className="text-slate-400">Máximo:</span>
          <span className="text-right font-mono text-emerald-600">{formatValue(data.high, 2)}</span>
          <span className="text-slate-400">Mínimo:</span>
          <span className="text-right font-mono text-rose-600">{formatValue(data.low, 2)}</span>
          <span className="text-slate-400">Cierre:</span>
          <span className={cn("text-right font-mono", isUp ? 'text-emerald-600' : 'text-rose-600')}>
            {formatValue(data.close, 2)}
          </span>
          <span className="text-slate-400">Volumen:</span>
          <span className="text-right font-mono">{formatInt(data.volume)}</span>
        </div>
      </div>
    );
  }
  return null;
}

/** Tooltip para gráfico de línea/área */
function LineTooltip({ active, payload }: any) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xl min-w-[150px]">
        <p className="text-xs text-slate-400 mb-1">{data.fecha}</p>
        <p className="text-sm font-mono font-bold text-slate-900">
          {formatValue(data.close, 2)} Bs
        </p>
        {data.volume > 0 && (
          <p className="text-xs text-slate-500 mt-1">Vol: {formatInt(data.volume)}</p>
        )}
      </div>
    );
  }
  return null;
}

/** Tooltip para gráfico de volumen */
function VolumeTooltip({ active, payload }: any) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-xl">
        <p className="text-xs text-slate-400">{data.fecha}</p>
        <p className="text-sm font-mono font-bold text-slate-900">Vol: {formatInt(data.volume)}</p>
      </div>
    );
  }
  return null;
}

/** Vela personalizada usando formas de Recharts */
function CustomCandlestick(props: any) {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;

  const { open, close, high, low } = payload;
  const isUp = close >= open;

  // Calcular posiciones Y basadas en la escala del gráfico
  const yScale = props.yAxis.scale;
  if (!yScale) return null;

  const yHigh = yScale(high);
  const yLow = yScale(low);
  const yOpen = yScale(open);
  const yClose = yScale(close);

  const candleTop = Math.min(yOpen, yClose);
  const candleBottom = Math.max(yOpen, yClose);
  const candleHeight = Math.max(candleBottom - candleTop, 1);

  const color = isUp ? '#10b981' : '#ef4444'; // emerald-500 / red-500
  const wickColor = color;

  const centerX = x + width / 2;
  const candleWidth = Math.max(width * 0.7, 2);

  return (
    <g>
      {/* Mecha superior */}
      <line
        x1={centerX}
        y1={yHigh}
        x2={centerX}
        y2={candleTop}
        stroke={wickColor}
        strokeWidth={1.5}
      />
      {/* Mecha inferior */}
      <line
        x1={centerX}
        y1={candleBottom}
        x2={centerX}
        y2={yLow}
        stroke={wickColor}
        strokeWidth={1.5}
      />
      {/* Cuerpo de la vela */}
      <rect
        x={centerX - candleWidth / 2}
        y={candleTop}
        width={candleWidth}
        height={candleHeight}
        fill={color}
        stroke={color}
        strokeWidth={1}
        rx={1}
      />
    </g>
  );
}

/** Botón de tooltip "Próximamente" */
function ComingSoonButton({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        disabled
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all cursor-not-allowed opacity-50",
          color === 'green'
            ? 'bg-emerald-500 text-slate-900'
            : 'bg-red-500 text-slate-900'
        )}
      >
        <Icon size={16} />
        {label}
      </button>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-xl whitespace-nowrap z-50"
          >
            <p className="text-xs text-slate-700 font-medium">Próximamente</p>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-l border-t border-slate-200 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function StockDetailView({
  simbolo,
  nombre,
  precioActual,
  variacionPct,
  volumen,
  precioMax,
  precioMin,
  precioApert,
  montoEfectivo,
  libroOrdenes,
  apiUrl,
  onClose,
}: StockDetailViewProps) {
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [period, setPeriod] = useState<TimePeriod>('3M');
  const [historicalData, setHistoricalData] = useState<HistoricalCandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // FETCH DATOS HISTÓRICOS
  // ============================================================================

  const fetchHistoricalData = useCallback(async (sym: string, p: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/bvc/${sym}/historico?periodo=${p}`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        setHistoricalData(data);
      } else {
        setHistoricalData([]);
        setError('Sin datos históricos disponibles para este período');
      }
    } catch (err) {
      console.error(`Error fetching historical data for ${sym}:`, err);
      setHistoricalData([]);
      setError('No se pudieron cargar los datos históricos');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchHistoricalData(simbolo, period);
  }, [simbolo, period, fetchHistoricalData]);

  // ============================================================================
  // DATOS DERIVADOS
  // ============================================================================

  const isPositive = (variacionPct ?? 0) >= 0;

  // Estadísticas del período
  const periodStats = useMemo(() => {
    if (historicalData.length === 0) return null;

    const allHighs = historicalData.map(d => d.high);
    const allLows = historicalData.map(d => d.low);
    const allVolumes = historicalData.map(d => d.volume);
    const firstOpen = historicalData[0].open;
    const lastClose = historicalData[historicalData.length - 1].close;

    const periodChange = ((lastClose - firstOpen) / firstOpen) * 100;
    const avgVolume = allVolumes.reduce((a, b) => a + b, 0) / allVolumes.length;

    return {
      high: Math.max(...allHighs),
      low: Math.min(...allLows),
      totalVolume: allVolumes.reduce((a, b) => a + b, 0),
      avgVolume,
      periodChange: periodChange.toFixed(2),
      isPeriodPositive: periodChange >= 0,
    };
  }, [historicalData]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col h-full">
      {/* =================================================================== */}
      {/* HEADER */}
      {/* =================================================================== */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{simbolo}</h2>
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-semibold",
                variacionPct !== null
                  ? (isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')
                  : 'bg-slate-500/20 text-slate-400'
              )}>
                {variacionPct !== null ? `${isPositive ? '+' : ''}${formatValue(variacionPct, 2)}%` : '-'}
              </span>
            </div>
            <p className="text-sm text-slate-400 truncate">{nombre}</p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-slate-900 font-mono">
                {precioActual ? formatValue(precioActual, 2) : '---'} Bs
              </span>
              {isPositive ? (
                <TrendingUp size={20} className="text-emerald-600" />
              ) : (
                <TrendingDown size={20} className="text-rose-600" />
              )}
            </div>
          </div>

          {/* Botones Comprar/Vender */}
          <div className="flex gap-2 shrink-0">
            <ComingSoonButton icon={ShoppingCart} label="Comprar" color="green" />
            <ComingSoonButton icon={ShoppingBag} label="Vender" color="red" />
          </div>
        </div>

        {/* Info rápida */}
        <div className="mt-3 grid grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Apertura</span>
            <span className="font-mono text-slate-700">{precioApert ? formatValue(precioApert, 2) : '---'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Máximo</span>
            <span className="font-mono text-emerald-600">{precioMax ? formatValue(precioMax, 2) : '---'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Mínimo</span>
            <span className="font-mono text-rose-600">{precioMin ? formatValue(precioMin, 2) : '---'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Volumen</span>
            <span className="font-mono text-slate-700">{volumen ? formatInt(volumen) : '---'}</span>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* CONTROLES: Tipo de gráfico + Período */}
      {/* =================================================================== */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center gap-4">
        {/* Toggle tipo de gráfico */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {([
            { id: 'candles' as ChartType, label: 'Velas', icon: '🕯️' },
            { id: 'line' as ChartType, label: 'Línea', icon: '📈' },
            { id: 'area' as ChartType, label: 'Área', icon: '📊' },
          ]).map((type) => (
            <button
              key={type.id}
              onClick={() => setChartType(type.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                chartType === type.id
                  ? 'bg-slate-200 text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-[#1f1f1f]'
              )}
            >
              <span>{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>

        {/* Selector de período */}
        <div className="flex items-center gap-1">
          {(['1S', '1M', '3M', '6M', '1A'] as TimePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                period === p
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-[#1f1f1f]'
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Indicador de carga */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 ml-auto">
            <Loader2 size={14} className="animate-spin" />
            Cargando datos...
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* GRÁFICO PRINCIPAL */}
      {/* =================================================================== */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Área del gráfico de precios */}
        <div className="flex-1 min-h-[300px] relative">
          {error && historicalData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Info size={32} className="mx-auto text-slate-600 mb-2" />
                <p className="text-sm text-slate-500">{error}</p>
                <p className="text-xs text-slate-600 mt-1">Intenta con otro período o verifica que haya datos históricos</p>
              </div>
            </div>
          ) : historicalData.length === 0 && loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={32} className="text-slate-600 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'candles' ? (
                <ComposedChart
                  data={historicalData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1a1a1a"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('es-VE', { month: 'short', day: 'numeric' });
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(value) => value.toFixed(2)}
                    width={70}
                    orientation="right"
                  />
                  <RechartsTooltip content={<CandleTooltip />} />
                  {/* Línea de referencia al precio actual */}
                  {precioActual && (
                    <ReferenceLine
                      y={precioActual}
                      stroke={isPositive ? '#10b981' : '#ef4444'}
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      label={{
                        value: `${precioActual.toFixed(2)} Bs`,
                        position: 'right',
                        fill: isPositive ? '#10b981' : '#ef4444',
                        fontSize: 10,
                        fontFamily: 'monospace',
                      }}
                    />
                  )}
                  {/* Velas personalizadas */}
                  <Bar
                    dataKey="high"
                    shape={<CustomCandlestick />}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              ) : chartType === 'line' ? (
                <ComposedChart
                  data={historicalData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1a1a1a"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('es-VE', { month: 'short', day: 'numeric' });
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(value) => value.toFixed(2)}
                    width={70}
                    orientation="right"
                  />
                  <RechartsTooltip content={<LineTooltip />} />
                  {precioActual && (
                    <ReferenceLine
                      y={precioActual}
                      stroke={isPositive ? '#10b981' : '#ef4444'}
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      label={{
                        value: `${precioActual.toFixed(2)} Bs`,
                        position: 'right',
                        fill: isPositive ? '#10b981' : '#ef4444',
                        fontSize: 10,
                        fontFamily: 'monospace',
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke={isPositive ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              ) : (
                <ComposedChart
                  data={historicalData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1a1a1a"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('es-VE', { month: 'short', day: 'numeric' });
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                    tickLine={{ stroke: '#e2e8f0' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(value) => value.toFixed(2)}
                    width={70}
                    orientation="right"
                  />
                  <RechartsTooltip content={<LineTooltip />} />
                  {precioActual && (
                    <ReferenceLine
                      y={precioActual}
                      stroke={isPositive ? '#10b981' : '#ef4444'}
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      label={{
                        value: `${precioActual.toFixed(2)} Bs`,
                        position: 'right',
                        fill: isPositive ? '#10b981' : '#ef4444',
                        fontSize: 10,
                        fontFamily: 'monospace',
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={isPositive ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    fill={isPositive ? '#10b981' : '#ef4444'}
                    fillOpacity={0.15}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* =================================================================== */}
        {/* GRÁFICO DE VOLUMEN */}
        {/* =================================================================== */}
        <div className="h-[120px] border-t border-slate-200 relative">
          {historicalData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={historicalData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1a1a1a"
                  vertical={false}
                />
                <XAxis
                  dataKey="fecha"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('es-VE', { month: 'short', day: 'numeric' });
                  }}
                  interval="preserveStartEnd"
                  height={30}
                />
                <YAxis
                  hide
                />
                <RechartsTooltip content={<VolumeTooltip />} />
                <Bar
                  dataKey="volume"
                  isAnimationActive={false}
                  radius={[2, 2, 0, 0]}
                >
                  {historicalData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.close >= entry.open ? '#10b98130' : '#ef444430'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-xs text-slate-600">Sin datos de volumen</span>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* ESTADÍSTICAS DEL PERÍODO + LIBRO DE ÓRDENES */}
      {/* =================================================================== */}
      <div className="border-t border-slate-200 bg-white p-4">
        {periodStats && (
          <div className="grid grid-cols-4 gap-3 mb-4 text-xs">
            <div>
              <span className="text-slate-500 block">Máx. período</span>
              <span className="font-mono text-emerald-600 font-semibold">{formatValue(periodStats.high, 2)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Mín. período</span>
              <span className="font-mono text-rose-600 font-semibold">{formatValue(periodStats.low, 2)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Var. período</span>
              <span className={cn(
                "font-mono font-semibold",
                periodStats.isPeriodPositive ? 'text-emerald-600' : 'text-rose-600'
              )}>
                {periodStats.isPeriodPositive ? '+' : ''}{periodStats.periodChange}%
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Vol. promedio</span>
              <span className="font-mono text-slate-700">{formatInt(periodStats.avgVolume)}</span>
            </div>
          </div>
        )}

        {/* Resumen del libro de órdenes */}
        {libroOrdenes && !libroOrdenes.error && (libroOrdenes.compras.length > 0 || libroOrdenes.ventas.length > 0) && (
          <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <Info size={12} />
              LIBRO DE ÓRDENES (resumen)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Mejor compra */}
              <div className="flex items-center gap-2">
                <ArrowUpRight size={14} className="text-emerald-600" />
                <div>
                  <span className="text-[10px] text-slate-500 block">Mejor compra</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {libroOrdenes.mejor_bid?.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '---'} Bs
                  </span>
                </div>
              </div>
              {/* Mejor venta */}
              <div className="flex items-center gap-2 justify-end">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Mejor venta</span>
                  <span className="font-mono font-bold text-rose-600">
                    {libroOrdenes.mejor_ask?.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '---'} Bs
                  </span>
                </div>
                <ArrowDownRight size={14} className="text-rose-600" />
              </div>
            </div>
            {libroOrdenes.spread !== undefined && libroOrdenes.spread !== null && (
              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-center gap-4 text-xs">
                <span className="text-slate-500">Spread: <span className="font-mono text-slate-900">{formatValue(libroOrdenes.spread, 2)} Bs</span></span>
                <span className="text-slate-500">Spread %: <span className={cn(
                  "font-mono font-semibold",
                  (libroOrdenes.spread_pct ?? 0) < 5 ? 'text-emerald-600' : 'text-amber-600'
                )}>{formatValue(libroOrdenes.spread_pct, 2)}%</span></span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
