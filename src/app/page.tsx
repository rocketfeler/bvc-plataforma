'use client';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, DollarSign, Loader2, AlertCircle, RefreshCw, Calculator,
  PieChart, Activity, Wallet, Layers, Zap, Globe, Shield, Cpu,
  BarChart3, ArrowUpRight, ArrowDownRight, LogOut, Star, Download,
  ArrowLeftRight, Coins, TrendingDown, Plus, X, History, Edit2, Trash2,
  ChevronDown, Check, Info
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

// Tipos
import { TasasData, BVCData, PatrimonioData, MacroRow, LibroOrdenesData } from './types';

// Componentes
import {
  PriceTicker, BVCRow, Card, FlashPrice, NewsTicker,
  CONFIG, CHART_COLORS, cn, formatValue, formatInt, formatPercent, formatPercentSimple, Header,
  MarketKPIs, MarketRankings, OrderBook, StockStats, MarketTable, StockDetailView,
  DashboardCards, Skeleton
} from '@/components';
import { Sidebar, type ActiveTab } from '@/components/Sidebar';

// Socket.IO Hook
import { useSocket } from './useSocket';
import { useAuth } from './AuthContext';
import { useFetchWithRetry } from './useFetchWithRetry';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function BloombergTerminal() {
  const { user, loading: authLoading, getAuthHeaders, logout } = useAuth();
  const { fetchWithRetry } = useFetchWithRetry({ maxRetries: 3, retryDelay: 1000 });
  const router = useRouter();

  // ============================================================================
  // ESTADOS - TODOS LOS HOOKS useState DEBEN ESTAR PRIMERO
  // ============================================================================
  const [tasas, setTasas] = useState<TasasData | null>(null);
  const [bvc, setBvc] = useState<BVCData[]>([]);
  const [patrimonio, setPatrimonio] = useState<PatrimonioData | null>(null);
  const [macro, setMacro] = useState<MacroRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [previousBvc, setPreviousBvc] = useState<BVCData[]>([]);
  const [mounted, setMounted] = useState(false);
  const [noticias, setNoticias] = useState<{titular: string; contenido: string; fecha: string}[]>([]);
  const [marketStatus, setMarketStatus] = useState<{ estado: string } | null>(null);

  // Libro de órdenes
  const [libroOrdenes, setLibroOrdenes] = useState<LibroOrdenesData | null>(null);
  const [libroOrdenesLoading, setLibroOrdenesLoading] = useState(false);
  const [libroOrdenesSimbolo, setLibroOrdenesSimbolo] = useState<string | null>(null);

  // Estado para la vista detallada de acción
  const [showStockDetail, setShowStockDetail] = useState(false);
  const [detailStockData, setDetailStockData] = useState<BVCData | null>(null);

  // ============================================================================
  // FUNCIONES - Antes de cualquier useEffect
  // ============================================================================

  const fetchLibroOrdenes = useCallback(async (simbolo: string) => {
    setLibroOrdenesLoading(true);
    setLibroOrdenesSimbolo(simbolo);

    try {
      // NOTA: desde_cache=false para obtener datos en tiempo real de la BVC
      const response = await fetch(`${CONFIG.API_URL}/api/bvc/${simbolo}/libro-ordenes?desde_cache=false`);
      const data = await response.json();
      setLibroOrdenes(data);
    } catch (err) {
      console.error(`Error al obtener libro de órdenes para ${simbolo}:`, err);
      setLibroOrdenes({
        simbolo,
        compras: [],
        ventas: [],
        error: 'No se pudo cargar el libro de órdenes'
      });
    } finally {
      setLibroOrdenesLoading(false);
    }
  }, []);

  const cerrarLibroOrdenes = () => {
    setLibroOrdenes(null);
    setLibroOrdenesSimbolo(null);
  };

  const abrirStockDetail = (stock: BVCData) => {
    setDetailStockData(stock);
    setShowStockDetail(true);
  };

  const cerrarStockDetail = () => {
    setShowStockDetail(false);
    setDetailStockData(null);
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Efecto de montaje para gráficos
  useEffect(() => {
    setMounted(true);
  }, []);

  // ============================================================================
  // OFFLINE-FIRST: Cargar desde localStorage inmediatamente
  // ============================================================================
   useEffect(() => {
    try {
      // Cargar tasas desde localStorage
      const cachedTasas = localStorage.getItem('bvc_tasas');
      if (cachedTasas) {
        const parsed = JSON.parse(cachedTasas);
        if (parsed?.bcv > 0) {
          setTasas(parsed);
          setLoading(false);
          console.log('[Offline-First] Tasas cargadas desde localStorage');
        }
      }

      // Cargar BVC desde localStorage
      const cachedBvc = localStorage.getItem('bvc_data');
      if (cachedBvc) {
        const parsed = JSON.parse(cachedBvc);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBvc(parsed);
          setLoading(false);
          console.log('[Offline-First] BVC cargado desde localStorage:', parsed.length, 'símbolos');
        }
      }

      // Cargar estado del mercado
      const cachedMarket = localStorage.getItem('bvc_market_status');
      if (cachedMarket) {
        setMarketStatus(JSON.parse(cachedMarket));
      }

      // Cargar patrimonio desde localStorage
      const cachedPatrimonio = localStorage.getItem('bvc_patrimonio');
      if (cachedPatrimonio) {
        const parsed = JSON.parse(cachedPatrimonio);
        if (parsed?.detalles) {
          setPatrimonio(parsed);
          console.log('[Offline-First] Patrimonio cargado desde localStorage');
        }
      }

      // Cargar macro desde localStorage
      const cachedMacro = localStorage.getItem('bvc_macro');
      if (cachedMacro) {
        const parsed = JSON.parse(cachedMacro);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMacro(parsed);
          console.log('[Offline-First] Macro cargado desde localStorage:', parsed.length, 'registros');
        }
      }

      // Cargar noticias desde localStorage
      const cachedNoticias = localStorage.getItem('bvc_noticias');
      if (cachedNoticias) {
        const parsed = JSON.parse(cachedNoticias);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNoticias(parsed);
          console.log('[Offline-First] Noticias cargadas desde localStorage');
        }
      }
    } catch (err) {
      console.error('[Offline-First] Error cargando caché:', err);
    }

    // Safety timeout: si después de 30s sigue loading, lo removemos
    const safetyTimer = setTimeout(() => setLoading(false), 30000);
    return () => clearTimeout(safetyTimer);
  }, []);

  // Socket.IO - Reemplaza el polling HTTP
  const { connected: socketConnected, error: socketError } = useSocket({
    apiUrl: CONFIG.API_URL,
    onTasasUpdate: (data) => {
      setTasas(data);
      setLastUpdate(new Date());
      // Guardar en localStorage para Offline-First
      try {
        localStorage.setItem('bvc_tasas', JSON.stringify(data));
      } catch (err) {
        console.warn('[localStorage] Error guardando tasas:', err);
      }
    },
    onBvcUpdate: (data) => {
      setPreviousBvc(bvc);
      setBvc(data);
      setLastUpdate(new Date());
      // Guardar en localStorage para Offline-First
      try {
        localStorage.setItem('bvc_data', JSON.stringify(data));
      } catch (err) {
        console.warn('[localStorage] Error guardando BVC:', err);
      }
    },
    onMarketStatusUpdate: (data) => {
      setMarketStatus(data);
      try {
        localStorage.setItem('bvc_market_status', JSON.stringify(data));
      } catch (err) {
        console.warn('[localStorage] Error guardando market status:', err);
      }
    },
    onNoticiasUpdate: (data) => {
      setNoticias(data);
      try {
        localStorage.setItem('bvc_noticias', JSON.stringify(data));
      } catch (err) {
        console.warn('[localStorage] Error guardando noticias:', err);
      }
    },
  });

  // Calculadora
  const [calcMonto, setCalcMonto] = useState<number>(100);
  const [calcOrigen, setCalcOrigen] = useState<string>("USD");
  const [calcDestino, setCalcDestino] = useState<string>("VES");
  const [calcResultado, setCalcResultado] = useState<number | null>(null);
  const [calcTasa, setCalcTasa] = useState<string>("");

  // Tasa Binance fallback
  const tasaBinanceFallback = patrimonio?.tasa_binance_usada || CONFIG.FALLBACK_TASA_BINANCE;

  // ============================================================================
  // FETCH INICIAL + REVALIDACIÓN (Stale-While-Revalidate)
  // ============================================================================
  useEffect(() => {
    if (!user) return;

    const fetchInitialData = async () => {
      const headers = getAuthHeaders();
      try {
        // Usar fetchWithRetry para todas las peticiones
        const [tasasRes, bvcRes, patrimonioRes, macroRes, noticiasRes] = await Promise.all([
          fetchWithRetry(`${CONFIG.API_URL}/api/tasas`),
          fetchWithRetry(`${CONFIG.API_URL}/api/bvc`),
          fetchWithRetry(`${CONFIG.API_URL}/api/patrimonio`, { headers }),
          fetchWithRetry(`${CONFIG.API_URL}/api/macro`),
          fetchWithRetry(`${CONFIG.API_URL}/api/noticias`),
        ]);

        // Actualizar solo si hay datos válidos
        if (tasasRes && typeof tasasRes.bcv === 'number' && tasasRes.bcv > 0) {
          setTasas(tasasRes);
          try { localStorage.setItem('bvc_tasas', JSON.stringify(tasasRes)); } catch {}
          console.log('[Fetch Inicial] Tasas actualizadas desde API');
        }

        if (bvcRes && Array.isArray(bvcRes) && bvcRes.length > 0) {
          setBvc(bvcRes);
          try { localStorage.setItem('bvc_data', JSON.stringify(bvcRes)); } catch {}
          console.log('[Fetch Inicial] BVC actualizado desde API:', bvcRes.length, 'símbolos');
        }

        if (patrimonioRes && patrimonioRes.detalles) {
          setPatrimonio(patrimonioRes);
          try { localStorage.setItem('bvc_patrimonio', JSON.stringify(patrimonioRes)); } catch {}
          console.log('[Fetch Inicial] Patrimonio actualizado desde API');
        }

        if (macroRes && Array.isArray(macroRes) && macroRes.length > 0) {
          setMacro(macroRes);
          try { localStorage.setItem('bvc_macro', JSON.stringify(macroRes)); } catch {}
          console.log('[Fetch Inicial] Macro actualizado desde API:', macroRes.length, 'registros');
        }

        if (noticiasRes && Array.isArray(noticiasRes) && noticiasRes.length > 0) {
          const validNoticias = noticiasRes.filter((n: any) =>
            n && typeof n.titular === 'string' && n.titular.trim() !== ''
          );
          if (validNoticias.length > 0) {
            setNoticias(validNoticias);
            try { localStorage.setItem('bvc_noticias', JSON.stringify(validNoticias)); } catch {}
            console.log('[Fetch Inicial] Noticias actualizadas desde API:', validNoticias.length);
          }
        }

        setError(null);
        setLastUpdate(new Date());
      } catch (err: any) {
        console.error('[Fetch Inicial] Error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    // Remover loading inmediatamente si ya hay datos en caché
    if ((tasas?.bcv ?? 0) > 0 || bvc.length > 0) {
      setLoading(false);
    }

    fetchInitialData();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calcular conversión con debounce para evitar llamadas excesivas
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        const data = await fetchWithRetry(`${CONFIG.API_URL}/api/calculadora?monto=${calcMonto}&origen=${calcOrigen}&destino=${calcDestino}`);
        if (data?.monto_destino) {
          setCalcResultado(data.monto_destino);
          setCalcTasa(data.tasa_usada);
        } else {
          setCalcResultado(null);
          setCalcTasa("Error en cálculo");
        }
      } catch {
        setCalcResultado(null);
        setCalcTasa("Error en cálculo");
      }
    }, 300); // 300ms de debounce

    return () => clearTimeout(timeoutId);
  }, [calcMonto, calcOrigen, calcDestino, fetchWithRetry]);

  // ============================================================================
  // HANDLERS - DEBEN ESTAR ANTES DE CUALQUIER RETURN CONDICIONAL
  // ============================================================================

  const handleRefresh = useCallback(async () => {
    const headers = getAuthHeaders();
    try {
      const [tasasRes, bvcRes, patrimonioRes] = await Promise.all([
        fetchWithRetry(`${CONFIG.API_URL}/api/tasas`),
        fetchWithRetry(`${CONFIG.API_URL}/api/bvc`),
        fetchWithRetry(`${CONFIG.API_URL}/api/patrimonio`, { headers }),
      ]);
      if (tasasRes?.bcv) setTasas(tasasRes);
      if (bvcRes?.length) setBvc(bvcRes);
      if (patrimonioRes?.detalles) setPatrimonio(patrimonioRes);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('[Refresh] Error:', err);
    }
  }, [getAuthHeaders, fetchWithRetry]);

  // ============================================================================
  // EARLY RETURNS - DESPUÉS DE TODOS LOS HOOKS
  // ============================================================================

  // Redirigiendo o cargando auth
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
      </div>
    );
  }

  // ============================================================================
  // LOADING STATE - Solo si no hay datos en caché
  // ============================================================================
  if (loading && !tasas?.bcv && bvc.length === 0) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-emerald-400 mx-auto" />
            <div className="absolute inset-0 bg-emerald-400/20 blur-xl rounded-full" />
          </div>
          <p className="text-slate-400 mt-6 font-mono text-sm">INICIALIZANDO TERMINAL BVC</p>
          <p className="text-slate-600 text-xs mt-2">Conectando a mercados...</p>
        </motion.div>
      </div>
    );
  }

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_90%)] pointer-events-none" />

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Header */}
      <Header
        user={user}
        activeTab={activeTab}
        marketStatus={marketStatus}
        socketConnected={socketConnected}
        lastUpdate={lastUpdate}
        loading={loading}
        onRefresh={handleRefresh}
        onLogout={logout}
      />

      {/* News Ticker */}
      <NewsTicker noticias={noticias} />

      {/* Price Ticker */}
      <PriceTicker tasas={tasas} bvc={bvc} />

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="ml-0 lg:ml-60 px-4 lg:px-6 mt-3"
          >
            <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-2 flex items-center gap-2">
              <AlertCircle className="text-red-400 w-4 h-4 flex-shrink-0" />
              <p className="text-red-300 text-sm font-mono">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main id="main-content" className="ml-0 lg:ml-60 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 relative z-10" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {activeTab === 'dashboard' && (
              <DashboardView
                tasas={tasas}
                bvc={bvc}
                patrimonio={patrimonio}
                macro={macro}
                previousBvc={previousBvc}
                tasaBinanceFallback={tasaBinanceFallback}
                mounted={mounted}
                loading={loading}
              />
            )}

            {activeTab === 'calculadora' && (
              <CalculadoraView tasas={tasas} bvc={bvc} loading={loading} />
            )}

            {activeTab === 'pizarra' && (
              <PizarraView
                bvc={bvc}
                previousBvc={previousBvc}
                tasaBinanceFallback={tasaBinanceFallback}
                marketStatus={marketStatus}
                tasas={tasas}
                fetchLibroOrdenes={fetchLibroOrdenes}
                loading={loading}
              />
            )}

            {activeTab === 'portafolio' && (
              <PortafolioView
                patrimonio={patrimonio}
                mounted={mounted}
                onRefresh={async () => {
                  const headers = getAuthHeaders();
                  const data = await fetchWithRetry(`${CONFIG.API_URL}/api/patrimonio`, { headers });
                  if (data?.detalles) setPatrimonio(data);
                }}
                fetchWithRetry={fetchWithRetry}
                getAuthHeaders={getAuthHeaders}
                apiUrl={CONFIG.API_URL}
                loading={loading}
              />
            )}

            {activeTab === 'mercado' && (
              <MercadoResumenView
                bvc={bvc}
                previousBvc={previousBvc}
                tasas={tasas}
                mounted={mounted}
                loading={loading}
              />
            )}

            {activeTab === 'alertas' && (
              <AlertasView tasas={tasas} loading={loading} />
            )}

            {activeTab === 'exportar' && (
              <ExportarView apiUrl={CONFIG.API_URL} getAuthHeaders={getAuthHeaders} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* MODAL LIBRO DE ÓRDENES + ESTADÍSTICAS */}
      <AnimatePresence>
        {libroOrdenes && libroOrdenesSimbolo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={cerrarLibroOrdenes}
            role="dialog"
            aria-modal="true"
            aria-label={`Libro de órdenes y estadísticas de ${libroOrdenesSimbolo}`}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0a0a0a] border border-[#262626] rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              role="document"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#262626] bg-[#0a0a0a]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-2 bg-red-500/20 border border-red-500/30 rounded">
                    <span className="text-xl" aria-hidden="true">📊</span>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-lg font-bold text-white">{libroOrdenesSimbolo}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
                      {libroOrdenes.fuente === 'cache' ? '● Datos en caché' : libroOrdenes.fuente === 'directo' || libroOrdenes.fuente === 'directo-bvc' ? '● Datos en tiempo real' : '● Datos disponibles'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={cerrarLibroOrdenes}
                  className="p-2 hover:bg-[#262626] rounded transition-colors group focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]"
                  aria-label="Cerrar modal"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-red-400 transition-colors" aria-hidden="true">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
              </div>

              {/* Tabs: Libro de Órdenes | Estadísticas */}
              <ModalContent
                libroOrdenes={libroOrdenes}
                libroOrdenesLoading={libroOrdenesLoading}
                libroOrdenesSimbolo={libroOrdenesSimbolo}
                bvc={bvc}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL VISTA DETALLADA DE ACCIÓN */}
      <AnimatePresence>
        {showStockDetail && detailStockData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={cerrarStockDetail}
            role="dialog"
            aria-modal="true"
            aria-label={`Vista detallada de ${detailStockData.simbolo}`}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#0a0a0a] border border-[#262626] rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="document"
            >
              {/* Header con botón de cerrar */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#262626] bg-[#0a0a0a]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-500/20 border border-red-500/30 rounded" aria-hidden="true">
                    <span className="text-base">📈</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">VISTA DETALLADA</h3>
                </div>
                <button
                  onClick={cerrarStockDetail}
                  className="p-2 hover:bg-[#262626] rounded transition-colors group focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]"
                  aria-label="Cerrar vista detallada"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-red-400 transition-colors" aria-hidden="true">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
              </div>

              {/* Contenido - StockDetailView */}
              <div className="h-[calc(90vh-60px)] overflow-hidden">
                <StockDetailView
                  simbolo={detailStockData.simbolo}
                  nombre={detailStockData.desc_simb}
                  precioActual={detailStockData.precio}
                  variacionPct={detailStockData.variacion_pct}
                  volumen={detailStockData.volumen}
                  precioMax={detailStockData.precio_max}
                  precioMin={detailStockData.precio_min}
                  precioApert={detailStockData.precio_apert}
                  montoEfectivo={detailStockData.monto_efectivo}
                  libroOrdenes={libroOrdenes}
                  apiUrl={CONFIG.API_URL}
                  onClose={cerrarStockDetail}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// COMPONENTE: MODAL CONTENT (TABS: Libro de Órdenes | Estadísticas)
// ============================================================================

function ModalContent({
  libroOrdenes,
  libroOrdenesLoading,
  libroOrdenesSimbolo,
  bvc,
}: {
  libroOrdenes: LibroOrdenesData | null;
  libroOrdenesLoading: boolean;
  libroOrdenesSimbolo: string | null;
  bvc: BVCData[];
}) {
  const [activeTab, setActiveTab] = useState<'orderbook' | 'stats'>('orderbook');

  // Encontrar los datos de la acción seleccionada
  const stockData = useMemo(() => {
    if (!libroOrdenesSimbolo) return null;
    return bvc.find((s) => s.simbolo === libroOrdenesSimbolo) || null;
  }, [bvc, libroOrdenesSimbolo]);

  return (
    <div className="flex flex-col max-h-[calc(90vh-80px)]">
      {/* Tabs */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-[#262626] bg-[#0a0a0a]" role="tablist" aria-label="Vista del modal">
        <button
          onClick={() => setActiveTab('orderbook')}
          className={cn(
            "px-3 sm:px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]",
            activeTab === 'orderbook'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'text-slate-400 hover:text-white hover:bg-[#1a1a1a]'
          )}
          role="tab"
          aria-selected={activeTab === 'orderbook'}
          aria-controls="panel-orderbook"
          id="tab-orderbook"
        >
          📊 Libro de Órdenes
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={cn(
            "px-3 sm:px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]",
            activeTab === 'stats'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-slate-400 hover:text-white hover:bg-[#1a1a1a]'
          )}
          role="tab"
          aria-selected={activeTab === 'stats'}
          aria-controls="panel-stats"
          id="tab-stats"
        >
          📈 Estadísticas
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 sm:p-4">
        {activeTab === 'orderbook' && (
          <div role="tabpanel" id="panel-orderbook" aria-labelledby="tab-orderbook">
          <OrderBook
            data={libroOrdenes || { simbolo: '', compras: [], ventas: [] }}
            loading={libroOrdenesLoading}
            error={libroOrdenes?.error || null}
          />
          </div>
        )}

        {activeTab === 'stats' && (
          <div role="tabpanel" id="panel-stats" aria-labelledby="tab-stats">
          {stockData ? (
            <StockStats stock={stockData} />
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-slate-400 text-sm">
                  No hay datos disponibles para {libroOrdenesSimbolo}
                </p>
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

// ============================================================================
// VISTA: DASHBOARD
// ============================================================================

function DashboardView({ tasas, bvc, patrimonio, macro, previousBvc, tasaBinanceFallback, mounted, loading }: any) {
  // Mostrar skeleton loading cuando no hay datos
  if (loading && !tasas) {
    return (
      <div className="space-y-4">
        {/* Skeleton Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="p-4" hover={false} animate={false}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton variant="text-sm" className="w-20" shimmer />
                    <Skeleton variant="circular" className="w-6 h-6" shimmer />
                  </div>
                  <Skeleton variant="text-xl" className="w-2/3" shimmer />
                  <Skeleton variant="text-sm" className="w-1/2" shimmer />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Skeleton Table */}
        <Card className="lg:col-span-2 p-0 overflow-hidden" hover={false} animate={false}>
          <div className="p-4 border-b border-[var(--border)]">
            <Skeleton variant="text" className="w-32" shimmer />
          </div>
          <div className="p-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 py-3 border-b border-[var(--border)] last:border-0">
                <Skeleton variant="circular" className="w-8 h-8 flex-shrink-0" shimmer />
                <Skeleton variant="text" className="flex-1" shimmer />
                <Skeleton variant="text" className="w-16" shimmer />
                <Skeleton variant="text" className="w-12" shimmer />
                <Skeleton variant="text" className="w-14" shimmer />
              </div>
            ))}
          </div>
        </Card>

        {/* Skeleton Chart */}
        <Card className="p-4" hover={false} animate={false}>
          <Skeleton variant="text" className="w-24 mb-4" shimmer />
          <Skeleton variant="rectangular" className="w-full h-48" shimmer />
        </Card>
      </div>
    );
  }

  if (!tasas) return null;

  // PARACAÍDAS MATEMÁTICO: Calcular brechas de forma segura
  // Brecha Binance vs BCV (Dólar)
  const brechaBinance = ((tasas?.binance ?? 0) > 0 && (tasas?.bcv ?? 0) > 0)
    ? (((tasas.binance ?? 0) / (tasas.bcv ?? 0)) - 1) * 100
    : 0;
  const brechaBinanceDisplay = tasas?.brecha_binance_pct !== undefined && tasas?.brecha_binance_pct !== null
    ? tasas.brecha_binance_pct
    : brechaBinance;

  // Brecha Euro vs BCV (Euro oficial comparado con tasa BCV base)
  const brechaEuro = ((tasas?.bcv_eur ?? 0) > 0 && (tasas?.bcv ?? 0) > 0)
    ? (((tasas.bcv_eur ?? 0) / (tasas.bcv ?? 0)) - 1) * 100
    : 0;

  // TOP 5/10 EMPRESAS MÁS RELEVANTES: Ordenar por mayor variación porcentual (valor absoluto)
  // y desempatar con monto_efectivo o volumen
  const bvcRelevantes = [...(bvc ?? [])].sort((a, b) => {
    const varAbsA = Math.abs(a.variacion_pct ?? 0);
    const varAbsB = Math.abs(b.variacion_pct ?? 0);
    // Primero por variación porcentual absoluta (descendente)
    if (varAbsA !== varAbsB) return varAbsB - varAbsA;
    // Desempate con monto_efectivo (descendente)
    const efectivoA = a.monto_efectivo ?? 0;
    const efectivoB = b.monto_efectivo ?? 0;
    if (efectivoA !== efectivoB) return efectivoB - efectivoA;
    // Desempate final con volumen (descendente)
    return (b.volumen ?? 0) - (a.volumen ?? 0);
  }).slice(0, 10);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* NUEVO: Dashboard Cards - 4 cards rediseñadas */}
      <DashboardCards
        tasas={tasas}
        bvc={bvc}
        patrimonio={patrimonio}
        macro={macro}
        previousBvc={previousBvc}
        tasaBinanceFallback={tasaBinanceFallback}
      />

      {/* Main Grid - Tabla BVC + Gráfico Brecha */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* BVC Summary */}
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#262626]">
            <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" aria-hidden="true" />
              MERCADO BVC
            </h3>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono text-slate-500">
              <span className="px-2 py-0.5 bg-[#141414] rounded">{bvc?.length || 0} ACCIONES</span>
            </div>
          </div>
          <div className="overflow-x-auto" role="region" aria-label="Tabla resumen del mercado BVC" tabIndex={0}>
            <table className="w-full" aria-label="Top 10 acciones más relevantes del mercado BVC">
              <caption className="sr-only">Las 10 acciones con mayor variación porcentual en la Bolsa de Valores de Caracas</caption>
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-[#262626]">
                  <th className="text-left py-3 px-3 sm:px-4 font-medium" scope="col">Símbolo</th>
                  <th className="text-center py-3 px-3 sm:px-4 font-medium" scope="col">Precio Bs</th>
                  <th className="text-center py-3 px-3 sm:px-4 font-medium" scope="col">Var %</th>
                  <th className="text-center py-3 px-3 sm:px-4 font-medium" scope="col">Volumen</th>
                  <th className="text-center py-3 px-3 sm:px-4 font-medium" scope="col">$</th>
                </tr>
              </thead>
              <tbody className="text-xs sm:text-sm">
                {bvcRelevantes.map((accion: BVCData) => {
                  const previous = previousBvc.find((p: BVCData) => p.simbolo === accion.simbolo);
                  return (
                    <BVCRow
                      key={accion.simbolo || 'S/N'}
                      accion={accion}
                      previous={previous}
                      tasaBinance={tasaBinanceFallback}
                      onStockClick={abrirStockDetail}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Spread Chart */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              BRECHA %
            </h3>
          </div>
          {/* FIX: Contenedor con min-height para evitar width/height = -1 */}
          <div className="h-48 min-h-[200px]">
            {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={
                // BLINDAJE: Verificar que macro sea un array válido
                Array.isArray(macro) && macro.length > 0
                  ? [...macro].reverse().slice(-15).map(item => {
                      // PARACAÍDAS MATEMÁTICO: Safe math para cálculo de brecha
                      const bcv = item?.tasa_bcv || 0;
                      const binance = item?.tasa_binance_p2p || 0;
                      const brecha = (bcv > 0 && binance > 0) ? Number((((binance - bcv) / bcv) * 100).toFixed(2)) : 0;
                      // BLINDAJE: substring seguro con fallback
                      const fecha = item?.fecha ? String(item.fecha).substring(5) : '--/--';
                      return {
                        fecha,
                        brecha
                      };
                    })
                  : [] // Datos vacíos si macro no es válido
              }>
                <defs>
                  <linearGradient id="colorBrecha" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fill: '#525252', fontSize: 9 }} axisLine={{ stroke: '#262626' }} tickLine={{ stroke: '#262626' }} />
                <YAxis tick={{ fill: '#525252', fontSize: 9 }} axisLine={{ stroke: '#262626' }} tickLine={{ stroke: '#262626' }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141414',
                    border: '1px solid #262626',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                  itemStyle={{ color: '#fbbf24' }}
                  formatter={(value: any) => [`${value}%`, "Brecha"]}
                />
                <Area type="monotone" dataKey="brecha" stroke="#f59e0b" strokeWidth={2} fill="url(#colorBrecha)" />
              </AreaChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                Cargando gráfico...
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* IBC Chart */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            EVOLUCIÓN DE TASAS
          </h3>
        </div>
        {/* FIX: Contenedor con min-height para evitar width/height = -1 */}
        <div className="h-48 min-h-[200px]">
          {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={
              // BLINDAJE: Verificar que macro sea un array válido con al menos 2 puntos
              Array.isArray(macro) && macro.length >= 2
                ? [...macro].reverse().slice(-30)
                : []
            }>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis
                dataKey="fecha"
                tick={{ fill: '#525252', fontSize: 9 }}
                axisLine={{ stroke: '#262626' }}
                tickLine={{ stroke: '#262626' }}
                // BLINDAJE: tickFormatter seguro
                tickFormatter={(tick) => tick ? String(tick).substring(5) : '--/--'}
              />
              <YAxis tick={{ fill: '#525252', fontSize: 9 }} axisLine={{ stroke: '#262626' }} tickLine={{ stroke: '#262626' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141414',
                  border: '1px solid #262626',
                  borderRadius: '4px',
                  fontSize: '11px'
                }}
              />
              <Line type="monotone" dataKey="tasa_bcv" stroke="#3b82f6" strokeWidth={2} dot={false} name="BCV" />
              <Line type="monotone" dataKey="tasa_binance_p2p" stroke="#f59e0b" strokeWidth={2} dot={false} name="Binance" />
            </LineChart>
          </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs">
              Cargando gráfico...
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// VISTA: PIZARRA
// ============================================================================

function PizarraView({ bvc, previousBvc, tasaBinanceFallback, marketStatus, tasas, fetchLibroOrdenes, loading }: any) {
  return (
    <div className="space-y-4">
      {/* KPIs de Mercado */}
      <MarketKPIs bvc={bvc} />

      {/* Rankings de Mercado */}
      <MarketRankings bvc={bvc} />

      {/* Tabla profesional de mercado */}
      <MarketTable
        bvc={bvc}
        previousBvc={previousBvc}
        tasas={tasas}
        marketStatus={marketStatus}
        onFetchLibroOrdenes={fetchLibroOrdenes}
      />
    </div>
  );
}

// ============================================================================
// // VISTA: CALCULADORA
// ============================================================================

function CalculadoraView({ tasas, bvc, loading }: any) {
  const [tradeTipo, setTradeTipo] = useState<'COMPRA'|'VENTA'>('COMPRA');
  const [tradeAcciones, setTradeAcciones] = useState<number>(1000);
  const [tradePrecio, setTradePrecio] = useState<number>(0);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [swapAnim, setSwapAnim] = useState(false);

  // Auto-completar precio al seleccionar símbolo
  const handleSymbolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sym = e.target.value;
    setSelectedSymbol(sym);
    if (sym && bvc && bvc.length > 0) {
      const accion = bvc.find((a: any) => a.simbolo === sym);
      if (accion && accion.precio) setTradePrecio(accion.precio);
    }
  };

  // Swap rápido USD↔VES
  const handleSwap = () => {
    setSwapAnim(true);
    setTimeout(() => setSwapAnim(false), 400);
    // Intercambiar valores de referencia visual
    const tmp = tradeAcciones;
    if (tradePrecio > 0) {
      setTradeAcciones(tradePrecio);
      setTradePrecio(tmp / tradeAcciones || 0);
    }
  };

  // Constantes de comisiones (Aprox 1% total ida o vuelta)
  const COMISION_PCT = 0.01;

  const subtotal = tradeAcciones * (tradePrecio || 0);
  const comision = subtotal * COMISION_PCT;
  const total = tradeTipo === 'COMPRA' ? subtotal + comision : subtotal - comision;

  // Break-even
  const breakEven = (tradePrecio || 0) * (1 + (COMISION_PCT * 2));

  // Impacto Cambiario
  const tasaBinance = tasas?.binance && tasas.binance > 0 ? tasas.binance : (CONFIG.FALLBACK_TASA_BINANCE || 1);
  const tasaBcv = tasas?.bcv && tasas.bcv > 0 ? tasas.bcv : (CONFIG.FALLBACK_TASA_BCV || 1);
  const totalUSDT = total / tasaBinance;
  const totalUSD = total / tasaBcv;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Card Principal con Gradiente ── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-emerald-500/5">
        {/* Fondo gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-teal-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        <div className="relative p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Simulador de Trading</h2>
              <p className="text-slate-400 text-sm">Calcula posiciones con comisiones reales (~1%)</p>
            </div>
          </div>

          {/* Formulario Principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              {/* Tipo de Operación */}
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Tipo de Operación</label>
                <div className="flex gap-2 p-1 bg-black/30 rounded-xl">
                  <button
                    onClick={() => setTradeTipo('COMPRA')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200",
                      tradeTipo === 'COMPRA'
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <ArrowDownRight className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Compra
                  </button>
                  <button
                    onClick={() => setTradeTipo('VENTA')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200",
                      tradeTipo === 'VENTA'
                        ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <ArrowUpRight className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Venta
                  </button>
                </div>
              </div>

              {/* Selector de Símbolo con icono */}
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Activo</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <select
                    value={selectedSymbol}
                    onChange={handleSymbolChange}
                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-slate-200 appearance-none cursor-pointer transition-all"
                  >
                    <option value="">Seleccionar activo...</option>
                    {bvc && bvc.length > 0 && bvc.map((a: any) => (
                      <option key={a.simbolo} value={a.simbolo} className="bg-slate-900">
                        {a.simbolo} — Bs {formatValue(a.precio, 2)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Cantidad y Precio */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Cantidad</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">#</div>
                    <input
                      type="number"
                      value={tradeAcciones}
                      onChange={(e) => setTradeAcciones(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white transition-all"
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Precio (Bs)</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">Bs</div>
                    <input
                      type="number"
                      value={tradePrecio}
                      onChange={(e) => setTradePrecio(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white transition-all"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Botón Swap */}
              <button
                onClick={handleSwap}
                className={cn(
                  "w-full py-2.5 rounded-xl border border-white/10 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:bg-white/5 hover:border-emerald-500/30",
                  swapAnim && "scale-95 rotate-180"
                )}
              >
                <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400">Intercambiar valores</span>
              </button>
            </div>

            {/* Recibo de Operación */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-6 flex flex-col justify-between backdrop-blur-sm">
              <div>
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/10">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Desglose de Operación</p>
                </div>

                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-slate-200 font-semibold">{subtotal.toLocaleString('es-VE', {minimumFractionDigits: 2})} <span className="text-slate-500 text-xs">Bs</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Comisión (1%)</span>
                    <span className={cn(
                      "font-semibold",
                      tradeTipo === 'VENTA' ? 'text-red-400' : 'text-amber-400'
                    )}>
                      {tradeTipo === 'VENTA' ? '−' : '+'}{comision.toLocaleString('es-VE', {minimumFractionDigits: 2})} <span className="text-slate-500 text-xs">Bs</span>
                    </span>
                  </div>
                </div>

                {/* Monto Neto Destacado */}
                <div className={cn(
                  "mt-5 p-4 rounded-xl border transition-all",
                  tradeTipo === 'COMPRA'
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-red-500/10 border-red-500/30"
                )}>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    {tradeTipo === 'COMPRA' ? 'Total a Pagar' : 'Total a Recibir'}
                  </p>
                  <p className={cn(
                    "text-3xl font-bold font-mono tracking-tight",
                    tradeTipo === 'COMPRA' ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {total.toLocaleString('es-VE', {minimumFractionDigits: 2})}
                    <span className="text-lg text-slate-500 ml-1">Bs</span>
                  </p>
                </div>
              </div>

              {/* Footer del recibo */}
              <div className="mt-5 space-y-2.5">
                <div className={cn(
                  "flex justify-between items-center px-3 py-2.5 rounded-lg border text-xs font-mono",
                  "bg-blue-500/10 border-blue-500/20"
                )}>
                  <span className="text-blue-300">Equivalente USDT</span>
                  <span className="text-blue-400 font-bold text-sm">{totalUSDT.toLocaleString('es-VE', {minimumFractionDigits: 2})}</span>
                </div>
                <div className={cn(
                  "flex justify-between items-center px-3 py-2.5 rounded-lg border text-xs font-mono",
                  "bg-indigo-500/10 border-indigo-500/20"
                )}>
                  <span className="text-indigo-300">Equivalente USD (BCV)</span>
                  <span className="text-indigo-400 font-bold text-sm">{totalUSD.toLocaleString('es-VE', {minimumFractionDigits: 2})}</span>
                </div>
                {tradeTipo === 'COMPRA' && (
                  <div className="flex justify-between items-center px-3 py-2.5 rounded-lg border text-xs font-mono bg-amber-500/10 border-amber-500/20">
                    <span className="text-amber-300">Break-Even</span>
                    <span className="text-amber-400 font-bold text-sm">{breakEven.toLocaleString('es-VE', {minimumFractionDigits: 3})} Bs</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tasas de Cambio en Vista ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tasa BCV */}
        <div className="relative rounded-xl overflow-hidden border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-slate-900">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-400">🇻🇪</span>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Tasa BCV</p>
                <p className="text-[10px] text-slate-600 font-mono">Oficial</p>
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-blue-400">
              {formatValue(tasaBcv, 2)}
              <span className="text-sm text-slate-500 ml-1">Bs/$</span>
            </p>
          </div>
        </div>

        {/* Tasa Binance */}
        <div className="relative rounded-xl overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-950/40 to-slate-900">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Tasa Binance</p>
                <p className="text-[10px] text-slate-600 font-mono">P2P</p>
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-amber-400">
              {formatValue(tasaBinance, 2)}
              <span className="text-sm text-slate-500 ml-1">Bs/USDT</span>
            </p>
          </div>
        </div>

        {/* Brecha */}
        <div className={cn(
          "relative rounded-xl overflow-hidden border bg-gradient-to-br to-slate-900",
          (tasas?.brecha_binance_pct || 0) >= 0
            ? "border-red-500/20 from-red-950/40"
            : "border-emerald-500/20 from-emerald-950/40"
        )}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                (tasas?.brecha_binance_pct || 0) >= 0 ? "bg-red-500/20" : "bg-emerald-500/20"
              )}>
                {(tasas?.brecha_binance_pct || 0) >= 0
                  ? <TrendingUp className="w-4 h-4 text-red-400" />
                  : <TrendingDown className="w-4 h-4 text-emerald-400" />
                }
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Brecha P2P</p>
                <p className="text-[10px] text-slate-600 font-mono">Diferencial</p>
              </div>
            </div>
            <p className={cn(
              "text-2xl font-bold font-mono",
              (tasas?.brecha_binance_pct || 0) >= 0 ? 'text-red-400' : 'text-emerald-400'
            )}>
              {formatPercent(tasas?.brecha_binance_pct, 2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VISTA: PORTAFOLIO - VERSIÓN MEJORADA
// ============================================================================

function PortafolioView({ patrimonio, mounted, onRefresh, fetchWithRetry, getAuthHeaders, apiUrl, loading }: any) {
  const BVC_SYMBOLS = [
    { symbol: 'ABC.A', name: 'BCO. CARIBE "A"' },
    { symbol: 'ARC.B', name: 'ARCA INM.VAL. "B"' },
    { symbol: 'BNC', name: 'BCO. NAC. CREDITO' },
    { symbol: 'BPV', name: 'BCO. PROVINCIAL' },
    { symbol: 'BVL', name: 'B. DE VENEZUELA' },
    { symbol: 'BVCC', name: 'BOLSA V. CCAS.' },
    { symbol: 'CCP.B', name: 'C.CAPITAL "B"' },
    { symbol: 'CCR', name: 'CR. CARABOBO' },
    { symbol: 'CGQ', name: 'CORP. GPO. QUIM.' },
    { symbol: 'CRM.A', name: 'CORIMON C.A.' },
    { symbol: 'DOM', name: 'DOMINGUEZ & CIA' },
    { symbol: 'EFE', name: 'PRODUCTOS EFE' },
    { symbol: 'ENV', name: 'ENVASES VZL.' },
    { symbol: 'FNC', name: 'FAB. N. CEMENTOS' },
    { symbol: 'FNV', name: 'F. NAC. VIDRIO' },
    { symbol: 'GMC.B', name: 'G. MANTRA CLASE B' },
    { symbol: 'GZL', name: 'GRUPO ZULIANO' },
    { symbol: 'ICP.B', name: 'I. CRECEPYMES -B-' },
    { symbol: 'IVC.A', name: 'INVACA I. C. "A"' },
    { symbol: 'IVC.B', name: 'INVACA I. C. "B"' },
    { symbol: 'MPA', name: 'MANPA, C.A. SACA' },
    { symbol: 'MTC.B', name: 'MONTESCO "B"' },
    { symbol: 'MVZ.A', name: 'MERCANTIL S.(A)' },
    { symbol: 'MVZ.B', name: 'MERCANTIL S.(B)' },
    { symbol: 'PCP.B', name: 'F. PETROLIA "B"' },
    { symbol: 'PIV.B', name: 'PIVCA CLASE "B"' },
    { symbol: 'PGR', name: 'PROAGRO' },
    { symbol: 'PTN', name: 'PROTINAL' },
    { symbol: 'RST', name: 'RON STA. TERESA' },
    { symbol: 'RST.B', name: 'R.S. TERESA "B"' },
    { symbol: 'SVS', name: 'SIVENSA, S.A.' },
    { symbol: 'TDV.D', name: 'CANTV CLASE (D)' },
    { symbol: 'TPG', name: 'T. PALO GRANDE' }
  ].sort((a, b) => a.symbol.localeCompare(b.symbol));

  const [showAdd, setShowAdd] = useState(false);
  const [editPosition, setEditPosition] = useState<any | null>(null);
  const [addTicker, setAddTicker] = useState('');
  const [addCantidad, setAddCantidad] = useState('');
  const [addPrecio, setAddPrecio] = useState('');
  const [addFecha, setAddFecha] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);

  const [showHistorico, setShowHistorico] = useState<any | null>(null);
  const [historicoData, setHistoricoData] = useState<any>(null);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  const resetForm = () => {
    setAddTicker(''); setAddCantidad(''); setAddPrecio(''); setAddFecha('');
    setAddError(''); setShowAdd(false); setEditPosition(null); setShowSymbolDropdown(false);
  };

  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault(); setAddError(''); setAddLoading(true);
    try {
      const body: any = {
        ticker: addTicker.toUpperCase().trim(),
        cantidad: parseFloat(addCantidad),
        precio_compra: parseFloat(addPrecio),
        fecha_compra: addFecha || undefined,
      };
      const url = editPosition ? `${apiUrl}/api/portafolio/${editPosition.id}` : `${apiUrl}/api/portafolio`;
      const method = editPosition ? 'PUT' : 'POST';
      console.log('[Portafolio] Enviando:', method, url, body);
      const response = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.message || 'Error al guardar');
      resetForm(); await onRefresh?.();
    } catch (err: unknown) {
      console.error('[Portafolio] Error:', err);
      setAddError(err instanceof Error ? err.message : 'Error al guardar');
    } finally { setAddLoading(false); }
  };

  const handleDeletePosition = async (id: number) => {
    try {
      const response = await fetch(`${apiUrl}/api/portafolio/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (response.ok) await onRefresh?.();
    } catch (err) { console.error('[Eliminar] Error:', err); }
  };

  const handleOpenEdit = (pos: any) => {
    setEditPosition({ id: pos.id || pos.portafolio_id, ticker: pos.ticker });
    setAddTicker(pos.ticker); setAddCantidad(pos.cantidad?.toString() || '');
    setAddPrecio(pos.precio_compra?.toString() || ''); setAddFecha(pos.fecha_compra || '');
    setShowAdd(true);
  };

  const handleVerHistorico = async (ticker: string) => {
    setLoadingHistorico(true);
    try {
      const data = await fetchWithRetry(`${apiUrl}/api/portafolio/historico/${ticker}`, { headers: getAuthHeaders() });
      setHistoricoData(data); setShowHistorico(ticker);
    } catch (err) { console.error('Error histórico:', err); }
    finally { setLoadingHistorico(false); }
  };

  const closeHistorico = () => { setShowHistorico(null); setHistoricoData(null); };

  const roiColor = (patrimonio?.roi_pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400';
  const RoiIcon = (patrimonio?.roi_pct || 0) >= 0 ? TrendingUp : TrendingDown;
  const isProfit = (patrimonio?.ganancia_perdida || 0) >= 0;

  // ── Estado vacío ──
  if (!patrimonio?.detalles?.length && !showAdd) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden border border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20" />
          <div className="relative p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center mx-auto mb-6 border border-white/5">
              <PieChart className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Portafolio vacío</h3>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">
              Comienza agregando tu primera posición para hacer seguimiento de tus inversiones en la BVC.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl font-semibold text-white transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
            >
              <Plus className="w-5 h-5" />
              Agregar primera posición
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* ── Modal Histórico ── */}
      {showHistorico && historicoData && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                Histórico: <span className="font-mono text-white">{showHistorico}</span>
              </h3>
              <button onClick={closeHistorico} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Total Invertido</p>
                <p className="font-mono font-bold text-white text-lg">{formatValue(historicoData.total_invertido, 2)} <span className="text-xs text-slate-500">Bs</span></p>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Cantidad</p>
                <p className="font-mono font-bold text-white text-lg">{formatValue(historicoData.total_cantidad, 0)}</p>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Promedio</p>
                <p className="font-mono font-bold text-blue-400 text-lg">{formatValue(historicoData.precio_promedio, 4)} <span className="text-xs text-slate-500">Bs</span></p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] text-slate-500 border-b border-white/10 uppercase font-mono">
                  <tr>
                    <th className="text-left py-2">Fecha</th>
                    <th className="text-right py-2">Cant.</th>
                    <th className="text-right py-2">Precio</th>
                    <th className="text-right py-2">Total</th>
                    <th className="text-right py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {historicoData.compras?.map((compra: any) => (
                    <tr key={compra.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 text-slate-300 text-xs">{compra.fecha_compra || 'N/A'}</td>
                      <td className="py-2.5 text-right font-mono text-slate-300">{formatValue(compra.cantidad, 0)}</td>
                      <td className="py-2.5 text-right font-mono text-slate-400 text-xs">{formatValue(compra.precio_compra, 4)} Bs</td>
                      <td className="py-2.5 text-right font-mono font-bold text-white">{formatValue((compra.cantidad * compra.precio_compra), 2)} Bs</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={async () => {
                            if (!confirm('¿Eliminar esta compra?')) return;
                            await fetchWithRetry(`${apiUrl}/api/portafolio/compra/${compra.id}`, { method: 'DELETE', headers: getAuthHeaders() });
                            handleVerHistorico(showHistorico); await onRefresh?.();
                          }}
                          className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Formulario Agregar/Editar ── */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl overflow-hidden border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950" />
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  {editPosition ? <Edit2 className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
                </div>
                {editPosition ? 'Editar Posición' : 'Nueva Posición'}
              </h3>
              <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePosition} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 relative">
                <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Activo</label>
                <div className="relative">
                  <input
                    type="text" value={addTicker}
                    onChange={(e) => { setAddTicker(e.target.value.toUpperCase()); setShowSymbolDropdown(true); }}
                    onFocus={() => setShowSymbolDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSymbolDropdown(false), 200)}
                    placeholder={editPosition ? "No editable" : "Buscar símbolo..."}
                    required readOnly={!!editPosition}
                    className={cn(
                      "w-full bg-black/30 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 uppercase transition-all",
                      editPosition ? "border-white/5 text-slate-500 cursor-not-allowed" : "border-white/10 text-white placeholder:text-slate-600"
                    )}
                  />
                  {showSymbolDropdown && !editPosition && (
                    <div className="absolute z-50 w-full mt-1.5 bg-slate-900 border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-2xl">
                      {BVC_SYMBOLS.filter(sym => sym.symbol.toLowerCase().includes(addTicker.toLowerCase())).map(sym => (
                        <button key={sym.symbol} type="button"
                          onClick={() => { setAddTicker(sym.symbol); setShowSymbolDropdown(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono font-bold text-sm">{sym.symbol}</span>
                            <span className="text-xs text-slate-500 ml-2">{sym.name}</span>
                          </div>
                          <Check className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                      ))}
                      {BVC_SYMBOLS.filter(sym => sym.symbol.toLowerCase().includes(addTicker.toLowerCase())).length === 0 && (
                        <div className="px-4 py-3 text-sm text-slate-500">Sin coincidencias</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Cantidad</label>
                <input type="number" value={addCantidad} onChange={(e) => setAddCantidad(e.target.value)}
                  min="0" step="0.01" required
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white transition-all" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Precio (Bs)</label>
                <input type="number" value={addPrecio} onChange={(e) => setAddPrecio(e.target.value)}
                  min="0" step="0.01" required
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white transition-all" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Fecha (opcional)</label>
                <input type="date" value={addFecha} onChange={(e) => setAddFecha(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white transition-all" />
              </div>
              {addError && <div className="sm:col-span-2 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{addError}</div>}
              <div className="sm:col-span-2 flex gap-3 justify-end pt-2">
                <button type="button" onClick={resetForm} className="px-5 py-2.5 text-slate-400 hover:text-white text-sm border border-white/10 rounded-xl hover:bg-white/5 transition-colors font-medium">
                  Cancelar
                </button>
                <button type="submit" disabled={addLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20">
                  {addLoading ? 'Guardando...' : editPosition ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* ── Resumen del Portafolio ── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950" />
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              Resumen del Portafolio
            </h3>
            <button
              onClick={() => { resetForm(); setShowAdd(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-lg text-sm font-semibold text-white transition-all shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Valor Total VES */}
            <div className="bg-black/20 border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-400">Bs</span>
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Valor Total</span>
              </div>
              <p className="text-2xl font-bold text-white font-mono">
                {patrimonio.total_ves?.toLocaleString('es-VE', { minimumFractionDigits: 2 }) ?? '0.00'}
              </p>
              <div className={cn("inline-flex items-center gap-1 text-xs font-bold mt-2 px-2 py-1 rounded-md bg-black/30 border border-white/5", roiColor)}>
                <RoiIcon size={12} />
                ROI: {formatPercent(patrimonio.roi_pct, 2)}
              </div>
            </div>

            {/* USD BCV */}
            <div className="bg-black/20 border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-400">$</span>
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">USD (BCV)</span>
              </div>
              <p className="text-xl font-bold text-blue-400 font-mono">
                {patrimonio.total_usd?.toLocaleString('es-VE', { minimumFractionDigits: 2 }) ?? '0.00'}
              </p>
              <p className="text-[10px] text-slate-600 font-mono mt-1">Tasa: {formatValue(patrimonio.tasa_bcv_usada, 2)}</p>
            </div>

            {/* USDT Binance */}
            <div className="bg-black/20 border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">USDT (P2P)</span>
              </div>
              <p className="text-xl font-bold text-amber-400 font-mono">
                {patrimonio.total_usdt?.toLocaleString('es-VE', { minimumFractionDigits: 2 }) ?? '0.00'}
              </p>
              <p className="text-[10px] text-slate-600 font-mono mt-1">Tasa: {formatValue(patrimonio.tasa_binance_usada, 2)}</p>
            </div>

            {/* P&L */}
            <div className={cn(
              "bg-black/20 border rounded-xl p-4",
              isProfit ? "border-emerald-500/20" : "border-red-500/20"
            )}>
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  isProfit ? "bg-emerald-500/15" : "bg-red-500/15"
                )}>
                  {isProfit ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">P&L</span>
              </div>
              <p className={cn("text-xl font-bold font-mono", isProfit ? 'text-emerald-400' : 'text-red-400')}>
                {isProfit ? '+' : ''}{patrimonio?.ganancia_perdida?.toLocaleString('es-VE', { minimumFractionDigits: 2 }) ?? '0.00'}
              </p>
              <p className="text-[10px] text-slate-600 font-mono mt-1">Inv: {patrimonio?.total_inversion?.toLocaleString('es-VE', {minimumFractionDigits: 2}) ?? '0.00'} Bs</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Layout: Gráfico + Tabla ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pie Chart */}
        {patrimonio.detalles.length > 1 && (
          <div className="lg:col-span-4">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950" />
              <div className="relative p-5">
                <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-400" />
                  Distribución
                </h4>
                <div className="h-56">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie data={patrimonio.detalles}>
                        <Pie
                          data={patrimonio.detalles}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={75}
                          paddingAngle={4}
                          dataKey="valor_usdt" nameKey="ticker"
                          stroke="none"
                        >
                          {patrimonio.detalles.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '12px', color: '#e2e8f0' }}
                          formatter={(value: any) => [`${formatValue(Number(value), 2)} USDT`, 'Valor']}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  )}
                </div>
                {/* Leyenda */}
                <div className="mt-3 space-y-1.5">
                  {patrimonio.detalles.map((item: any, idx: number) => (
                    <div key={item.ticker} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                        <span className="font-mono text-slate-300 font-medium">{item.ticker}</span>
                      </div>
                      <span className="font-mono text-slate-500">{formatValue(Number(item.valor_usdt), 0)} USDT</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Posiciones */}
        <div className={cn("lg:col-span-12", patrimonio.detalles.length > 1 && "lg:col-span-8")}>
          <div className="relative rounded-2xl overflow-hidden border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950" />
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Posiciones Activas
                </h4>
                <span className="text-xs text-slate-500 font-mono bg-black/30 px-3 py-1 rounded-lg border border-white/5">
                  {patrimonio.detalles.length} activo{patrimonio.detalles.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm font-mono">
                  <thead>
                    <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-white/10">
                      <th className="text-left py-3 px-3 font-medium">Activo</th>
                      <th className="text-center py-3 px-3 font-medium">Cant.</th>
                      <th className="text-center py-3 px-3 font-medium">P. Compra</th>
                      <th className="text-center py-3 px-3 font-medium">P. Actual</th>
                      <th className="text-center py-3 px-3 font-medium">P&L %</th>
                      <th className="text-center py-3 px-3 font-medium">Valor Bs</th>
                      <th className="text-center py-3 px-3 font-medium">Valor USDT</th>
                      <th className="text-center py-3 px-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {patrimonio.detalles.map((item: any, idx: number) => {
                      const glColor = (item.gain_loss_pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400';
                      const GLOrrow = (item.gain_loss_pct || 0) >= 0 ? ArrowUpRight : ArrowDownRight;
                      const tasaBinance = patrimonio.tasa_binance_usada || 1;
                      const montoValorActual = (item.cantidad || 0) * (item.precio_bvc || 0);
                      const montoUsdt = montoValorActual / tasaBinance;
                      return (
                        <tr key={item.ticker} className="hover:bg-white/5 transition-colors group">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                              <div>
                                <span className="font-bold text-white text-sm">{item.ticker}</span>
                                {item.sector && <p className="text-[10px] text-slate-600">{item.sector}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-300 text-sm">
                            {Math.floor(item.cantidad || 0).toLocaleString('es-VE')}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-400 text-sm">
                            {formatValue(item.precio_promedio_compra, 2)}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-300 text-sm">
                            {formatValue(item.precio_bvc, 2)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className={cn("inline-flex items-center gap-1 font-mono font-bold text-sm px-2.5 py-1 rounded-lg",
                              (item.gain_loss_pct || 0) >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                            )}>
                              <GLOrrow size={12} />
                              {formatPercent(item.gain_loss_pct, 2)}
                            </div>
                          </td>
                          <td className={cn("py-3 px-3 text-center font-semibold text-sm", glColor)}>
                            {formatValue(montoValorActual, 2)}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-300 text-sm">
                            {formatValue(montoUsdt, 2)}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 justify-center opacity-60 group-hover:opacity-100 transition-opacity" role="group" aria-label={`Acciones para ${item.ticker}`}>
                              <button onClick={() => handleOpenEdit(item)}
                                className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]"
                                aria-label={`Editar posición de ${item.ticker}`}
                                title="Editar">
                                <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                              <button onClick={() => handleVerHistorico(item.ticker)}
                                className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]"
                                aria-label={`Ver histórico de precios de ${item.ticker}`}
                                title="Histórico">
                                <History className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                              <button onClick={() => { const id = item.id || item.portafolio_id; if (id) handleDeletePosition(id); }}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]"
                                aria-label={`Eliminar posición de ${item.ticker}`}
                                title="Eliminar">
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VISTA: MERCADO RESUMEN
// ============================================================================

function MercadoResumenView({ bvc, previousBvc, tasas, mounted, loading }: any) {
  // Ordenar por volumen para ver las más activas
  const bvcActivas = [...(bvc ?? [])].sort((a, b) => (b.volumen ?? 0) - (a.volumen ?? 0)).slice(0, 20);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            RESUMEN DEL MERCADO
          </h3>
          <div className="text-xs text-slate-400 font-mono">
            {bvc?.length || 0} acciones listadas
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#0a0a0a] border border-[#262626] rounded p-3">
            <p className="text-[10px] text-slate-500 uppercase">Total Operaciones</p>
            <p className="text-lg font-bold text-white font-mono">
              {bvc?.reduce((sum: number, a: any) => sum + (a.tot_op_negoc ?? 0), 0).toLocaleString('es-VE') || '—'}
            </p>
          </div>
          <div className="bg-[#0a0a0a] border border-[#262626] rounded p-3">
            <p className="text-[10px] text-slate-500 uppercase">Volumen Total</p>
            <p className="text-lg font-bold text-white font-mono">
              {bvc?.reduce((sum: number, a: any) => sum + (a.volumen ?? 0), 0).toLocaleString('es-VE') || '—'}
            </p>
          </div>
          <div className="bg-[#0a0a0a] border border-[#262626] rounded p-3">
            <p className="text-[10px] text-slate-500 uppercase">Monto Efectivo</p>
            <p className="text-lg font-bold text-white font-mono">
              {bvc?.reduce((sum: number, a: any) => sum + (a.monto_efectivo ?? 0), 0).toLocaleString('es-VE', { maximumFractionDigits: 2 }) || '—'} Bs
            </p>
          </div>
          <div className="bg-[#0a0a0a] border border-[#262626] rounded p-3">
            <p className="text-[10px] text-slate-500 uppercase">Tasa BCV</p>
            <p className="text-lg font-bold text-emerald-400 font-mono">
              {tasas?.bcv?.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'} Bs/USD
            </p>
          </div>
        </div>

        {/* Tabla de acciones más activas */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-[#262626]">
                <th className="text-left py-3 px-4 font-medium">#</th>
                <th className="text-left py-3 px-4 font-medium">Símbolo</th>
                <th className="text-right py-3 px-4 font-medium">Precio Bs</th>
                <th className="text-right py-3 px-4 font-medium">Var %</th>
                <th className="text-right py-3 px-4 font-medium">Volumen</th>
                <th className="text-right py-3 px-4 font-medium">Monto Bs</th>
                <th className="text-right py-3 px-4 font-medium">Operaciones</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {bvcActivas.map((accion: any, idx: number) => (
                <tr key={accion.simbolo} className="border-b border-[#1a1a1a] hover:bg-[#141414] transition-colors">
                  <td className="py-3 px-4 text-slate-500 font-mono text-xs">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-bold text-white">{accion.simbolo}</p>
                      <p className="text-[10px] text-slate-500">{accion.desc_simb}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                    {accion.precio?.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={cn(
                      "font-mono font-semibold",
                      (accion.variacion_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {accion.variacion_pct?.toFixed(2) || '0.00'}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {accion.volumen?.toLocaleString('es-VE') || '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {accion.monto_efectivo?.toLocaleString('es-VE', { maximumFractionDigits: 2 }) || '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {accion.tot_op_negoc?.toLocaleString('es-VE') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// VISTA: ALERTAS
// ============================================================================

function AlertasView({ tasas, loading }: any) {
  if (!tasas) return null;

  // Definir umbrales de alerta
  const alertas = [
    {
      nombre: 'BCV Alto',
      condicion: (tasas?.bcv ?? 0) > 500,
      valor: tasas?.bcv?.toFixed(2) || '—',
      umbral: '500.00',
      severidad: 'warning',
    },
    {
      nombre: 'BCV Bajo',
      condicion: (tasas?.bcv ?? 0) < 400,
      valor: tasas?.bcv?.toFixed(2) || '—',
      umbral: '400.00',
      severidad: 'info',
    },
    {
      nombre: 'Binance Alto',
      condicion: (tasas?.binance ?? 0) > 700,
      valor: tasas?.binance?.toFixed(2) || '—',
      umbral: '700.00',
      severidad: 'warning',
    },
    {
      nombre: 'Brecha Binance',
      condicion: (tasas?.brecha_binance_pct ?? 0) > 50,
      valor: `${tasas?.brecha_binance_pct?.toFixed(2) || '—'}%`,
      umbral: '>50%',
      severidad: 'critical',
    },
    {
      nombre: 'Brecha Normal',
      condicion: (tasas?.brecha_binance_pct ?? 0) < 30,
      valor: `${tasas?.brecha_binance_pct?.toFixed(2) || '—'}%`,
      umbral: '<30%',
      severidad: 'success',
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            SISTEMA DE ALERTAS
          </h3>
        </div>

        <div className="space-y-3">
          {alertas.map((alerta, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center justify-between p-4 border rounded-lg transition-colors",
                alerta.condicion
                  ? alerta.severidad === 'critical'
                    ? 'bg-red-500/10 border-red-500/30'
                    : alerta.severidad === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : alerta.severidad === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-[#0a0a0a] border-[#262626]'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  alerta.condicion
                    ? alerta.severidad === 'critical'
                      ? 'bg-red-500 animate-pulse'
                      : alerta.severidad === 'warning'
                        ? 'bg-amber-500 animate-pulse'
                        : alerta.severidad === 'success'
                          ? 'bg-emerald-500'
                          : 'bg-blue-500 animate-pulse'
                    : 'bg-slate-600'
                )} />
                <div>
                  <p className="font-semibold text-white">{alerta.nombre}</p>
                  <p className="text-xs text-slate-400">Umbral: {alerta.umbral}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-mono font-bold",
                  alerta.condicion ? 'text-white' : 'text-slate-400'
                )}>
                  {alerta.valor}
                </p>
                <p className="text-xs text-slate-500">
                  {alerta.condicion ? 'ACTIVO' : 'Inactivo'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// VISTA: EXPORTAR DATOS
// ============================================================================

function ExportarView({ apiUrl, getAuthHeaders }: { apiUrl: string; getAuthHeaders: () => HeadersInit }) {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'xlsx' | 'zip') => {
    setExporting(format);
    try {
      const headers = getAuthHeaders();
      const endpoint = format === 'zip'
        ? `${apiUrl}/api/export/all`
        : `${apiUrl}/api/export/tasas?format=${format}`;

      const response = await fetch(endpoint, { headers });
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bvc_data_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('[Export] Error:', err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            EXPORTAR DATOS
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting !== null}
            className="flex flex-col items-center gap-3 p-6 bg-[#0a0a0a] border border-[#262626] rounded-lg hover:border-emerald-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="p-3 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <path d="M15 3v4a2 2 0 0 0 2 2h4"/><path d="M3 12v-3a9 9 0 0 1 9-9h4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-white">CSV</p>
              <p className="text-xs text-slate-400">Hoja de cálculo</p>
            </div>
            {exporting === 'csv' && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
          </button>

          <button
            onClick={() => handleExport('xlsx')}
            disabled={exporting !== null}
            className="flex flex-col items-center gap-3 p-6 bg-[#0a0a0a] border border-[#262626] rounded-lg hover:border-emerald-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                <path d="M15 3v4a2 2 0 0 0 2 2h4"/><path d="M3 12v-3a9 9 0 0 1 9-9h4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-white">Excel (XLSX)</p>
              <p className="text-xs text-slate-400">Excel completo</p>
            </div>
            {exporting === 'xlsx' && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
          </button>

          <button
            onClick={() => handleExport('zip')}
            disabled={exporting !== null}
            className="flex flex-col items-center gap-3 p-6 bg-[#0a0a0a] border border-[#262626] rounded-lg hover:border-emerald-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/><path d="M4 12H20"/><path d="M12 4v16"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-white">ZIP</p>
              <p className="text-xs text-slate-400">Todos los datos</p>
            </div>
            {exporting === 'zip' && <Loader2 className="w-4 h-4 animate-spin text-purple-400" />}
          </button>
        </div>

        <div className="mt-6 p-4 bg-[#0a0a0a] border border-[#262626] rounded-lg">
          <p className="text-xs text-slate-400">
            <strong className="text-white">Nota:</strong> La exportación incluye tasas de cambio, datos BVC y resumen del mercado.
            Los archivos se descargarán automáticamente.
          </p>
        </div>
      </Card>
    </div>
  );
}

