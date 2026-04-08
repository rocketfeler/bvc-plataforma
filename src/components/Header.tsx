'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw, LogOut, User, ChevronDown, Shield, Activity
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

// ============================================================================
// COMPONENTE HEADER
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
    <header className="sticky top-0 z-30 h-14 bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-[#262626] ml-0 lg:ml-60">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* =================================================================== */}
        {/* LADO IZQUIERDO: Breadcrumb + Título */}
        {/* =================================================================== */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Icono de sección */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={cn(
              "w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center",
              activeTab === 'dashboard' && 'bg-blue-500/20 text-blue-400',
              activeTab === 'calculadora' && 'bg-emerald-500/20 text-emerald-400',
              activeTab === 'pizarra' && 'bg-red-500/20 text-red-400',
              activeTab === 'portafolio' && 'bg-amber-500/20 text-amber-400',
              activeTab === 'alertas' && 'bg-purple-500/20 text-purple-400',
              activeTab === 'exportar' && 'bg-cyan-500/20 text-cyan-400',
              activeTab === 'mercado' && 'bg-orange-500/20 text-orange-400',
            )}>
              {activeTab === 'dashboard' && <Activity size={16} />}
              {activeTab === 'calculadora' && <RefreshCw size={16} />}
              {activeTab === 'pizarra' && <Shield size={16} />}
              {activeTab === 'portafolio' && <User size={16} />}
              {activeTab === 'alertas' && <Activity size={16} />}
              {activeTab === 'exportar' && <RefreshCw size={16} />}
              {activeTab === 'mercado' && <Activity size={16} />}
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-slate-500 font-mono">BVC</span>
            <ChevronDown size={12} className="text-slate-600 -rotate-90" />
            <span className="text-sm font-semibold text-white truncate">
              {TAB_BREADCRUMB[activeTab] || 'Dashboard'}
            </span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* LADO DERECHO: Status indicators + User */}
        {/* =================================================================== */}
        <div className="flex items-center gap-3">
          {/* Indicador de Mercado */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#0a0a0a] rounded-md border border-[#262626]">
            <div className={cn(
              "w-2 h-2 rounded-full",
              marketStatus?.estado === 'Abierto' ? 'bg-[var(--success)] animate-pulse' :
              marketStatus?.estado === 'Cerrado' ? 'bg-[var(--text-muted)]' :
              'bg-[var(--warning)]'
            )} />
            <span className="text-[10px] font-mono text-slate-400">
              {marketStatus?.estado || 'Cargando...'}
            </span>
          </div>

          {/* Indicador WebSocket */}
          <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              socketConnected ? 'bg-[var(--success)]' : 'bg-[var(--error)]'
            )} />
            <span className="truncate">{socketConnected ? 'WS ON' : 'WS OFF'}</span>
          </div>

          {/* Última actualización */}
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
            <RefreshCw size={10} className={cn(loading && 'animate-spin')} />
            <span>{lastUpdate.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>

          {/* Separador */}
          <div className="hidden lg:block w-px h-5 bg-[#262626]" />

          {/* Botón Refresh */}
          <button
            onClick={onRefresh}
            className="p-1.5 hover:bg-[#262626] rounded-md transition-colors group focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#1a1a1a]"
            aria-label="Actualizar datos del mercado"
            title="Actualizar datos"
          >
            <RefreshCw size={16} className={cn(
              "text-slate-400 group-hover:text-emerald-400 transition-colors",
              loading && 'animate-spin'
            )} aria-hidden="true" />
          </button>

          {/* Avatar del usuario + Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 pr-2 hover:bg-[#262626] rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#1a1a1a]"
              aria-label={`Menú de usuario: ${user?.email || 'Usuario'}`}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              title={user?.email || 'Usuario'}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <ChevronDown size={12} className={cn(
                "text-slate-400 transition-transform",
                dropdownOpen && 'rotate-180'
              )} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-[#0a0a0a] border border-[#262626] rounded-lg shadow-xl overflow-hidden z-50"
                  role="menu"
                  aria-label="Menú de opciones del usuario"
                >
                  {/* User Info */}
                  <div className="px-3 py-2.5 border-b border-[#262626]">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.nombre || user?.email || 'Usuario'}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5" title={user?.email}>
                      {user?.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1" role="menu" aria-label="Menú de usuario">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-inset"
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
