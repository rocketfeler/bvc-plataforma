'use client';

import React, { useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Activity,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardHeader, CardContent, CardFooter, Badge } from './ui';
import { Sparkline } from './Sparkline';
import { cn, formatValue, formatPercent, formatPercentSimple } from './utils';
import type { TasasData, BVCData, PatrimonioData, MacroRow } from '@/app/types';

// ============================================================================
// TIPOS
// ============================================================================

interface DashboardCardsProps {
  tasas: TasasData | null;
  bvc: BVCData[] | null;
  patrimonio: PatrimonioData | null;
  macro: MacroRow[] | null;
  previousBvc: BVCData[];
  tasaBinanceFallback?: number;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calcula la brecha de forma segura
 */
function calcBrecha(binance: number, bcv: number): number {
  if (bcv <= 0 || binance <= 0) return 0;
  return ((binance / bcv) - 1) * 100;
}

/**
 * Extrae historial de BCV para sparkline (últimos 15 días)
 */
function extractBcvHistory(macro: MacroRow[] | null): number[] {
  if (!Array.isArray(macro) || macro.length === 0) return [];
  return [...macro]
    .reverse()
    .slice(-15)
    .map(item => item?.tasa_bcv ?? 0)
    .filter(v => v > 0);
}

/**
 * Extrae historial de Binance para sparkline (últimos 15 días)
 */
function extractBinanceHistory(macro: MacroRow[] | null): number[] {
  if (!Array.isArray(macro) || macro.length === 0) return [];
  return [...macro]
    .reverse()
    .slice(-15)
    .map(item => item?.tasa_binance_p2p ?? 0)
    .filter(v => v > 0);
}

/**
 * Cuenta acciones subiendo y bajando
 */
function countMarketBreadth(bvc: BVCData[] | null): { up: number; down: number; unchanged: number } {
  if (!Array.isArray(bvc) || bvc.length === 0) {
    return { up: 0, down: 0, unchanged: 0 };
  }
  const up = bvc.filter(a => (a.variacion_pct ?? 0) > 0).length;
  const down = bvc.filter(a => (a.variacion_pct ?? 0) < 0).length;
  const unchanged = bvc.length - up - down;
  return { up, down, unchanged };
}

/**
 * Calcula el índice del día (promedio ponderado de variaciones)
 */
function calcDailyIndex(bvc: BVCData[] | null): number {
  if (!Array.isArray(bvc) || bvc.length === 0) return 0;
  const totalMonto = bvc.reduce((sum, a) => sum + (a.monto_efectivo ?? 0), 0);
  if (totalMonto <= 0) return 0;
  const weighted = bvc.reduce((sum, a) => {
    const weight = (a.monto_efectivo ?? 0) / totalMonto;
    return sum + (a.variacion_pct ?? 0) * weight;
  }, 0);
  return weighted;
}

/**
 * Top 3 acciones por volumen
 */
function getTopByVolume(bvc: BVCData[] | null): BVCData[] {
  if (!Array.isArray(bvc) || bvc.length === 0) return [];
  return [...bvc]
    .sort((a, b) => (b.monto_efectivo ?? 0) - (a.monto_efectivo ?? 0))
    .slice(0, 3);
}

/**
 * Top 3 ganadores y perdedores
 */
function getGainersLosers(bvc: BVCData[] | null): { gainers: BVCData[]; losers: BVCData[] } {
  if (!Array.isArray(bvc) || bvc.length === 0) {
    return { gainers: [], losers: [] };
  }
  const sorted = [...bvc].sort((a, b) => (b.variacion_pct ?? 0) - (a.variacion_pct ?? 0));
  const gainers = sorted.filter(a => (a.variacion_pct ?? 0) > 0).slice(0, 3);
  const losers = [...sorted].reverse().filter(a => (a.variacion_pct ?? 0) < 0).slice(0, 3);
  return { gainers, losers };
}

// ============================================================================
// CARD 1: TASAS DE CAMBIO
// ============================================================================

interface TasasCardProps {
  tasas: TasasData;
  macro: MacroRow[] | null;
  brechaBinance: number;
  brechaEuro: number;
}

function TasasCard({ tasas, macro, brechaBinance, brechaEuro }: TasasCardProps) {
  const bcvHistory = useMemo(() => extractBcvHistory(macro), [macro]);
  const binanceHistory = useMemo(() => extractBinanceHistory(macro), [macro]);

  const bcvTrend = bcvHistory.length >= 2
    ? bcvHistory[bcvHistory.length - 1] >= bcvHistory[0]
    : true;
  const binanceTrend = binanceHistory.length >= 2
    ? binanceHistory[binanceHistory.length - 1] >= binanceHistory[0]
    : true;

  const brechaValor = tasas.brecha_binance_pct !== undefined && tasas.brecha_binance_pct !== null
    ? tasas.brecha_binance_pct
    : brechaBinance;

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold tracking-wide">TASAS DE CAMBIO</h3>
        </div>
        <Badge variant="info">EN VIVO</Badge>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* BCV */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-500/10">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">BCV Oficial</p>
                  <p className="text-xl font-bold font-mono">{formatValue(tasas.bcv, 2)}</p>
                </div>
              </div>
              <Sparkline data={bcvHistory} width={64} height={28} positive={bcvTrend} />
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] font-mono">Bs/USD</p>
          </div>

