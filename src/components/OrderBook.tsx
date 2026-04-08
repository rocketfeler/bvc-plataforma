'use client';

import React, { useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn, formatValue, formatInt, formatPercentSimple } from '@/components/utils';
import type { LibroOrdenesData } from '@/app/types';

// ============================================================================
// INTERFACES
// ============================================================================

interface OrderBookProps {
  data: LibroOrdenesData;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

interface OrderRowProps {
  precio: number;
  cantidad: number;
  maxCantidad: number;
  type: 'bid' | 'ask';
  index: number;
}

// ============================================================================
// COMPONENTE: FILA DE ORDEN CON BARRA DE PROFUNDIDAD
// ============================================================================

function OrderRow({ precio, cantidad, maxCantidad, type, index }: OrderRowProps) {
  const volumenRatio = maxCantidad > 0 ? cantidad / maxCantidad : 0;
  const barWidth = Math.min(100, Math.max(8, volumenRatio * 100));

  const isBid = type === 'bid';

  return (
    <div
      className={cn(
        "relative flex items-center justify-between px-3 py-2.5 text-sm group",
        "border-b border-[#1a1a1a] hover:bg-[#1a1a1a]/50 transition-colors"
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Barra de profundidad - fondo semi-transparente */}
      <div
        className={cn(
          "absolute inset-y-0 transition-all duration-300 ease-out opacity-40",
          isBid
            ? "left-0 bg-emerald-500/30 rounded-r"
            : "right-0 bg-red-500/30 rounded-l"
        )}
        style={{ width: `${barWidth}%` }}
      />

      {/* Contenido - por encima de la barra */}
      <div className="relative z-10 flex items-center justify-between w-full gap-3">
        {/* Precio */}
        <span
          className={cn(
            "font-mono font-bold text-base whitespace-nowrap",
            isBid ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          {precio.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>

        {/* Volumen */}
        <span className="font-mono text-slate-300 text-sm">
          {cantidad.toLocaleString('es-VE')}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: ENCABEZADO DE COLUMNA
// ============================================================================

function ColumnHeader({
  title,
  mejorPrecio,
  tipo,
}: {
  title: string;
  mejorPrecio?: number | null;
  tipo: 'bid' | 'ask';
}) {
  const isBid = tipo === 'bid';

  return (
    <div
      className={cn(
        "px-4 py-3 border-b",
        isBid
          ? "bg-emerald-500/10 border-emerald-500/20"
          : "bg-red-500/10 border-red-500/20"
      )}
    >
      <div className="flex items-center justify-between">
        <h4
          className={cn(
            "font-bold text-sm flex items-center gap-2",
            isBid ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          {isBid ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          {title}
        </h4>

        {mejorPrecio && (
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block leading-tight">
              Mejor {isBid ? 'Compra' : 'Venta'}
            </span>
            <span
              className={cn(
                "text-base font-bold font-mono",
                isBid ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {mejorPrecio.toLocaleString('es-VE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              Bs
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE: BARRA DE SPREAD
// ============================================================================

function SpreadBar({
  spread,
  spreadPct,
  mejorBid,
  mejorAsk,
}: {
  spread: number;
  spreadPct: number | null;
  mejorBid?: number | null;
  mejorAsk?: number | null;
}) {
  const spreadBajo = (spreadPct ?? 0) < 2;
  const spreadMedio = (spreadPct ?? 0) >= 2 && (spreadPct ?? 0) < 5;

  return (
    <div className="mt-4 p-4 bg-[#0a0a0a] border border-[#262626] rounded-lg">
      {/* Métricas principales */}
      <div className="flex items-center justify-center gap-6 mb-3">
        <div className="text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
            Spread
          </span>
          <span className="text-xl font-bold text-white font-mono">
            {spread.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            Bs
          </span>
        </div>

        <div className="w-px h-10 bg-[#262626]" />

        <div className="text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
            Spread %
          </span>
          <span
            className={cn(
              "text-xl font-bold font-mono",
              spreadBajo
                ? 'text-emerald-400'
                : spreadMedio
                ? 'text-amber-400'
                : 'text-red-400'
            )}
          >
            {formatPercentSimple(spreadPct, 2)}
          </span>
        </div>

        <div className="w-px h-10 bg-[#262626]" />

        <div className="text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
            Liquidez
          </span>
          <span
            className={cn(
              "text-sm font-semibold",
              spreadBajo ? 'text-emerald-400' : 'text-amber-400'
            )}
          >
            {spreadBajo ? 'ALTA' : spreadMedio ? 'MEDIA' : 'BAJA'}
          </span>
        </div>
      </div>

      {/* Visual del spread */}
      {mejorBid && mejorAsk && (
        <div className="mt-3 flex items-center gap-2 text-xs font-mono">
          <span className="text-emerald-400">
            {mejorBid.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </span>
          <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden relative">
            {/* Línea central */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-[#262626]" />
            {/* Indicador de spread */}
            <div className="absolute inset-y-0 left-1/3 right-1/3 bg-amber-500/40 rounded-full" />
          </div>
          <span className="text-red-400">
            {mejorAsk.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL: ORDER BOOK
// ============================================================================

export function OrderBook({ data, loading, error, className }: OrderBookProps) {
  // Calcular el máximo volumen entre compras y ventas para las barras
  const maxVolumen = useMemo(() => {
    const maxCompra = Math.max(0, ...data.compras.map((o) => o.cantidad));
    const maxVenta = Math.max(0, ...data.ventas.map((o) => o.cantidad));
    return Math.max(maxCompra, maxVenta, 1);
  }, [data.compras, data.ventas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Cargando libro de órdenes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Grid de dos columnas: COMPRAS | VENTAS */}
      <div className="grid grid-cols-2 gap-3">
        {/* COMPRAS (Bids) */}
        <div className="bg-[#0a0a0a] border border-emerald-500/20 rounded-lg overflow-hidden">
          <ColumnHeader
            title="COMPRAS"
            mejorPrecio={data.mejor_bid}
            tipo="bid"
          />

          <div className="max-h-[400px] overflow-y-auto">
            {data.compras.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
                Sin órdenes de compra
              </div>
            ) : (
              data.compras.map((orden, idx) => (
                <OrderRow
                  key={idx}
                  precio={orden.precio}
                  cantidad={orden.cantidad}
                  maxCantidad={maxVolumen}
                  type="bid"
                  index={idx}
                />
              ))
            )}
          </div>
        </div>

        {/* VENTAS (Asks) */}
        <div className="bg-[#0a0a0a] border border-red-500/20 rounded-lg overflow-hidden">
          <ColumnHeader
            title="VENTAS"
            mejorPrecio={data.mejor_ask}
            tipo="ask"
          />

          <div className="max-h-[400px] overflow-y-auto">
            {data.ventas.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
                Sin órdenes de venta
              </div>
            ) : (
              data.ventas.map((orden, idx) => (
                <OrderRow
                  key={idx}
                  precio={orden.precio}
                  cantidad={orden.cantidad}
                  maxCantidad={maxVolumen}
                  type="ask"
                  index={idx}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Spread */}
      {data.spread !== undefined && data.spread !== null && (
        <SpreadBar
          spread={data.spread}
          spreadPct={data.spread_pct ?? null}
          mejorBid={data.mejor_bid}
          mejorAsk={data.mejor_ask}
        />
      )}
    </div>
  );
}

export default OrderBook;
