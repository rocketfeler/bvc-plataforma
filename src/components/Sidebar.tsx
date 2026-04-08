'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Layers, Calculator, PieChart, AlertCircle, Download,
  BarChart3, Menu, X, ChevronDown, ChevronRight
} from 'lucide-react';
import { cn } from '@/components';

// ============================================================================
// TIPOS
// ============================================================================

export type ActiveTab = 'dashboard' | 'pizarra' | 'mercado' | 'calculadora' | 'portafolio' | 'alertas' | 'exportar';

interface SidebarItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

// ============================================================================
// CONFIGURACIÓN DE NAVEGACIÓN
// ============================================================================

const NAVIGATION_SECTIONS: SidebarSection[] = [
  {
    title: 'DATOS',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <Activity size={18} /> },
      { id: 'pizarra', label: 'Pizarra BVC', icon: <Layers size={18} /> },
      { id: 'mercado', label: 'Mercado Resumen', icon: <BarChart3 size={18} /> },
    ],
  },
  {
    title: 'HERRAMIENTAS',
    items: [
      { id: 'calculadora', label: 'Calculadora', icon: <Calculator size={18} /> },
      { id: 'portafolio', label: 'Portafolio', icon: <PieChart size={18} /> },
    ],
  },
  {
    title: 'SISTEMA',
    items: [
      { id: 'alertas', label: 'Alertas', icon: <AlertCircle size={18} /> },
      { id: 'exportar', label: 'Exportar Datos', icon: <Download size={18} /> },
    ],
  },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  collapsed?: boolean;
}

export function Sidebar({ activeTab, onTabChange, collapsed = false }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  // Botón hamburger para móvil
  const MobileToggle = () => (
    <button
      onClick={() => setMobileOpen(!mobileOpen)}
      className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#1a1a1a] border border-[#262626] rounded-lg hover:bg-[#262626] transition-colors"
      aria-label="Toggle menu"
    >
      {mobileOpen ? <X size={20} /> : <Menu size={20} />}
    </button>
  );

  // Overlay para móvil
  const MobileOverlay = () => (
    <AnimatePresence>
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </AnimatePresence>
  );

  return (
    <>
      <MobileToggle />
      <MobileOverlay />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-[#1a1a1a] border-r border-[#262626] z-40 transition-all duration-300 flex flex-col',
          collapsed ? 'w-16' : 'w-60',
          // En móvil: se muestra solo cuando está abierto
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-5 border-b border-[#262626]',
          collapsed && 'justify-center px-2'
        )}>
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent tracking-tight whitespace-nowrap">
                BVC TERMINAL
              </h1>
              <p className="text-[9px] text-slate-500 font-mono tracking-wider whitespace-nowrap">
                BOLSA DE VALORES DE CARACAS
              </p>
            </div>
          )}
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
          {NAVIGATION_SECTIONS.map((section) => {
            const isCollapsed = collapsedSections[section.title];

            return (
              <div key={section.title}>
                {/* Título de sección */}
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="flex items-center gap-1 w-full px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
                  >
                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    <span>{section.title}</span>
                  </button>
                )}

                {/* Items de la sección */}
                <AnimatePresence initial={false}>
                  {(!isCollapsed || collapsed) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1 overflow-hidden"
                    >
                      {section.items.map((item) => {
                        const isActive = activeTab === item.id;

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              onTabChange(item.id);
                              setMobileOpen(false);
                            }}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative',
                              collapsed && 'justify-center px-0',
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-[#262626]/50 border-l-2 border-transparent'
                            )}
                            title={collapsed ? item.label : undefined}
                          >
                            <span className="flex-shrink-0">{item.icon}</span>
                            {!collapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                            {/* Indicador activo */}
                            {isActive && !collapsed && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="absolute right-2 w-1.5 h-1.5 rounded-full bg-emerald-400"
                              />
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="px-4 py-3 border-t border-[#262626]">
            <p className="text-[10px] text-slate-600 font-mono text-center">
              BVC Plataforma v3.2.0
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