          {/* Binance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-amber-500/10">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Binance P2P</p>
                  <p className="text-xl font-bold font-mono">
                    {tasas.binance !== null && tasas.binance !== undefined
                      ? formatValue(tasas.binance, 2)
                      : '—'}
                  </p>
                </div>
              </div>
              <Sparkline data={binanceHistory} width={64} height={28} positive={binanceTrend} />
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] font-mono">Bs/USDT</p>
          </div>
        </div>

        {/* Brechas */}
        <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Brecha Binance</p>
            <div className="flex items-center gap-2">
              <Badge variant={brechaValor >= 0 ? 'warning' : 'success'}>
                {brechaValor >= 0 ? '+' : ''}{formatValue(brechaValor, 2)}%
              </Badge>
              <span className="text-[10px] text-[var(--text-secondary)]">vs BCV</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Brecha Euro</p>
            <div className="flex items-center gap-2">
              <Badge variant={brechaEuro >= 0 ? 'info' : 'neutral'}>
                {brechaEuro >= 0 ? '+' : ''}{formatValue(brechaEuro, 2)}%
              </Badge>
              <span className="text-[10px] text-[var(--text-secondary)]">vs BCV</span>
            </div>
          </div>
        </div>
      </CardContent>
      {tasas.stale_binance || tasas.stale_data ? (
        <CardFooter className="px-4 py-2 border-t border-[var(--border)] bg-amber-500/5">
          <p className="text-[10px] text-amber-400">⚠ Datos Binance pueden estar desactualizados</p>
        </CardFooter>
      ) : null}
    </Card>
  );
}

// ============================================================================
// CARD 2: RESUMEN BVC
// ============================================================================

interface BVCResumenCardProps {
  bvc: BVCData[] | null;
  previousBvc: BVCData[];
}

