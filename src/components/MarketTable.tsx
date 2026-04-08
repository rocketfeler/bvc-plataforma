'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Search, Star, ArrowUpDown, ArrowUp, ArrowDown, BarChart3 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { BVCData } from '@/app/types';
import { cn, formatValue, formatInt, CONFIG } from './utils';
import { Sparkline } from './Sparkline';

// ============================================================================
// TIPOS
// ============================================================================

type SortKey = keyof BVCData | 'spread' | 'spread_pct';
type SortDirection = 'asc' | 'desc';
type MarketFilter = 'todos' | 'renta-variable' | 'renta-fija';

interface MarketTableProps {
  bvc: BVCData[];
  previousBvc: BVCData[];
  tasas: any;
  marketStatus: any;
  onRowClick?: (simbolo: string) => void;
  onFetchLibroOrdenes?: (simbolo: string) => void;
  className?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function MarketTable({
  bvc,
  previousBvc,
  tasas,
  marketStatus,
  onRowClick,
  onFetchLibroOrdenes,
  className,
}: MarketTableProps) {
  // Estado de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado de filtros
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('todos');
  
  // Estado de ordenamiento
  const [sortKey, setSortKey] = useState<SortKey>('simbolo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Estado de favoritos
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bvc_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error('[MarketTable] Error loading favorites:', err);
      return [];
    }
  });
  
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Guardar favoritos en localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('bvc_favorites', JSON.stringify(favoriteSymbols));
    } catch (err) {
      console.error('[MarketTable] Error saving favorites:', err);
    }
  }, [favoriteSymbols]);

  // Toggle favorito
  const toggleFavorite = useCallback((simbolo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteSymbols((prev) => {
      if (prev.includes(simbolo)) {
        return prev.filter((s) => s !== simbolo);
      } else {
        return [...prev, simbolo];
      }
    });
  }, []);

  // Manejar click en header para ordenar
  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  }, [sortKey]);

  // Calcular spread
  const calculateSpread = useCallback((accion: BVCData) => {
    const compra = accion.precio_compra ?? 0;
    const venta = accion.precio_vta ?? 0;
    if (venta > 0 && compra > 0) {
      return ((venta - compra) / compra) * 100;
    }
    return null;
  }, []);

  // Generar datos para sparkline (simulado basado en variación)
  const generateSparklineData = useCallback((accion: BVCData) => {
    const precio = accion.precio ?? accion.precio_vta ?? accion.precio_compra ?? 0;
    const variacion = accion.variacion_abs ?? 0;
    
    if (precio === 0) return [];
    
    // Generar datos simulados basados en la variación
    const points = 10;
    const data = [];
    const step = variacion / points;
    
    for (let i = 0; i < points; i++) {
      data.push(precio - variacion + (step * i));
    }
    data.push(precio);
    
    return data;
  }, []);

  // Filtrar y ordenar datos
  const filteredData = useMemo(() => {
    let filtered = [...bvc];

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.simbolo.toLowerCase().includes(term) ||
          (item.desc_simb && item.desc_simb.toLowerCase().includes(term))
      );
    }

    // Filtrar por tipo de mercado
    if (marketFilter === 'renta-variable') {
      // Filrar acciones (ejemplo: filtrar por palabras clave en descripción)
      filtered = filtered.filter(
        (item) =>
          !item.desc_simb?.toLowerCase().includes('bono') &&
          !item.desc_simb?.toLowerCase().includes('obligación')
      );
    } else if (marketFilter === 'renta-fija') {
      filtered = filtered.filter(
        (item) =>
          item.desc_simb?.toLowerCase().includes('bono') ||
          item.desc_simb?.toLowerCase().includes('obligación')
      );
    }

    // Filtrar por favoritos
    if (showOnlyFavorites) {
      filtered = filtered.filter((item) => favoriteSymbols.includes(item.simbolo));
    }

    // Ordenar
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case 'simbolo':
          comparison = a.simbolo.localeCompare(b.simbolo);
          break;
        case 'desc_simb':
          comparison = (a.desc_simb || '').localeCompare(b.desc_simb || '');
          break;
        case 'precio':
          comparison = (a.precio ?? 0) - (b.precio ?? 0);
          break;
        case 'variacion_pct':
          comparison = (a.variacion_pct ?? 0) - (b.variacion_pct ?? 0);
          break;
        case 'volumen':
          comparison = (a.volumen ?? 0) - (b.volumen ?? 0);
          break;
        case 'precio_compra':
          comparison = (a.precio_compra ?? 0) - (b.precio_compra ?? 0);
          break;
        case 'precio_vta':
          comparison = (a.precio_vta ?? 0) - (b.precio_vta ?? 0);
          break;
        case 'spread':
          const spreadA = calculateSpread(a) ?? 0;
          const spreadB = calculateSpread(b) ?? 0;
          comparison = spreadA - spreadB;
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [bvc, searchTerm, marketFilter, showOnlyFavorites, favoriteSymbols, sortKey, sortDirection, calculateSpread]);

  // Tasa BCV para conversión
  const tasaBCV = ((tasas?.bcv ?? 0) > 0) ? tasas.bcv : CONFIG.FALLBACK_TASA_BCV;

  // Color del spread
  const getSpreadColor = (spread: number | null) => {
    if (spread === null) return 'text-slate-500';
    if (spread < 10) return 'text-emerald-400';
    if (spread < 25) return 'text-amber-400';
    return 'text-red-400';
  };

  // Renderizar header de columna ordenable
  const renderSortableHeader = (label: string, sortKeyVal: SortKey, extraClass?: string) => (
    <button
      onClick={() => handleSort(sortKeyVal)}
      className={cn(
        'flex items-center gap-1 group hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a] rounded px-1 py-0.5 -mx-1',
        extraClass
      )}
      aria-label={`Ordenar por ${label} ${sortKey === sortKeyVal ? (sortDirection === 'asc' ? '(ascendente)' : '(descendente)') : ''}`}
      aria-sort={sortKey === sortKeyVal ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      {sortKey === sortKeyVal ? (
        sortDirection === 'asc' ? (
          <ArrowUp className="w-3 h-3 text-emerald-400" aria-hidden="true" />
        ) : (
          <ArrowDown className="w-3 h-3 text-red-400" aria-hidden="true" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
      )}
    </button>
  );

  return (
    <div className={cn('space-y-3 sm:space-y-4', className)}>
      {/* Controles: Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Barra de búsqueda */}
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            id="market-search"
            placeholder="Buscar por símbolo o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            aria-label="Buscar instrumentos por símbolo o nombre"
          />
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filtros de la tabla de mercado">
          {/* Botón de favoritos */}
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]',
              showOnlyFavorites
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-[#0a0a0a] border-[#262626] text-slate-500 hover:text-amber-400 hover:border-amber-500/30'
            )}
            aria-label={showOnlyFavorites ? 'Mostrar todos los instrumentos' : 'Mostrar solo favoritos'}
            aria-pressed={showOnlyFavorites}
          >
            <Star className={cn('w-3.5 h-3.5', showOnlyFavorites ? 'fill-amber-400' : '')} aria-hidden="true" />
            {favoriteSymbols.length > 0 && (
              <span className="font-mono" aria-label={`${favoriteSymbols.length} favoritos guardados`}>{favoriteSymbols.length}</span>
            )}
          </button>

          {/* Filtros de mercado */}
          <div className="flex gap-1 bg-[#0a0a0a] border border-[#262626] rounded p-0.5" role="radiogroup" aria-label="Filtrar por tipo de mercado">
            {(['todos', 'renta-variable', 'renta-fija'] as MarketFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setMarketFilter(filter)}
                className={cn(
                  'px-3 py-1.5 rounded text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]',
                  marketFilter === filter
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-500 hover:text-slate-300'
                )}
                role="radio"
                aria-checked={marketFilter === filter}
                aria-label={`Mostrar ${filter === 'todos' ? 'todos los instrumentos' : filter === 'renta-variable' ? 'solo renta variable' : 'solo renta fija'}`}
              >
                {filter === 'todos' ? 'Todos' : filter === 'renta-variable' ? 'Renta Variable' : 'Renta Fija'}
              </button>
            ))}
          </div>

          {/* Contador de resultados */}
          <div className="text-xs font-mono text-slate-500" aria-live="polite" aria-atomic="true">
            {filteredData.length} de {bvc.length}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="border border-[#262626] rounded-lg overflow-hidden bg-[#0a0a0a]" role="region" aria-label="Tabla de cotizaciones del mercado" tabIndex={0}>
        <div className="overflow-x-auto" role="region" aria-label="Desplazamiento horizontal de la tabla">
          <table className="w-full min-w-[1200px]" aria-label="Cotizaciones de acciones de la Bolsa de Valores de Caracas">
            {/* Caption descriptivo para lectores de pantalla */}
            <caption className="sr-only">
              Tabla de cotizaciones de la Bolsa de Valores de Caracas con precios, variaciones, volúmenes y spreads de compra/venta
            </caption>
            {/* Header */}
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-[#262626] bg-[#0a0a0a]">
                <th className="text-left py-3 px-3 font-medium w-[40px]" scope="col">
                  <span className="sr-only">Marcar como favorito</span>
                  <Star className="w-3.5 h-3.5" aria-hidden="true" />
                </th>
                <th className="text-left py-3 px-3 font-medium" scope="col">
                  {renderSortableHeader('Instrumento', 'simbolo')}
                </th>
                <th className="text-right py-3 px-3 font-medium" scope="col">
                  {renderSortableHeader('Precio (Bs)', 'precio')}
                </th>
                <th className="text-right py-3 px-3 font-medium" scope="col">
                  Precio (USD)
                </th>
                <th className="text-right py-3 px-3 font-medium" scope="col">
                  {renderSortableHeader('Var %', 'variacion_pct')}
                </th>
                <th className="text-right py-3 px-3 font-medium" scope="col">
                  {renderSortableHeader('Volumen', 'volumen')}
                </th>
                <th className="text-right py-3 px-3 font-medium" scope="col">
                  {renderSortableHeader('Bid', 'precio_compra')}
                </th>
                <th className="text-right py-3 px-3 font-medium" scope="col">
                  {renderSortableHeader('Ask', 'precio_vta')}
                </th>
                <th className="text-right py-3 px-3 font-medium" scope="col">
                  {renderSortableHeader('Spread', 'spread')}
                </th>
                <th className="text-center py-3 px-3 font-medium" scope="col">
                  Tendencia
                </th>
                <th className="text-center py-3 px-3 font-medium w-[100px]" scope="col">
                  <span className="sr-only">Libro de órdenes</span>
                  Libro
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 opacity-50" aria-hidden="true" />
                        <p>No se encontraron instrumentos</p>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="text-emerald-400 text-sm hover:underline focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                          >
                            Limpiar búsqueda
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((accion) => {
                    const simbolo = accion.simbolo || 'S/N';
                    const descSimb = accion.desc_simb || 'Sin descripción';
                    const simboloCorto = simbolo.substring(0, 3).toUpperCase();
                    const precio = accion.precio ?? accion.precio_vta ?? accion.precio_compra ?? 0;
                    const precioUSD = (tasaBCV > 0 && precio > 0) ? precio / tasaBCV : null;
                    const isPositive = (accion.variacion_pct ?? 0) >= 0;
                    const spread = calculateSpread(accion);
                    const sparklineData = generateSparklineData(accion);
                    const isFavorite = favoriteSymbols.includes(simbolo);

                    return (
                      <motion.tr
                        key={simbolo}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        layout
                        whileHover={{ 
                          backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                          transition: { duration: 0.15 }
                        }}
                        onClick={() => onRowClick?.(simbolo)}
                        className={cn(
                          'border-b border-[#1a1a1a] transition-all duration-150 cursor-pointer relative',
                          'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0 before:bg-transparent before:transition-all before:duration-150',
                          'hover:before:w-0.5',
                          isPositive 
                            ? 'hover:bg-emerald-500/3 before:bg-transparent hover:before:bg-emerald-400' 
                            : 'hover:bg-red-500/3 before:bg-transparent hover:before:bg-red-400'
                        )}
                        aria-label={`${simbolo}: ${descSimb}`}
                      >
                        {/* Favorito */}
                        <td className="py-3 px-3">
                          <motion.button
                            onClick={(e) => toggleFavorite(simbolo, e)}
                            className={cn(
                              'p-1.5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]',
                              isFavorite
                                ? 'text-amber-400 hover:text-amber-300'
                                : 'text-slate-600 hover:text-amber-400'
                            )}
                            whileHover={{ scale: 1.2, rotate: 15 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            aria-label={isFavorite ? `Quitar ${simbolo} de favoritos` : `Agregar ${simbolo} a favoritos`}
                            aria-pressed={isFavorite}
                          >
                            <Star className={cn('w-4 h-4', isFavorite ? 'fill-amber-400' : '')} aria-hidden="true" />
                          </motion.button>
                        </td>

                        {/* Instrumento */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <motion.div 
                              className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border flex-shrink-0',
                                isPositive
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                  : 'bg-red-500/10 border-red-500/30 text-red-400'
                              )}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ duration: 0.2 }}
                            >
                              {simboloCorto}
                            </motion.div>
                            <div className="min-w-0">
                              <span className="font-semibold text-sm text-white block">{simbolo}</span>
                              <span className="text-[10px] text-slate-500 truncate block max-w-[200px]" title={descSimb}>
                                {descSimb}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Precio (Bs) */}
                        <td className="py-3 px-3 text-right">
                          <span className="text-white font-bold font-mono text-sm">
                            {formatValue(precio, 2)}
                          </span>
                        </td>

                        {/* Precio ($) */}
                        <td className="py-3 px-3 text-right">
                          <span className="text-slate-400 font-mono text-sm">
                            {precioUSD !== null ? formatValue(precioUSD, 2) : '-'}
                          </span>
                        </td>

                        {/* Var % */}
                        <td className="py-3 px-3 text-right">
                          <span className={cn(
                            'inline-flex items-center gap-1 font-bold text-sm',
                            isPositive ? 'text-emerald-400' : 'text-red-400'
                          )}>
                            {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {formatValue(accion.variacion_pct, 2)}%
                          </span>
                        </td>

                        {/* Volumen */}
                        <td className="py-3 px-3 text-right">
                          <span className="text-slate-400 font-mono text-sm">
                            {formatInt(accion.volumen)}
                          </span>
                        </td>

                        {/* Bid (Compra) */}
                        <td className="py-3 px-3 text-right">
                          <span className="text-emerald-400 font-mono text-sm">
                            {formatValue(accion.precio_compra, 2)}
                          </span>
                        </td>

                        {/* Ask (Venta) */}
                        <td className="py-3 px-3 text-right">
                          <span className="text-red-400 font-mono text-sm">
                            {formatValue(accion.precio_vta, 2)}
                          </span>
                        </td>

                        {/* Spread */}
                        <td className="py-3 px-3 text-right">
                          <span className={cn(
                            'font-mono text-sm font-bold',
                            getSpreadColor(spread)
                          )}>
                            {spread !== null && spread > 0 ? formatValue(spread, 2) + '%' : '-'}
                          </span>
                        </td>

                        {/* Sparkline */}
                        <td className="py-3 px-3">
                          <Sparkline
                            data={sparklineData}
                            width={80}
                            height={32}
                            positive={isPositive}
                          />
                        </td>

                        {/* Libro de Órdenes */}
                        <td className="py-3 px-3 text-center">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              onFetchLibroOrdenes?.(simbolo);
                            }}
                            whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="px-3 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded transition-colors flex items-center gap-1.5 mx-auto focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]"
                            aria-label={`Ver libro de órdenes de ${simbolo}`}
                          >
                            <BarChart3 className="w-3 h-3" aria-hidden="true" />
                            Libro
                          </motion.button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
