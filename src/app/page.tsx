'use client';

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, DollarSign, Loader2, AlertCircle, RefreshCw, Calculator,
  PieChart, Activity, Wallet, Building2, Layers, Zap, Globe, Shield, Cpu,
  BarChart3, ArrowUpRight, ArrowDownRight, LogOut, Star
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

// Tipos
import { TasasData, BVCData, PatrimonioData, MacroRow, ActiveTab, LibroOrdenesData } from './types';

// Componentes
import {
  PriceTicker, BVCRow, MetricCard, Card, FlashPrice, NewsTicker,
  CONFIG, CHART_COLORS, cn, formatValue, formatInt, formatPercent, formatPercentSimple
} from '@/components';

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

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-xl border-b border-[#262626]">
        <div className="max-w-[2000px] mx-auto px-4">
          {/* Top bar */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded shadow-lg shadow-emerald-500/20">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
                    BVC TERMINAL
                  </h1>
                  <p className="text-[10px] text-slate-500 font-mono tracking-wider">BOLSA DE VALORES DE CARACAS</p>
                </div>
              </div>
              {/* Indicador de Mercado - Vinculado al endpoint /api/estado-mercado */}
              <div className="hidden md:flex items-center gap-2 ml-4 px-3 py-1 bg-[#0a0a0a] rounded border border-[#262626]">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  marketStatus?.estado === 'Abierto' ? 'bg-emerald-500 animate-pulse' :
                  marketStatus?.estado === 'Cerrado' ? 'bg-slate-500' :
                  'bg-amber-500'
                )} />
                <span className="text-[10px] font-mono text-slate-400">
                  {marketStatus?.estado || (error ? 'ERROR' : 'Cargando...')}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-xs text-slate-400 truncate max-w-[120px]" title={user.email}>
                  {user.email}
                </span>
              )}
              <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono text-slate-500">
                <Shield size={12} />
                <span>WebSocket: {socketConnected ? 'CONECTADO' : 'DESCONECTADO'}</span>
                <span className="text-slate-700">|</span>
                <RefreshCw size={12} className={cn(loading && 'animate-spin')} />
                <span>{lastUpdate.toLocaleTimeString()}</span>
              </div>
              <button
                onClick={async () => {
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
                }}
                className="p-2 hover:bg-[#0a0a0a] rounded transition-colors group"
              >
                <RefreshCw size={18} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </button>
              <button
                onClick={() => { logout(); router.replace('/login'); }}
                className="p-2 hover:bg-[#0a0a0a] rounded transition-colors group"
                title="Cerrar sesión"
              >
                <LogOut size={18} className="text-slate-500 group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-2 pb-3">
            <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Activity size={16} />} label="DASHBOARD" />
            <TabButton active={activeTab === 'pizarra'} onClick={() => setActiveTab('pizarra')} icon={<Layers size={16} />} label="PIZARRA BVC" />
            <TabButton active={activeTab === 'calculadora'} onClick={() => setActiveTab('calculadora')} icon={<Calculator size={16} />} label="CALCULADORA" />
            <TabButton active={activeTab === 'portafolio'} onClick={() => setActiveTab('portafolio')} icon={<PieChart size={16} />} label="PORTAFOLIO" />
          </nav>
        </div>
      </header>

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
            className="max-w-[2000px] mx-auto px-4 mt-3"
          >
            <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-2 flex items-center gap-2">
              <AlertCircle className="text-red-400 w-4 h-4 flex-shrink-0" />
              <p className="text-red-300 text-sm font-mono">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-[2000px] mx-auto px-4 py-4 relative z-10">
        {activeTab === 'dashboard' && (
          <DashboardView
            tasas={tasas}
            bvc={bvc}
            patrimonio={patrimonio}
            macro={macro}
            previousBvc={previousBvc}
            tasaBinanceFallback={tasaBinanceFallback}
            mounted={mounted}
          />
        )}

        {activeTab === 'calculadora' && (
          <CalculadoraView tasas={tasas} bvc={bvc} />
        )}

        {activeTab === 'pizarra' && (
          <PizarraView
            bvc={bvc}
            previousBvc={previousBvc}
            tasaBinanceFallback={tasaBinanceFallback}
            marketStatus={marketStatus}
            tasas={tasas}
            fetchLibroOrdenes={fetchLibroOrdenes}
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
          />
        )}
      </main>

      {/* MODAL LIBRO DE ÓRDENES */}
      <AnimatePresence>
        {libroOrdenes && libroOrdenesSimbolo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={cerrarLibroOrdenes}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0a0a0a] border border-[#262626] rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#262626] bg-[#0a0a0a]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 border border-red-500/30 rounded">
                    <span className="text-xl">📊</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">LIBRO DE ÓRDENES - {libroOrdenesSimbolo}</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {libroOrdenes.fuente === 'cache' ? '● Datos en caché' : libroOrdenes.fuente === 'directo' ? '● Datos en tiempo real' : '● Datos disponibles'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={cerrarLibroOrdenes}
                  className="p-2 hover:bg-[#262626] rounded transition-colors group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-red-400 transition-colors">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
              </div>

              {/* Contenido */}
              <div className="p-4 overflow-auto max-h-[calc(80vh-140px)]">
                {libroOrdenesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-red-400" size={32} />
                    <span className="ml-3 text-slate-400">Cargando libro de órdenes...</span>
                  </div>
                ) : libroOrdenes.error ? (
                  <div className="flex items-center justify-center py-12">
                    <AlertCircle className="text-red-400" size={32} />
                    <span className="ml-3 text-red-400">{libroOrdenes.error}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {/* COMPRAS */}
                    <div className="bg-[#0a0a0a] border border-emerald-500/20 rounded-lg overflow-hidden">
                      <div className="bg-emerald-500/10 px-4 py-3 border-b border-emerald-500/20">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-emerald-400 flex items-center gap-2">
                            <ArrowUpRight size={18} />
                            COMPRAS
                          </h4>
                          {libroOrdenes.mejor_bid !== undefined && libroOrdenes.mejor_bid !== null && (
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">Mejor Compra</span>
                              <span className="text-base font-bold text-emerald-400">
                                {libroOrdenes.mejor_bid?.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm table-fixed">
                          <thead>
                            <tr className="text-slate-400 border-b border-[#262626]">
                              <th className="text-left py-2 px-3 font-medium w-1/4">Cantidad</th>
                              <th className="text-right py-2 px-3 font-medium w-3/4">Precio (Bs)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {libroOrdenes.compras.length === 0 ? (
                              <tr>
                                <td colSpan={2} className="text-center py-8 text-slate-500">
                                  Sin órdenes de compra
                                </td>
                              </tr>
                            ) : (
                              (() => {
                                const maxVolumen = Math.max(...libroOrdenes.compras.map((o: any) => o.cantidad), ...(libroOrdenes.ventas?.map((o: any) => o.cantidad) || [1]));
                                return libroOrdenes.compras.map((orden, idx) => {
                                  const volumenRatio = maxVolumen > 0 ? orden.cantidad / maxVolumen : 0;
                                  const barWidth = Math.min(90, Math.max(4, volumenRatio * 90));

                                  return (
                                    <tr key={idx} className="border-b border-[#1a1a1a] hover:bg-[#0a0a0a]">
                                      <td className="py-3 px-3 font-mono text-slate-300 text-base text-left w-1/4">
                                        {orden.cantidad.toLocaleString('es-VE')}
                                      </td>
                                      <td className="py-3 px-0 w-3/4 relative">
                                        <div className="flex items-center justify-end gap-2">
                                          {/* Barra de volumen - crece desde la derecha hacia izquierda, pegada al precio */}
                                          <div
                                            className="h-2 bg-emerald-500/30 rounded-full transition-all duration-300"
                                            style={{
                                              width: `${barWidth}%`,
                                            }}
                                          />
                                          <span className="font-mono font-bold text-emerald-400 text-base whitespace-nowrap">
                                            {orden.precio.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* VENTAS */}
                    <div className="bg-[#0a0a0a] border border-red-500/20 rounded-lg overflow-hidden">
                      <div className="bg-red-500/10 px-4 py-3 border-b border-red-500/20">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-red-400 flex items-center gap-2">
                            <ArrowDownRight size={18} />
                            VENTAS
                          </h4>
                          {libroOrdenes.mejor_ask !== undefined && libroOrdenes.mejor_ask !== null && (
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">Mejor Venta</span>
                              <span className="text-base font-bold text-red-400">
                                {libroOrdenes.mejor_ask?.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm table-fixed">
                          <thead>
                            <tr className="text-slate-400 border-b border-[#262626]">
                              <th className="text-left py-2 px-3 font-medium w-3/4">Precio (Bs)</th>
                              <th className="text-right py-2 px-3 font-medium w-1/4">Cantidad</th>
                            </tr>
                          </thead>
                          <tbody>
                            {libroOrdenes.ventas.length === 0 ? (
                              <tr>
                                <td colSpan={2} className="text-center py-8 text-slate-500">
                                  Sin órdenes de venta
                                </td>
                              </tr>
                            ) : (
                              (() => {
                                const maxVolumen = Math.max(...(libroOrdenes.compras?.map((o: any) => o.cantidad) || [1]), ...libroOrdenes.ventas.map((o: any) => o.cantidad));
                                return libroOrdenes.ventas.map((orden, idx) => {
                                  const volumenRatio = maxVolumen > 0 ? orden.cantidad / maxVolumen : 0;
                                  const barWidth = Math.min(90, Math.max(4, volumenRatio * 90));

                                  return (
                                    <tr key={idx} className="border-b border-[#1a1a1a] hover:bg-[#0a0a0a]">
                                      <td className="py-3 px-0 w-3/4 relative">
                                        <div className="flex items-center justify-start gap-2">
                                          <span className="font-mono font-bold text-red-400 text-base whitespace-nowrap">
                                            {orden.precio.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                          {/* Barra de volumen - crece desde la izquierda hacia derecha, pegada al precio */}
                                          <div
                                            className="h-2 bg-red-500/30 rounded-full transition-all duration-300"
                                            style={{
                                              width: `${barWidth}%`,
                                            }}
                                          />
                                        </div>
                                      </td>
                                      <td className="py-3 px-3 font-mono text-slate-300 text-base text-right w-1/4">
                                        {orden.cantidad.toLocaleString('es-VE')}
                                      </td>
                                    </tr>
                                  );
                                });
                              })()
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Spread Info - CENTRADO */}
                {!libroOrdenesLoading && !libroOrdenes.error && libroOrdenes.spread !== undefined && libroOrdenes.spread !== null && (
                  <div className="mt-4 p-4 bg-[#0a0a0a] border border-[#262626] rounded-lg">
                    <div className="flex items-center justify-center gap-8">
                      <div className="text-center">
                        <span className="text-xs text-slate-400 block">Spread</span>
                        <span className="text-lg font-bold text-white">
                          {libroOrdenes.spread.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-xs text-slate-400 block">Spread %</span>
                        <span className={cn(
                          "text-lg font-bold",
                          (libroOrdenes.spread_pct ?? 0) < 5 ? 'text-emerald-400' : 'text-amber-400'
                        )}>
                          {formatPercent(libroOrdenes.spread_pct, 2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-all uppercase tracking-wider rounded-lg",
        active
          ? 'bg-[#141414] text-emerald-400 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20'
          : 'text-slate-500 hover:text-slate-300 hover:bg-[#141414]/50 border-2 border-transparent'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ============================================================================
// VISTA: DASHBOARD
// ============================================================================

function DashboardView({ tasas, bvc, patrimonio, macro, previousBvc, tasaBinanceFallback, mounted }: any) {
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
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="BCV OFICIAL"
          value={formatValue(tasas?.bcv, 2)}
          suffix="Bs/USD"
          icon={<DollarSign size={18} />}
          variant="blue"
          subValue="Tasa Oficial"
        />
        <MetricCard
          title="EURO OFICIAL"
          value={formatValue(tasas?.bcv_eur, 2)}
          suffix="Bs/EUR"
          icon={<Globe size={18} />}
          variant="purple"
          subValue={`Brecha: ${formatPercent(brechaEuro, 2)}`}
        />
        <MetricCard
          title="BINANCE"
          value={formatValue(tasas?.binance, 2)}
          suffix="Bs/USDT"
          icon={<TrendingUp size={18} />}
          variant="amber"
          subValue={`Brecha: ${formatPercent(brechaBinanceDisplay, 2)}`}
        />
        <MetricCard
          title="PATRIMONIO BVC"
          value={patrimonio?.total_ves?.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '—'}
          suffix="Bs"
          icon={<Wallet size={18} />}
          variant={patrimonio?.roi_pct && patrimonio.roi_pct >= 0 ? 'emerald' : 'red'}
          subValue={`ROI: ${formatPercent(patrimonio?.roi_pct, 2)}`}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* BVC Summary */}
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#262626]">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              MERCADO BVC
            </h3>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="px-2 py-0.5 bg-[#141414] rounded">{bvc?.length || 0} ACCIONES</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-[#262626]">
                  <th className="text-left py-3 px-4 font-medium">Símbolo</th>
                  <th className="text-center py-3 px-4 font-medium">Precio Bs</th>
                  <th className="text-center py-3 px-4 font-medium">Var %</th>
                  <th className="text-center py-3 px-4 font-medium">Volumen</th>
                  <th className="text-center py-3 px-4 font-medium">$</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {bvcRelevantes.map((accion: BVCData) => {
                  const previous = previousBvc.find((p: BVCData) => p.simbolo === accion.simbolo);
                  return (
                    <BVCRow
                      key={accion.simbolo || 'S/N'}
                      accion={accion}
                      previous={previous}
                      tasaBinance={tasaBinanceFallback}
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

// ============================================================================
// VISTA: PIZARRA
// ============================================================================

function PizarraView({ bvc, previousBvc, tasaBinanceFallback, marketStatus, tasas, fetchLibroOrdenes }: any) {
  // Determinar estado del mercado para el badge
  const isMarketOpen = marketStatus?.estado === 'Abierto';
  const marketStatusColor = isMarketOpen ? 'bg-emerald-500 animate-pulse' :
                           marketStatus?.estado === 'Cerrado' ? 'bg-slate-500' :
                           'bg-amber-500';
  const marketStatusLabel = marketStatus?.estado || 'LIVE';

  // PARACAÍDAS MATEMÁTICO: Tasa BCV para conversión a USD (validación estricta)
  const tasaBCV = ((tasas?.bcv ?? 0) > 0) ? tasas.bcv : CONFIG.FALLBACK_TASA_BCV;

  // FAVORITOS: Estado y persistencia en localStorage
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bvc_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error('[Favorites] Error loading from localStorage:', err);
      return [];
    }
  });

  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Guardar favoritos en localStorage cuando cambien
  useEffect(() => {
    try {
      localStorage.setItem('bvc_favorites', JSON.stringify(favoriteSymbols));
      console.log('[Favorites] Guardados:', favoriteSymbols.length, 'símbolos');
    } catch (err) {
      console.error('[Favorites] Error saving to localStorage:', err);
    }
  }, [favoriteSymbols]);

  // Toggle favorite
  const toggleFavorite = useCallback((simbolo: string) => {
    setFavoriteSymbols((prev: string[]) => {
      if (prev.includes(simbolo)) {
        return prev.filter((s) => s !== simbolo);
      } else {
        return [...prev, simbolo];
      }
    });
  }, []);

  // ORDENAMIENTO ALFABÉTICO: A-Z por símbolo, pero favoritos primero
  const bvcOrdenada = [...(bvc ?? [])]
    .filter((accion: BVCData) => {
      if (showOnlyFavorites) {
        return favoriteSymbols.includes(accion.simbolo);
      }
      return true;
    })
    .sort((a, b) => {
      const aIsFavorite = favoriteSymbols.includes(a.simbolo);
      const bIsFavorite = favoriteSymbols.includes(b.simbolo);
      
      // Si uno es favorito y el otro no, el favorito va primero
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // Si ambos son favoritos o ninguno lo es, orden alfabético
      return a.simbolo.localeCompare(b.simbolo);
    });
  
  return (
    <div className="space-y-4">
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold">PIZARRA BVC - TERMINAL PROFESIONAL</h3>
          </div>
          <div className="flex items-center gap-3">
            {/* Botón para filtrar favoritos */}
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded border text-[10px] font-mono uppercase tracking-wider transition-all",
                showOnlyFavorites
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'bg-[#0a0a0a] border-[#262626] text-slate-500 hover:text-amber-400 hover:border-amber-500/30'
              )}
              title={showOnlyFavorites ? "Mostrar todos" : "Mostrar solo favoritos"}
            >
              <Star className={cn("w-3.5 h-3.5", showOnlyFavorites ? "fill-amber-400" : "")} />
              {favoriteSymbols.length > 0 && (
                <span>{favoriteSymbols.length}</span>
              )}
            </button>

            <div className="text-xs font-mono text-slate-500">
              {bvc?.length || 0} INSTRUMENTOS
            </div>
            {/* Badge LIVE vinculado al estado del mercado */}
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded border",
              isMarketOpen ? 'bg-emerald-500/10 border-emerald-500/30' :
              marketStatus?.estado === 'Cerrado' ? 'bg-slate-500/10 border-slate-500/30' :
              'bg-amber-500/10 border-amber-500/30'
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", marketStatusColor)} />
              <span className={cn(
                "text-[9px] font-mono",
                isMarketOpen ? 'text-emerald-400' :
                marketStatus?.estado === 'Cerrado' ? 'text-slate-400' :
                'text-amber-400'
              )}>
                {marketStatusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Contenedor con scroll horizontal para responsive */}
        <div className="overflow-x-auto">
          <div className="min-w-[1500px]">
            <table className="w-full">
              <thead>
                <tr className="text-[9px] uppercase tracking-wider text-slate-500 bg-[#0a0a0a] border-b border-[#262626]">
                  <th className="text-left py-3 px-2 font-medium sticky left-0 bg-[#0a0a0a] z-10 w-[180px]">Símbolo</th>
                  <th className="text-center py-3 px-2 font-medium sticky left-[180px] bg-[#0a0a0a] z-10 w-[100px]">Libro de Órdenes</th>
                  <th className="text-center py-3 px-2 font-medium sticky left-[280px] bg-[#0a0a0a] z-10 w-[100px]">Precio (Bs)</th>
                  <th className="text-center py-3 px-2 font-medium sticky left-[380px] bg-[#0a0a0a] z-10 w-[90px]">Precio ($)</th>
                  <th className="text-center py-3 px-2 font-medium w-[100px]">Compra (Vol)</th>
                  <th className="text-center py-3 px-2 font-medium w-[110px]">Precio Compra</th>
                  <th className="text-center py-3 px-2 font-medium w-[90px]">Spread</th>
                  <th className="text-center py-3 px-2 font-medium w-[110px]">Precio Venta</th>
                  <th className="text-center py-3 px-2 font-medium w-[100px]">Venta (Vol)</th>
                  <th className="text-center py-3 px-2 font-medium w-[110px]">Precio Apertura</th>
                  <th className="text-center py-3 px-2 font-medium w-[90px]">Var %</th>
                  <th className="text-center py-3 px-2 font-medium w-[90px]">Var Abs</th>
                  <th className="text-center py-3 px-2 font-medium w-[110px]">Volumen Total</th>
                  <th className="text-center py-3 px-2 font-medium w-[120px]">Efectivo</th>
                  <th className="text-center py-3 px-2 font-medium w-[90px]">Operaciones</th>
                  <th className="text-center py-3 px-2 font-medium w-[100px]">Máximo</th>
                  <th className="text-center py-3 px-2 font-medium w-[100px]">Mínimo</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {bvcOrdenada?.map((accion: BVCData) => {
                  // BLINDAJE: Símbolo seguro con fallback
                  const simbolo = accion.simbolo || 'S/N';
                  const descSimb = accion.desc_simb || 'Sin descripción';
                  const simboloCorto = simbolo.substring(0, 3).toUpperCase();

                  // Determinar si es positivo para el color (maneja null)
                  const isPositive = (accion.variacion_pct ?? 0) >= 0;
                  // Usar precio actual o precio_vta como fallback
                  const precioActual = accion.precio ?? accion.precio_vta ?? accion.precio_compra ?? 0;
                  // PARACAÍDAS MATEMÁTICO: Calcular precio en USD (solo si hay tasa BCV válida)
                  const precioUSD = (tasaBCV && tasaBCV > 0 && precioActual > 0) ? (precioActual / tasaBCV) : null;

                  return (
                    <tr
                      key={simbolo}
                      className="border-b border-[#1a1a1a] hover:bg-[#0a0a0a] transition-colors"
                    >
                      {/* 1. Símbolo (info) con Star Favorite integrada */}
                      <td className="py-2 px-2 sticky left-0 bg-[#0a0a0a] group-hover:bg-[#0a0a0a] z-10">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className={cn(
                              "w-6 h-6 rounded flex items-center justify-center font-bold text-[9px] border flex-shrink-0",
                              isPositive
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                            )}>
                              {simboloCorto}
                            </div>
                            {/* Star Favorite - esquina superior derecha del cuadrado */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(simbolo);
                              }}
                              className={cn(
                                "absolute -top-1 -right-1 p-0.5 rounded transition-colors bg-[#0a0a0a]",
                                favoriteSymbols.includes(simbolo)
                                  ? 'text-amber-400 hover:text-amber-300'
                                  : 'text-slate-600 hover:text-amber-400'
                              )}
                              title={favoriteSymbols.includes(simbolo) ? "Quitar de favoritos" : "Agregar a favoritos"}
                            >
                              <Star className={cn("w-3 h-3", favoriteSymbols.includes(simbolo) ? "fill-amber-400" : "")} />
                            </button>
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-white block">{simbolo}</span>
                            <span className="text-[9px] text-slate-500 truncate block max-w-[100px]" title={descSimb}>{descSimb}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Libro de Órdenes */}
                      <td className="py-2 px-2 text-center sticky left-[180px] bg-[#0a0a0a] group-hover:bg-[#0a0a0a] z-10">
                        <button
                          onClick={() => fetchLibroOrdenes(simbolo)}
                          className="px-2 py-1 text-[9px] bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 rounded transition-colors"
                          title={`Ver libro de órdenes de ${simbolo}`}
                        >
                          📊 Libro
                        </button>
                      </td>

                      {/* 3. Precio (Bs) */}
                      <td className="py-2 px-2 text-center sticky left-[280px] bg-[#0a0a0a] group-hover:bg-[#0a0a0a] z-10">
                        <span className="text-white font-bold font-mono text-xs">{formatValue(precioActual, 2)}</span>
                      </td>

                      {/* 4. Precio ($) - 2 decimales */}
                      <td className="py-2 px-2 text-center sticky left-[380px] bg-[#0a0a0a] group-hover:bg-[#0a0a0a] z-10">
                        <span className="text-slate-400 font-mono text-xs">
                          {precioUSD !== null ? formatValue(precioUSD, 2) : '-'}
                        </span>
                      </td>

                      {/* 6. Compra (Vol) (vol_cmp) - Fondo Verde Vivo Claro Transparente */}
                      <td className="py-2 px-2 text-center bg-emerald-400/15">
                        <span className="text-slate-400 font-mono text-xs">{formatInt(accion.vol_cmp)}</span>
                      </td>

                      {/* 7. Precio Compra (precio_compra) - Fondo Verde Vivo Claro Transparente */}
                      <td className="py-2 px-2 text-center bg-emerald-400/15">
                        <span className="text-slate-400 font-mono text-xs">{formatValue(accion.precio_compra, 2)}</span>
                      </td>

                      {/* 6. Spread % - Solo color de texto: Verde (bueno <10%), Amarillo (regular 10-25%), Rojo (malo >25%) */}
                      <td className="py-2 px-2 text-center">
                        {(() => {
                          const compra = accion.precio_compra ?? 0;
                          const venta = accion.precio_vta ?? 0;
                          const spreadPercent = venta > 0 && compra > 0 ? ((venta - compra) / compra) * 100 : null;
                          
                          // Determinar color del spread
                          let spreadColor = 'text-slate-500';
                          if (spreadPercent !== null && spreadPercent > 0) {
                            if (spreadPercent < 10) {
                              spreadColor = 'text-emerald-400 font-bold';
                            } else if (spreadPercent < 25) {
                              spreadColor = 'text-amber-400 font-bold';
                            } else {
                              spreadColor = 'text-red-400 font-bold';
                            }
                          }
                          
                          return (
                            <span className={cn(
                              "font-mono text-xs",
                              spreadColor
                            )}>
                              {spreadPercent !== null && spreadPercent > 0 ? formatValue(spreadPercent, 2) + ' %' : '-'}
                            </span>
                          );
                        })()}
                      </td>

                      {/* 7. Precio Venta (precio_vta) - Fondo Rojo Vivo Claro Transparente */}
                      <td className="py-2 px-2 text-center bg-red-400/15">
                        <span className="text-slate-400 font-mono text-xs">{formatValue(accion.precio_vta, 2)}</span>
                      </td>

                      {/* 8. Venta (Vol) (vol_vta) - Fondo Rojo Vivo Claro Transparente */}
                      <td className="py-2 px-2 text-center bg-red-400/15">
                        <span className="text-slate-400 font-mono text-xs">{formatInt(accion.vol_vta)}</span>
                      </td>

                      {/* 9. Precio Apertura (precio_apert) */}
                      <td className="py-2 px-2 text-center">
                        <span className="text-slate-300 font-mono text-xs">{formatValue(accion.precio_apert, 2)}</span>
                      </td>

                      {/* 10. Var % (variacion_pct) - Color: Verde si es +, Rojo si es - */}
                      <td className="py-2 px-2 text-center">
                        <span className={cn(
                          "inline-flex items-center justify-center gap-1 font-bold text-xs",
                          isPositive ? 'text-emerald-400' : 'text-red-400'
                        )}>
                          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {formatValue(accion.variacion_pct, 2)}%
                        </span>
                      </td>

                      {/* 11. Var Abs (variacion_abs) - 2 decimales */}
                      <td className="py-2 px-2 text-center">
                        <span className={cn(
                          "font-mono text-xs",
                          isPositive ? 'text-emerald-400/80' : 'text-red-400/80'
                        )}>
                          {formatValue(accion.variacion_abs, 2)}
                        </span>
                      </td>

                      {/* 12. Volumen Total (volumen) */}
                      <td className="py-2 px-2 text-center">
                        <span className="text-slate-400 font-mono text-xs">{formatInt(accion.volumen)}</span>
                      </td>

                      {/* 13. Efectivo (monto_efectivo) */}
                      <td className="py-2 px-2 text-center">
                        <span className="text-slate-300 font-mono text-xs">{formatValue(accion.monto_efectivo, 2)}</span>
                      </td>

                      {/* 14. Operaciones (tot_op_negoc) */}
                      <td className="py-2 px-2 text-center">
                        <span className="text-slate-500 font-mono text-xs">{formatInt(accion.tot_op_negoc)}</span>
                      </td>

                      {/* 15. Máximo (precio_max) */}
                      <td className="py-2 px-2 text-center">
                        <span className="text-slate-400 font-mono text-xs">{formatValue(accion.precio_max, 2)}</span>
                      </td>

                      {/* 16. Mínimo (precio_min) */}
                      <td className="py-2 px-2 text-center">
                        <span className="text-slate-400 font-mono text-xs">{formatValue(accion.precio_min, 2)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// VISTA: CALCULADORA
// ============================================================================

function CalculadoraView({ tasas, bvc }: any) {
  const [tradeTipo, setTradeTipo] = useState<'COMPRA'|'VENTA'>('COMPRA');
  const [tradeAcciones, setTradeAcciones] = useState<number>(1000);
  const [tradePrecio, setTradePrecio] = useState<number>(0);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');

  // Auto-completar precio al seleccionar símbolo
  const handleSymbolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sym = e.target.value;
    setSelectedSymbol(sym);
    if (sym && bvc && bvc.length > 0) {
      const accion = bvc.find((a: any) => a.simbolo === sym);
      if (accion && accion.precio) setTradePrecio(accion.precio);
    }
  };

  // Constantes de comisiones (Aprox 1% total ida o vuelta)
  const COMISION_PCT = 0.01;

  const subtotal = tradeAcciones * (tradePrecio || 0);
  const comision = subtotal * COMISION_PCT;
  const total = tradeTipo === 'COMPRA' ? subtotal + comision : subtotal - comision;

  // Break-even (Para recuperar la inversión al comprar, hay que vender más caro para cubrir 1% entrada y 1% salida)
  const breakEven = (tradePrecio || 0) * (1 + (COMISION_PCT * 2));

  // Impacto Cambiario
  const tasaBinance = tasas?.binance && tasas.binance > 0 ? tasas.binance : (CONFIG.FALLBACK_TASA_BINANCE || 1);
  const tasaBcv = tasas?.bcv && tasas.bcv > 0 ? tasas.bcv : (CONFIG.FALLBACK_TASA_BCV || 1);
  const totalUSDT = total / tasaBinance;
  const totalUSD = total / tasaBcv;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded shadow-lg shadow-emerald-500/20">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">TRADING SIMULATOR PRO</h2>
            <p className="text-slate-500 text-xs font-mono">Cálculo de posiciones con comisiones reales (≈1%)</p>
          </div>
        </div>

        {/* Formulario Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Tipo de Operación */}
            <div className="flex gap-2">
              <button
                onClick={() => setTradeTipo('COMPRA')}
                className={cn(
                  "flex-1 py-3 px-4 rounded font-bold text-xs uppercase tracking-wider transition-all",
                  tradeTipo === 'COMPRA' 
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" 
                    : "bg-[#141414] text-slate-500 border border-[#262626] hover:bg-[#1a1a1a]"
                )}
              >
                Compra (Long)
              </button>
              <button
                onClick={() => setTradeTipo('VENTA')}
                className={cn(
                  "flex-1 py-3 px-4 rounded font-bold text-xs uppercase tracking-wider transition-all",
                  tradeTipo === 'VENTA' 
                    ? "bg-red-500/20 text-red-400 border border-red-500/50" 
                    : "bg-[#141414] text-slate-500 border border-[#262626] hover:bg-[#1a1a1a]"
                )}
              >
                Venta (Short)
              </button>
            </div>

            {/* Selector de Símbolo (Opcional) */}
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-mono uppercase">Ticket (Auto-precio)</label>
              <select
                value={selectedSymbol}
                onChange={handleSymbolChange}
                className="w-full bg-[#141414] border border-[#262626] rounded px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-mono text-slate-300"
              >
                <option value="">Selección manual...</option>
                {bvc && bvc.length > 0 && bvc.map((a: any) => (
                  <option key={a.simbolo} value={a.simbolo}>{a.simbolo} - Bs {formatValue(a.precio, 2)}</option>
                ))}
              </select>
            </div>

            {/* Cantidad y Precio */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-mono uppercase">Acciones</label>
                <input
                  type="number"
                  value={tradeAcciones}
                  onChange={(e) => setTradeAcciones(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#141414] border border-[#262626] rounded px-4 py-3 text-lg font-mono focus:outline-none focus:border-emerald-500/50"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-mono uppercase">Precio Base (Bs)</label>
                <input
                  type="number"
                  value={tradePrecio}
                  onChange={(e) => setTradePrecio(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#141414] border border-[#262626] rounded px-4 py-3 text-lg font-mono focus:outline-none focus:border-emerald-500/50"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Recibo de Operación */}
          <div className="bg-[#141414] border border-[#262626] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase mb-4 border-b border-[#262626] pb-2">Desglose de Operación</p>
              
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Subtotal:</span>
                  <span>{subtotal.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
                </div>
                <div className="flex justify-between items-center text-red-400">
                  <span>Comisión Estimada (1%):</span>
                  <span>{tradeTipo === 'VENTA' ? '-' : '+'}{comision.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
                </div>
                
                <div className="border-t border-[#262626] my-3 pt-3 flex justify-between items-center font-bold text-lg text-white">
                  <span>MONTO NETO:</span>
                  <span>{total.toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#262626] space-y-3">
              <div className="flex justify-between items-center bg-blue-500/10 px-3 py-2 rounded text-blue-400 font-mono text-xs border border-blue-500/20">
                <span>Impacto Cambiario Binance:</span>
                <span className="font-bold">{totalUSDT.toLocaleString('es-VE', {minimumFractionDigits: 2})} USDT</span>
              </div>
              {tradeTipo === 'COMPRA' && (
                <div className="flex justify-between items-center bg-amber-500/10 px-3 py-2 rounded text-amber-400 font-mono text-xs border border-amber-500/20">
                  <span>Break-Even (Precio venta):</span>
                  <span className="font-bold">{breakEven.toLocaleString('es-VE', {minimumFractionDigits: 3})} Bs</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Mercado Secundario / Convertidor Simple */}
      <Card className="p-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-slate-500 font-mono mb-1">TASA BCV</p>
          <p className="text-base font-bold font-mono text-blue-400">{formatValue(tasaBcv, 2)} Bs</p>
        </div>
        <div className="border-x border-[#262626]">
          <p className="text-xs text-slate-500 font-mono mb-1">TASA BINANCE</p>
          <p className="text-base font-bold font-mono text-amber-400">{formatValue(tasaBinance, 2)} Bs</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-mono mb-1">BRECHA P2P</p>
          <p className="text-base font-bold font-mono text-red-400">{formatPercent(tasas?.brecha_binance_pct, 2)}</p>
        </div>
      </Card>
    </div>
  );
}

// ============================================================================
// VISTA: PORTAFOLIO - VERSIÓN MEJORADA
// ============================================================================

function PortafolioView({ patrimonio, mounted, onRefresh, fetchWithRetry, getAuthHeaders, apiUrl }: any) {
  // Lista de símbolos disponibles en la BVC (ordenados A-Z con nombres)
  // Basado en las 35 empresas que cotizan en la Bolsa de Valores de Caracas
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

  // Estados para formulario de agregar/editar
  const [showAdd, setShowAdd] = useState(false);
  const [editPosition, setEditPosition] = useState<any | null>(null);
  const [addTicker, setAddTicker] = useState('');
  const [addCantidad, setAddCantidad] = useState('');
  const [addPrecio, setAddPrecio] = useState('');
  const [addFecha, setAddFecha] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);

  // Estados para histórico de compras
  const [showHistorico, setShowHistorico] = useState<any | null>(null);
  const [historicoData, setHistoricoData] = useState<any>(null);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // Resetear formulario
  const resetForm = () => {
    setAddTicker('');
    setAddCantidad('');
    setAddPrecio('');
    setAddFecha('');
    setAddError('');
    setShowAdd(false);
    setEditPosition(null);
    setShowSymbolDropdown(false);
  };

  // Agregar/Editar posición
  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);
    try {
      const body: any = {
        ticker: addTicker.toUpperCase().trim(),
        cantidad: parseFloat(addCantidad),
        precio_compra: parseFloat(addPrecio),
        fecha_compra: addFecha || undefined,
      };

      const url = editPosition
        ? `${apiUrl}/api/portafolio/${editPosition.id}`
        : `${apiUrl}/api/portafolio`;
      const method = editPosition ? 'PUT' : 'POST';

      console.log('[Portafolio] Enviando petición:', method, url, body);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(body),
      });

      console.log('[Portafolio] Status:', response.status);
      
      const data = await response.json();
      console.log('[Portafolio] Respuesta:', data);

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Error al guardar posición');
      }

      resetForm();
      await onRefresh?.();
    } catch (err: unknown) {
      console.error('[Portafolio] Error:', err);
      setAddError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setAddLoading(false);
    }
  };

  // Eliminar posición
  const handleDeletePosition = async (id: number) => {
    console.log('[Eliminar] Eliminando ID:', id);
    try {
      const response = await fetch(`${apiUrl}/api/portafolio/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      console.log('[Eliminar] Status:', response.status);
      
      if (response.ok) {
        await onRefresh?.();
      } else {
        const error = await response.json();
        console.error('[Eliminar] Error:', error);
      }
    } catch (err: unknown) {
      console.error('[Eliminar] Error:', err);
    }
  };

  // Abrir edición
  const handleOpenEdit = (pos: any) => {
    console.log('[Editar] Posición recibida:', pos);
    setEditPosition({ 
      id: pos.id || pos.portafolio_id,
      ticker: pos.ticker 
    });
    setAddTicker(pos.ticker);
    setAddCantidad(pos.cantidad?.toString() || '');
    setAddPrecio(pos.precio_compra?.toString() || '');
    setAddFecha(pos.fecha_compra || '');
    setShowAdd(true);
  };

  // Ver histórico de compras
  const handleVerHistorico = async (ticker: string) => {
    setLoadingHistorico(true);
    try {
      const data = await fetchWithRetry(`${apiUrl}/api/portafolio/historico/${ticker}`, {
        headers: getAuthHeaders(),
      });
      setHistoricoData(data);
      setShowHistorico(ticker);
    } catch (err) {
      console.error('Error al cargar histórico:', err);
    } finally {
      setLoadingHistorico(false);
    }
  };

  // Cerrar modal de histórico
  const closeHistorico = () => {
    setShowHistorico(null);
    setHistoricoData(null);
  };

  const roiColor = (patrimonio?.roi_pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400';
  const RoiIcon = (patrimonio?.roi_pct || 0) >= 0 ? TrendingUp : ArrowDownRight;
  const gainLossColor = (patrimonio?.ganancia_perdida || 0) >= 0 ? 'text-emerald-400' : 'text-red-400';

  // Vista cuando está vacío
  if (!patrimonio?.detalles?.length && !showAdd) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Card className="p-8 text-center">
          <PieChart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Tu portafolio está vacío</h3>
          <p className="text-slate-400 mb-6">Comienza agregando tu primera posición.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold text-white transition-colors"
          >
            + Agregar posición
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Modal Histórico de Compras */}
      {showHistorico && historicoData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Histórico: {showHistorico}
              </h3>
              <button onClick={closeHistorico} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-[#141414] p-3 rounded">
                  <p className="text-slate-500 text-xs">Total Invertido</p>
                  <p className="font-mono font-bold">{formatValue(historicoData.total_invertido, 2)} Bs</p>
                </div>
                <div className="bg-[#141414] p-3 rounded">
                  <p className="text-slate-500 text-xs">Cantidad Total</p>
                  <p className="font-mono font-bold">{formatValue(historicoData.total_cantidad, 4)}</p>
                </div>
                <div className="bg-[#141414] p-3 rounded">
                  <p className="text-slate-500 text-xs">Precio Promedio</p>
                  <p className="font-mono font-bold text-blue-400">{formatValue(historicoData.precio_promedio, 4)} Bs</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[10px] text-slate-500 border-b border-[#262626] uppercase font-mono">
                    <tr>
                      <th className="text-left py-2">Fecha</th>
                      <th className="text-right py-2">Cantidad</th>
                      <th className="text-right py-2">Precio</th>
                      <th className="text-right py-2">Total</th>
                      <th className="text-right py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    {historicoData.compras?.map((compra: any) => (
                      <tr key={compra.id} className="hover:bg-[#141414]">
                        <td className="py-2 text-slate-300">{compra.fecha_compra || 'N/A'}</td>
                        <td className="py-2 text-right font-mono">{formatValue(compra.cantidad, 0)}</td>
                        <td className="py-2 text-right font-mono text-slate-400">{formatValue(compra.precio_compra, 4)} Bs</td>
                        <td className="py-2 text-right font-mono font-bold">{formatValue((compra.cantidad * compra.precio_compra), 2)} Bs</td>
                        <td className="py-2 text-right">
                          <button
                            onClick={async () => {
                              if (!confirm('¿Eliminar esta compra?')) return;
                              await fetchWithRetry(`${apiUrl}/api/portafolio/compra/${compra.id}`, { method: 'DELETE', headers: getAuthHeaders() });
                              handleVerHistorico(showHistorico);
                              await onRefresh?.();
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
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
          </Card>
        </div>
      )}

      {/* Formulario Agregar/Editar posición */}
      {showAdd && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">{editPosition ? 'Editar posición' : 'Agregar posición'}</h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-white text-xl">×</button>
          </div>
          <form onSubmit={handleSavePosition} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Selector de Símbolo con Dropdown - Ocupa 2 columnas */}
            <div className="sm:col-span-2 relative">
              <label className="block text-xs text-slate-500 mb-1">Activo *</label>
              <div className="relative">
                <input
                  type="text"
                  value={addTicker}
                  onChange={(e) => {
                    setAddTicker(e.target.value.toUpperCase());
                    setShowSymbolDropdown(true);
                  }}
                  onFocus={() => setShowSymbolDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSymbolDropdown(false), 200)}
                  placeholder={editPosition ? "No editable" : "BUSCAR SÍMBOLO..."}
                  required
                  readOnly={!!editPosition}
                  className={cn(
                    "w-full bg-[#1a1a1a] border rounded px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none uppercase",
                    editPosition
                      ? "border-slate-600 text-slate-400 cursor-not-allowed"
                      : "border-[#262626] focus:border-emerald-500"
                  )}
                />
                {showSymbolDropdown && !editPosition && (
                  <div className="absolute z-50 w-full mt-1 bg-[#141414] border border-[#262626] rounded max-h-48 overflow-y-auto shadow-xl">
                    {BVC_SYMBOLS
                      .filter(sym => sym.symbol.toLowerCase().includes(addTicker.toLowerCase()))
                      .map(sym => (
                        <button
                          key={sym.symbol}
                          type="button"
                          onClick={() => {
                            setAddTicker(sym.symbol);
                            setShowSymbolDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-400 transition-colors flex items-center justify-between"
                        >
                          <div className="flex flex-col">
                            <span className="font-mono font-bold">{sym.symbol}</span>
                            <span className="text-xs text-slate-500">{sym.name}</span>
                          </div>
                          <span className="text-xs text-slate-500">Seleccionar</span>
                        </button>
                      ))}
                    {BVC_SYMBOLS.filter(sym => sym.symbol.toLowerCase().includes(addTicker.toLowerCase())).length === 0 && (
                      <div className="px-3 py-2 text-sm text-slate-500">No hay coincidencias</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Cantidad *</label>
              <input
                type="number"
                value={addCantidad}
                onChange={(e) => setAddCantidad(e.target.value)}
                min="0"
                step="0.01"
                required
                className="w-full bg-[#1a1a1a] border border-[#262626] rounded px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Precio Compra (Bs) *</label>
              <input
                type="number"
                value={addPrecio}
                onChange={(e) => setAddPrecio(e.target.value)}
                min="0"
                step="0.01"
                required
                className="w-full bg-[#1a1a1a] border border-[#262626] rounded px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Fecha Compra</label>
              <input
                type="date"
                value={addFecha}
                onChange={(e) => setAddFecha(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#262626] rounded px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-slate-400 hover:text-white text-sm border border-[#262626] rounded hover:bg-[#141414] transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={addLoading} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium disabled:opacity-50 transition-colors">
                {addLoading ? 'Guardando...' : editPosition ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
            {addError && <span className="sm:col-span-3 text-red-400 text-sm">{addError}</span>}
          </form>
        </Card>
      )}

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="w-16 h-16" />
          </div>
          <p className="text-xs text-slate-400 mb-1 font-mono uppercase">Mercado Actual (BS)</p>
          <p className="text-3xl font-bold text-white font-mono mb-2">
            {patrimonio.total_ves?.toLocaleString('es-VE', { minimumFractionDigits: 2 }) ?? '0.00'}
          </p>
          <div className={cn("inline-flex items-center gap-1 text-sm font-bold bg-[#141414] px-2 py-1 rounded border border-[#262626]", roiColor)}>
            <RoiIcon size={14} />
            <span>ROI: {formatPercent(patrimonio.roi_pct, 2)}</span>
          </div>
        </Card>

        <Card className="p-5 border-blue-500/20 bg-blue-500/5">
          <p className="text-xs text-slate-400 mb-1 font-mono uppercase">Valor USD (BCV)</p>
          <p className="text-2xl font-bold text-blue-400 font-mono mb-2">
            {patrimonio.total_usd?.toLocaleString('es-VE', { minimumFractionDigits: 2 }) ?? '0.00'}
          </p>
          <p className="text-xs text-slate-500 font-mono">Tasa: {formatValue(patrimonio.tasa_bcv_usada, 2)} Bs</p>
        </Card>

        <Card className="p-5 border-amber-500/20 bg-amber-500/5">
          <p className="text-xs text-slate-400 mb-1 font-mono uppercase">Valor USDT (P2P)</p>
          <p className="text-2xl font-bold text-amber-400 font-mono mb-2">
            {patrimonio.total_usdt?.toLocaleString('es-VE', { minimumFractionDigits: 2 }) ?? '0.00'}
          </p>
          <p className="text-xs text-slate-500 font-mono">Tasa: {formatValue(patrimonio.tasa_binance_usada, 2)} Bs</p>
        </Card>

        <Card className={cn("p-5 border-2 relative overflow-hidden", gainLossColor, patrimonio?.ganancia_perdida >= 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5')}>
          <p className="text-xs text-slate-400 mb-1 font-mono uppercase">Ganancia/Pérdida</p>
          <p className={cn("text-2xl font-bold font-mono mb-2", gainLossColor)}>
            {(patrimonio?.ganancia_perdida ?? 0) >= 0 ? '+' : ''}{patrimonio?.ganancia_perdida?.toLocaleString('es-VE', { minimumFractionDigits: 2 }) ?? '0.00'} Bs
          </p>
          <p className="text-xs text-slate-500 font-mono">Inversión: {patrimonio?.total_inversion?.toLocaleString('es-VE', {minimumFractionDigits: 2}) ?? '0.00'} Bs</p>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => { resetForm(); setShowAdd(true); }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span className="text-lg">+</span> Agregar Posición
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Pie Chart */}
        <Card className="p-4 lg:col-span-3">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            DISTRIBUCIÓN
          </h3>
          <div className="h-64 min-h-[220px]">
            {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie data={patrimonio.detalles}>
                <Pie
                  data={patrimonio.detalles}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="valor_usdt"
                  nameKey="ticker"
                  stroke="none"
                >
                  {patrimonio.detalles.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '4px', fontSize: '11px' }}
                  formatter={(value: any) => [`${formatValue(Number(value), 2)} USDT`, "Valor"]}
                />
              </RechartsPie>
            </ResponsiveContainer>
            ) : null}
          </div>
        </Card>

        {/* Holdings List */}
        <Card className="p-4 lg:col-span-9 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              POSICIONES ACTIVAS
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead className="text-[10px] text-slate-500 border-b border-[#262626] uppercase font-mono tracking-wider">
                <tr>
                  <th className="text-left py-3 px-2">Activo</th>
                  <th className="text-center py-3 px-2">Acciones</th>
                  <th className="text-center py-3 px-2">Precio Compra</th>
                  <th className="text-center py-3 px-2">Precio Act</th>
                  <th className="text-center py-3 px-2">%</th>
                  <th className="text-center py-3 px-2">Monto Bs</th>
                  <th className="text-center py-3 px-2">Monto $</th>
                  <th className="text-center py-3 px-2">Monto USDT</th>
                  <th className="text-center py-3 px-2">Monto Invertido</th>
                  <th className="text-center py-3 px-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {patrimonio.detalles.map((item: any, idx: number) => {
                  const glColor = (item.gain_loss_pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400';
                  const GLOrrow = (item.gain_loss_pct || 0) >= 0 ? ArrowUpRight : ArrowDownRight;
                  const tasaBinance = patrimonio.tasa_binance_usada || 1;
                  const montoInvertido = (item.cantidad || 0) * (item.precio_promedio_compra || 0);
                  const montoValorActual = (item.cantidad || 0) * (item.precio_bvc || 0);
                  const montoUsd = montoValorActual / patrimonio.tasa_bcv_usada || 1;
                  const montoUsdt = montoValorActual / tasaBinance;
                  return (
                    <tr key={item.ticker} className="hover:bg-[#141414] transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                          <span className="font-bold text-white">{item.ticker}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-slate-300">
                        {Math.floor(item.cantidad || 0)}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-slate-400">
                        {formatValue(item.precio_promedio_compra, 2)} Bs
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-slate-400">
                        {formatValue(item.precio_bvc, 2)} Bs
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className={cn("inline-flex items-center gap-1 font-mono font-semibold", glColor)}>
                          <GLOrrow size={12} />
                          <span className="text-base">{formatPercent(item.gain_loss_pct, 2)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-mono">
                        <span className={cn(glColor, "font-semibold text-base")}>{formatValue(montoValorActual, 2)} Bs</span>
                      </td>
                      <td className="py-3 px-2 text-center font-mono">
                        <span className={cn(glColor, "font-semibold text-base")}>${formatValue(montoUsd, 2)}</span>
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-slate-300">
                        {formatValue(montoUsdt, 2)}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-slate-400">
                        {formatValue(montoInvertido, 2)} Bs
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2 justify-center">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600/30 transition-colors"
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                          </button>
                          <button
                            onClick={() => {
                              const id = item.id || item.portafolio_id;
                              console.log('[Eliminar] ID:', id);
                              if (id) handleDeletePosition(id);
                            }}
                            className="p-1.5 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
                            title="Eliminar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

