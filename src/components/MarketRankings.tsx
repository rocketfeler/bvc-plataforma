'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { BVCData } from '@/app/types';
import { cn, formatValue } from './utils';

// ============================================================================
// TYPES
// ============================================================================

interface MarketRankingsProps {
  bvc: BVCData[];
}

interface RankingItem {
  simbolo: string;
  desc_simb: string;
  precio: number | null;
  precio_vta?: number | null;
  precio_compra?: number | null;
  variacion_pct: number | null;
  volumen: number | null;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatVolume(vol: number | null): string {
  if (vol == null || vol === 0) return '-';
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(0)}K`;
  return vol.toLocaleString('es-VE');
}

function getRankingColor(rank: number): string {
  switch (rank) {
    case 0: return 'bg-emerald-400 text-emerald-950';
    case 1: return 'bg-emerald-400/80 text-emerald-900';
    case 2: return 'bg-emerald-400/60 text-emerald-900';
    case 3: return 'bg-emerald-400/40 text-emerald-300';
    case 4: return 'bg-emerald-400/25 text-emerald-400';
    default: return 'bg-slate-600 text-slate-300';
  }
}

function getRedRankingColor(rank: number): string {
  switch (rank) {
    case 0: return 'bg-red-400 text-red-950';
    case 1: return 'bg-red-400/80 text-red-900';
    case 2: return 'bg-red-400/60 text-red-900';
    case 3: return 'bg-red-400/40 text-red-300';
    case 4: return 'bg-red-400/25 text-red-400';
    default: return 'bg-slate-600 text-slate-300';
  }
}

function getBlueRankingColor(rank: number): string {
  switch (rank) {
    case 0: return 'bg-blue-400 text-blue-950';
    case 1: return 'bg-blue-400/80 text-blue-900';
    case 2: return 'bg-blue-400/60 text-blue-900';
    case 3: return 'bg-blue-400/40 text-blue-300';
    case 4: return 'bg-blue-400/25 text-blue-400';
    default: return 'bg-slate-600 text-slate-300';
  }
}

// ============================================================================
// COMPONENTE DE FILA DE RANKING
// ============================================================================

function RankingRow({
  item,
  rank,
  badgeColor,
  priceColor,
  showVolume = false,
}: {
  item: RankingItem;
  rank: number;
  badgeColor: string;
  priceColor: string;
  showVolume?: boolean;
}) {
  const simboloCorto = item.simbolo.substring(0, 3).toUpperCase();
  const precioActual = item.precio ?? item.precio_vta ?? item.precio_compra ?? 0;
  const pct = item.variacion_pct ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="flex items-center gap-2.5 py-2 px-2 rounded-[var(--radius-sm)] hover:bg-white/5 transition-colors"
    >
      {/* Número de ranking */}
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
        badgeColor
      )}>
        {rank + 1}
      </div>

      {/* Info del activo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold px-1 py-0.5 rounded-[var(--radius-sm)] bg-slate-700/50 text-slate-300 font-mono">
            {simboloCorto}
          </span>
          <span className="text-xs font-semibold text-white truncate">
            {item.simbolo}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 truncate" title={item.desc_simb}>
          {item.desc_simb}
        </p>
      </div>

      {/* Precio */}
      <div className="text-right flex-shrink-0">
        <span className={cn("text-sm font-bold font-mono block", priceColor)}>
          {formatValue(precioActual, 2)}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">Bs.</span>
      </div>

      {/* % Cambio o Volumen */}
      {showVolume ? (
        <div className="text-right flex-shrink-0 w-14">
          <span className="text-xs font-mono text-blue-400 block">
            {formatVolume(item.volumen)}
          </span>
          <span className="text-[10px] text-slate-500">vol</span>
        </div>
      ) : (
        <div className="text-right flex-shrink-0 w-16">
          <span className={cn(
            "text-xs font-bold font-mono block",
            pct >= 0 ? 'text-emerald-400' : 'text-red-400'
          )}>
            {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function MarketRankings({ bvc }: MarketRankingsProps) {
  // Filtrar solo los que tienen variación y volumen válidos
  const validos = bvc.filter((a) => a.variacion_pct != null && a.volumen != null);

  // Ganadores: variación positiva, orden descendente
  const ganadores = validos
    .filter((a) => (a.variacion_pct ?? 0) > 0)
    .sort((a, b) => (b.variacion_pct ?? 0) - (a.variacion_pct ?? 0))
    .slice(0, 5);

  // Perdedores: variación negativa, orden ascendente
  const perdedores = validos
    .filter((a) => (a.variacion_pct ?? 0) < 0)
    .sort((a, b) => (a.variacion_pct ?? 0) - (b.variacion_pct ?? 0))
    .slice(0, 5);

  // Mayor volumen: orden descendente por volumen
  const mayorVolumen = [...validos]
    .sort((a, b) => (b.volumen ?? 0) - (a.volumen ?? 0))
    .slice(0, 5);

  // Si no hay datos, no renderizar
  if (ganadores.length === 0 && perdedores.length === 0 && mayorVolumen.length === 0) {
    return null;
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-3"
      role="region"
      aria-label="Rankings del mercado: ganadores, perdedores y mayor volumen"
      aria-live="polite"
    >
      {/* GANADORES */}
      <div className="bg-[#0a0a0a] border border-emerald-500/20 rounded-[var(--radius-lg)] overflow-hidden" role="group" aria-label="Top 5 acciones ganadoras">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-emerald-500/20 bg-emerald-500/5">
          <div className="p-1.5 bg-emerald-500/20 rounded-[var(--radius-sm)]" aria-hidden="true">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Ganadores
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              {ganadores.length} activos
            </p>
          </div>
        </div>
        <div className="p-1.5 space-y-0.5">
          {ganadores.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">Sin datos</p>
          ) : (
            ganadores.map((item, idx) => (
              <RankingRow
                key={item.simbolo}
                item={item}
                rank={idx}
                badgeColor={getRankingColor(idx)}
                priceColor="text-emerald-400"
              />
            ))
          )}
        </div>
      </div>

      {/* PERDEDORES */}
      <div className="bg-[#0a0a0a] border border-red-500/20 rounded-[var(--radius-lg)] overflow-hidden" role="group" aria-label="Top 5 acciones perdedoras">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-red-500/20 bg-red-500/5">
          <div className="p-1.5 bg-red-500/20 rounded-[var(--radius-sm)]" aria-hidden="true">
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">
              Perdedores
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              {perdedores.length} activos
            </p>
          </div>
        </div>
        <div className="p-1.5 space-y-0.5">
          {perdedores.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">Sin datos</p>
          ) : (
            perdedores.map((item, idx) => (
              <RankingRow
                key={item.simbolo}
                item={item}
                rank={idx}
                badgeColor={getRedRankingColor(idx)}
                priceColor="text-red-400"
              />
            ))
          )}
        </div>
      </div>

      {/* MAYOR VOLUMEN */}
      <div className="bg-[#0a0a0a] border border-blue-500/20 rounded-[var(--radius-lg)] overflow-hidden" role="group" aria-label="Top 5 acciones por volumen">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-blue-500/20 bg-blue-500/5">
          <div className="p-1.5 bg-blue-500/20 rounded-[var(--radius-sm)]" aria-hidden="true">
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Mayor Volumen
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              Top 5 por acciones
            </p>
          </div>
        </div>
        <div className="p-1.5 space-y-0.5">
          {mayorVolumen.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">Sin datos</p>
          ) : (
            mayorVolumen.map((item, idx) => (
              <RankingRow
                key={item.simbolo}
                item={item}
                rank={idx}
                badgeColor={getBlueRankingColor(idx)}
                priceColor="text-blue-400"
                showVolume
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
