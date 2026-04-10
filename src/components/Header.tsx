'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw, LogOut, User, ChevronDown, Shield, Activity,
  BarChart3, PieChart, Calculator, AlertCircle, Download, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';
import type { ActiveTab } from '@/app/types';
import type { User as UserType } from '@/app/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

interface HeaderProps {
  user: UserType | null;
  activeTab: ActiveTab;
  marketStatus: { estado: string } | null;
  socketConnected: boolean;
  lastUpdate: Date;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
}

// ============================================================================
// BREADCRUMB CONFIG
// ============================================================================

const TAB_BREADCRUMB: Record<ActiveTab, string> = {
  dashboard: 'Dashboard',
  calculadora: 'Calculadora de Divisas',
  pizarra: 'Pizarra BVC',
  portafolio: 'Mi Portafolio',
  alertas: 'Alertas',
  exportar: 'Exportar Datos',
  mercado: 'Resumen de Mercado',
};

const TAB_ICONS: Record<ActiveTab, React.ReactNode> = {
  dashboard: <Activity size={16} />,
  calculadora: <Calculator size={16} />,
  pizarra: <Layers size={16} />,
  portafolio: <PieChart size={16} />,
  alertas: <AlertCircle size={16} />,
  exportar: <Download size={16} />,
  mercado: <BarChart3 size={16} />,
};

// ============================================================================
// COMPONENTE HEADER — INSTITUCIONAL
// ============================================================================

export function Header({
  user,
  activeTab,
  marketStatus,
  socketConnected,
  lastUpdate,
  loading,
  onRefresh,
  onLogout,
}: HeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    onLogout();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/80 backdrop-blur-xl border-b border-slate-200">
      <div className="h-full px-5 lg:px-6 flex items-center justify-between">
        {/* LADO IZQUIERDO: Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Icono de sección */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              {TAB_ICONS[activeTab]}
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-slate-400 font-medium">BVC</span>
            <ChevronDown size={12} className="text-slate-300 -rotate-90" />
            <span className="text-sm font-semibold text-slate-800 truncate">
              {TAB_BREADCRUMB[activeTab] || 'Dashboard'}
            </span>
          </div>
        </div>

        {/* LADO DERECHO: Status + User */}
        <div className="flex items-center gap-3">
          {/* Estado del Mercado */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className={cn(
              'w-2 h-2 rounded-full',
              marketStatus?.estado === 'Abierto' ? 'bg-emerald-500 animate-pulse' :
              marketStatus?.estado === 'Cerrado' ? 'bg-slate-300' :
              'bg-amber-400'
            )} />
            <span className="text-xs font-medium text-slate-500">
              {marketStatus?.estado || 'Cargando...'}
            </span>
          </div>

          {/* WebSocket */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
            <div className={cn(
              'w-1.5 h-1.5 rounded-full',
              socketConnected ? 'bg-emerald-500' : 'bg-rose-400'
            )} />
            <span>{socketConnected ? 'Conectado' : 'Desconectado'}</span>
          </div>

          {/* Última actualización */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
            <RefreshCw size={10} className={cn(loading && 'animate-spin')} />
            <span>{lastUpdate.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>

          {/* Separador */}
          <div className="hidden lg:block w-px h-5 bg-slate-200" />

          {/* Botón Refresh */}
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
            aria-label="Actualizar datos del mercado"
            title="Actualizar datos"
          >
            <RefreshCw size={16} className={cn(
              'text-slate-400 group-hover:text-emerald-600 transition-colors',
              loading && 'animate-spin'
            )} aria-hidden="true" />
          </button>

          {/* Avatar + Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 pr-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label={`Menú de usuario: ${user?.email || 'Usuario'}`}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <ChevronDown size={12} className={cn(
                'text-slate-400 transition-transform',
                dropdownOpen && 'rotate-180'
              )} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50"
                  role="menu"
                  aria-label="Menú de opciones del usuario"
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {user?.nombre || user?.email || 'Usuario'}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5" title={user?.email}>
                      {user?.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                      role="menuitem"
                      aria-label="Cerrar sesión"
                    >
                      <LogOut size={14} aria-hidden="true" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