function BVCResumenCard({ bvc, previousBvc }: BVCResumenCardProps) {
  const breadth = useMemo(() => countMarketBreadth(bvc), [bvc]);
  const dailyIndex = useMemo(() => calcDailyIndex(bvc), [bvc]);
  const topVolume = useMemo(() => getTopByVolume(bvc), [bvc]);
  const { gainers, losers } = useMemo(() => getGainersLosers(bvc), [bvc]);

  const totalAcciones = bvc?.length ?? 0;

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold tracking-wide">RESUMEN BVC</h3>
        </div>
        <Badge variant={totalAcciones > 0 ? 'success' : 'neutral'}>
          {totalAcciones} ACCIONES
        </Badge>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Índice del Día */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Índice del Día</p>
            <p className={cn(
              'text-2xl font-bold font-mono',
              dailyIndex >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {dailyIndex >= 0 ? '+' : ''}{formatValue(dailyIndex, 2)}%
            </p>
          </div>
          <div className={cn(
            'p-2 rounded-full',
            dailyIndex >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
          )}>
            {dailyIndex >= 0
              ? <ArrowUpRight className="w-5 h-5 text-emerald-400" />
              : <ArrowDownRight className="w-5 h-5 text-red-400" />
            }
          </div>
        </div>

        {/* Market Breadth */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-lg font-bold font-mono text-emerald-400">{breadth.up}</p>
            <p className="text-[10px] text-emerald-400/70 uppercase">Avanzan</p>
          </div>
          <div className="text-center p-2 rounded bg-[var(--surface)] border border-[var(--border)]">
            <p className="text-lg font-bold font-mono text-[var(--text-muted)]">{breadth.unchanged}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase">Estables</p>
          </div>
          <div className="text-center p-2 rounded bg-red-500/10 border border-red-500/20">
            <p className="text-lg font-bold font-mono text-red-400">{breadth.down}</p>
            <p className="text-[10px] text-red-400/70 uppercase">Retroceden</p>
          </div>
        </div>

        {/* Top Volumen */}
        {topVolume.length > 0 && (
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Mayor Volumen</p>
            <div className="space-y-1.5">
              {topVolume.map(accion => {
                const pct = accion.variacion_pct ?? 0;
                return (
                  <div key={accion.simbolo} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        pct >= 0 ? 'bg-emerald-400' : 'bg-red-400'
                      )} />
                      <span className="font-mono font-semibold">{accion.simbolo}</span>
                      <span className="text-[var(--text-muted)] text-[10px]">{accion.desc_simb}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono">{formatValue(accion.precio, 2)}</span>
                      <Badge variant={pct >= 0 ? 'success' : 'error'}>
                        {pct >= 0 ? '+' : ''}{formatPercentSimple(pct, 2)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ganadores y Perdedores */}
        {(gainers.length > 0 || losers.length > 0) && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
            {gainers.length > 0 && (
              <div>
                <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> Top Ganadores
                </p>
                <div className="space-y-1">
                  {gainers.map(a => (
                    <div key={a.simbolo} className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[var(--text-secondary)]">{a.simbolo}</span>
                      <span className="text-emerald-400">+{formatPercentSimple(a.variacion_pct, 2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {losers.length > 0 && (
              <div>
                <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" /> Top Perdedores
                </p>
                <div className="space-y-1">
                  {losers.map(a => (
                    <div key={a.simbolo} className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[var(--text-secondary)]">{a.simbolo}</span>
                      <span className="text-red-400">{formatPercent(a.variacion_pct, 2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CARD 3: PORTAFOLIO
// ============================================================================

interface PortfolioCardProps {
  patrimonio: PatrimonioData | null;
}

function PortfolioCard({ patrimonio }: PortfolioCardProps) {
  if (!patrimonio || patrimonio.total_ves === 0) {
    return (
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold tracking-wide">PORTAFOLIO</h3>
          </div>
          <Badge variant="neutral">SIN DATOS</Badge>
        </CardHeader>
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <Wallet className="w-12 h-12 text-[var(--text-muted)]/30 mb-3" />
          <p className="text-sm text-[var(--text-secondary)] mb-1">Sin posiciones activas</p>
          <p className="text-[11px] text-[var(--text-muted)]">
            Agrega acciones a tu portafolio para ver el resumen aquí
          </p>
        </CardContent>
      </Card>
    );
  }

  const roiPositive = (patrimonio.roi_pct ?? 0) >= 0;
  const gainPositive = (patrimonio.ganancia_perdida ?? 0) >= 0;
  const dailyVariation = patrimonio.resumen?.variacion_diaria ?? 0;
  const dailyPositive = dailyVariation >= 0;

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold tracking-wide">PORTAFOLIO</h3>
        </div>
        <Badge variant={roiPositive ? 'success' : 'error'}>
          ROI: {roiPositive ? '+' : ''}{formatPercent(patrimonio.roi_pct, 2)}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Valor Total */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Valor Total</p>
          <p className="text-3xl font-bold font-mono text-emerald-400">
            {patrimonio.total_ves.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">Bs. Soberanos</p>
          {patrimonio.total_usd && patrimonio.total_usd > 0 && (
            <p className="text-xs text-[var(--text-muted)] font-mono mt-1">
              ≈ ${patrimonio.total_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>

        {/* Ganancia/Pérdida Total */}
        <div className="grid grid-cols-2 gap-3">
          <div className={cn(
            'p-3 rounded-lg border',
            gainPositive
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-red-500/10 border-red-500/20'
          )}>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Ganancia/Pérdida</p>
            <p className={cn(
              'text-lg font-bold font-mono',
              gainPositive ? 'text-emerald-400' : 'text-red-400'
            )}>
              {gainPositive ? '+' : ''}{formatValue(patrimonio.ganancia_perdida, 2)}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">Bs</p>
          </div>
          <div className={cn(
            'p-3 rounded-lg border',
            dailyPositive
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-red-500/10 border-red-500/20'
          )}>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Variación Hoy</p>
            <p className={cn(
              'text-lg font-bold font-mono',
              dailyPositive ? 'text-emerald-400' : 'text-red-400'
            )}>
              {dailyPositive ? '+' : ''}{formatValue(dailyVariation, 2)}%
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">del día</p>
          </div>
        </div>

        {/* Resumen por posición */}
        {patrimonio.detalles && patrimonio.detalles.length > 0 && (
          <div className="pt-3 border-t border-[var(--border)]">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Posiciones ({patrimonio.detalles.length})
            </p>
            <div className="space-y-1.5">
              {patrimonio.detalles.slice(0, 5).map(det => {
                const isPositive = (det.gain_loss_pct ?? 0) >= 0;
                return (
                  <div key={det.ticker} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isPositive ? 'bg-emerald-400' : 'bg-red-400'
                      )} />
                      <span className="font-mono font-semibold">{det.ticker}</span>
                      {det.sector && (
                        <span className="text-[10px] text-[var(--text-muted)]">{det.sector}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[var(--text-secondary)]">
                        {formatValue(det.valor_ves, 2)}
                      </span>
                      <Badge variant={isPositive ? 'success' : 'error'}>
                        {isPositive ? '+' : ''}{formatPercentSimple(det.gain_loss_pct, 2)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {patrimonio.detalles.length > 5 && (
                <p className="text-[10px] text-[var(--text-muted)] text-center pt-1">
                  +{patrimonio.detalles.length - 5} más...
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CARD 4: MACROECONOMÍA
// ============================================================================

interface MacroCardProps {
  macro: MacroRow[] | null;
}

function MacroCard({ macro }: MacroCardProps) {
  const latestData = useMemo(() => {
    if (!Array.isArray(macro) || macro.length === 0) return null;
    const latest = [...macro].reverse()[0];
    return latest;
  }, [macro]);

  const recentHistory = useMemo(() => {
    if (!Array.isArray(macro) || macro.length === 0) return [];
    return [...macro]
      .reverse()
      .slice(0, 7)
      .map(item => ({
        fecha: item?.fecha ? String(item.fecha).substring(5) : '--/--',
        brecha: item?.brecha_cambiaria ?? 0,
      }));
  }, [macro]);

  if (!latestData) {
    return (
      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold tracking-wide">MACROECONOMÍA</h3>
          </div>
          <Badge variant="neutral">SIN DATOS</Badge>
        </CardHeader>
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <BarChart3 className="w-12 h-12 text-[var(--text-muted)]/30 mb-3" />
          <p className="text-sm text-[var(--text-secondary)] mb-1">Datos no disponibles</p>
          <p className="text-[11px] text-[var(--text-muted)]">
            Los datos macroeconómicos se actualizarán pronto
          </p>
        </CardContent>
      </Card>
    );
  }

  const brechaTrend = recentHistory.length >= 2
    ? recentHistory[0].brecha >= recentHistory[recentHistory.length - 1].brecha
    : true;

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold tracking-wide">MACROECONOMÍA</h3>
        </div>
        <Badge variant="info">{latestData.fecha?.substring(5) ?? 'Hoy'}</Badge>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Últimos valores */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">BCV</p>
            <p className="text-lg font-bold font-mono text-blue-400">
              {formatValue(latestData.tasa_bcv, 2)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Binance</p>
            <p className="text-lg font-bold font-mono text-amber-400">
              {formatValue(latestData.tasa_binance_p2p, 2)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Brecha</p>
            <p className={cn(
              'text-lg font-bold font-mono',
              latestData.brecha_cambiaria >= 0 ? 'text-amber-400' : 'text-red-400'
            )}>
              {latestData.brecha_cambiaria >= 0 ? '+' : ''}{formatValue(latestData.brecha_cambiaria, 2)}%
            </p>
          </div>
        </div>

        {/* Sparkline de Brecha */}
        {recentHistory.length > 1 && (
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Tendencia Brecha (7 días)
            </p>
            <div className="h-20 min-h-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={recentHistory}>
                  <defs>
                    <linearGradient id="macroBrechaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="fecha" tick={{ fill: '#525252', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141414',
                      border: '1px solid #262626',
                      borderRadius: '4px',
                      fontSize: '10px',
                      padding: '4px 8px',
                    }}
                    itemStyle={{ color: '#fbbf24' }}
                    formatter={(value: any) => [`${value}%`, 'Brecha']}
                  />
                  <Area
                    type="monotone"
                    dataKey="brecha"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    fill="url(#macroBrechaGradient)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Contexto adicional */}
        <div className="pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-3">
          <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)]">
            <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Registros Históricos</p>
            <p className="text-sm font-mono font-semibold">{Array.isArray(macro)?.length ?? 0} días</p>
          </div>
          <div className="p-2 rounded bg-[var(--surface)] border border-[var(--border)]">
            <p className="text-[10px] text-[var(--text-muted)] mb-0.5">Tendencia Brecha</p>
            <div className="flex items-center gap-1.5">
              <span className={cn(
                'text-sm font-mono font-semibold',
                brechaTrend ? 'text-emerald-400' : 'text-red-400'
              )}>
                {brechaTrend ? '↓ Bajando' : '↑ Subiendo'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL: DASHBOARD CARDS
// ============================================================================

/**
 * DashboardCards - Grid de 4 cards principales del dashboard
 *
 * Layout responsive:
 * - Mobile: 1 columna
 * - Tablet: 2 columnas
 * - Desktop: 4 columnas
 */
export function DashboardCards({
  tasas,
  bvc,
  patrimonio,
  macro,
  previousBvc,
  tasaBinanceFallback,
}: DashboardCardsProps) {
  if (!tasas) return null;

  // Calcular brechas de forma segura
  const brechaBinance = calcBrecha(tasas.binance ?? 0, tasas.bcv ?? 0);
  const brechaEuro = calcBrecha(tasas.bcv_eur ?? 0, tasas.bcv ?? 0);

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"
      role="region"
      aria-label="Panel principal del dashboard: tasas, mercado, portafolio y macroeconomía"
      aria-live="polite"
    >
      {/* Card 1: Tasas de Cambio */}
      <TasasCard
        tasas={tasas}
        macro={macro}
        brechaBinance={brechaBinance}
        brechaEuro={brechaEuro}
      />

      {/* Card 2: Resumen BVC */}
      <BVCResumenCard
        bvc={bvc}
        previousBvc={previousBvc}
      />

      {/* Card 3: Portafolio */}
      <PortfolioCard
        patrimonio={patrimonio}
      />

      {/* Card 4: Macroeconomía */}
      <MacroCard
        macro={macro}
      />
    </div>
  );
}

export default DashboardCards;
