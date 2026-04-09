'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  // Cerrar sidebar móvil con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
        mobileToggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  // Trap focus en sidebar móvil cuando está abierto
  useEffect(() => {
    if (!mobileOpen || !sidebarRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      const focusableElements = sidebarRef.current!.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [mobileOpen]);

  // Focus en el primer elemento cuando se abre la sidebar móvil
  useEffect(() => {
    if (mobileOpen && sidebarRef.current) {
      const firstButton = sidebarRef.current.querySelector('button');
      firstButton?.focus();
    }
  }, [mobileOpen]);

  // Botón hamburger para móvil - solo visible en mobile
  const MobileToggle = () => (
    <button
      ref={mobileToggleRef}
      onClick={() => setMobileOpen(!mobileOpen)}
      className="lg:hidden fixed top-3 left-3 z-50 p-2.5 bg-[#1a1a1a] border border-[#262626] rounded-lg hover:bg-[#262626] transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
      aria-label={mobileOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
      aria-expanded={mobileOpen}
      aria-controls="main-sidebar"
    >
      {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
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
          aria-hidden="true"
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
        ref={sidebarRef}
        id="main-sidebar"
        role="navigation"
        aria-label="Navegación principal de la terminal BVC"
        className={cn(
          // Desktop: parte del layout flex (no fixed), ocupa todo el alto
          'hidden lg:flex lg:flex-col lg:flex-shrink-0 lg:bg-[#1a1a1a] lg:border-r lg:border-[#262626] lg:z-40 lg:transition-all lg:duration-300',
          collapsed ? 'lg:w-16' : 'lg:w-60',
          // Mobile: drawer overlay con fixed position
          'fixed top-0 left-0 h-full bg-[#1a1a1a] border-r border-[#262626] z-40 transition-all duration-300 flex flex-col',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-5 border-b border-[#262626]',
          collapsed && 'justify-center px-2'
        )}>
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <Activity className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent tracking-tight whitespace-nowrap">
                BVC TERMINAL
              </h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider whitespace-nowrap">
                BOLSA DE VALORES DE CARACAS
              </p>
            </div>
          )}
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4" aria-label="Secciones de navegación">
          {NAVIGATION_SECTIONS.map((section) => {
            const isCollapsed = collapsedSections[section.title];

            return (
              <div key={section.title}>
                {/* Título de sección */}
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="flex items-center gap-1 w-full px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#1a1a1a] rounded"
                    aria-expanded={!isCollapsed}
                    aria-controls={`section-${section.title}`}
                  >
                    {isCollapsed ? <ChevronRight size={12} aria-hidden="true" /> : <ChevronDown size={12} aria-hidden="true" />}
                    <span>{section.title}</span>
                  </button>
                )}

                {/* Items de la sección */}
                <AnimatePresence initial={false}>
                  {(!isCollapsed || collapsed) && (
                    <motion.div
                      id={`section-${section.title}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1 overflow-hidden"
                      role="list"
                      aria-label={`Items de ${section.title}`}
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
                            role="listitem"
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative',
                              collapsed && 'justify-center px-0',
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-[#262626]/50 border-l-2 border-transparent'
                            )}
                            title={collapsed ? item.label : undefined}
                            aria-current={isActive ? 'page' : undefined}
                            aria-label={item.label}
                          >
                            <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>
                            {!collapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                            {/* Indicador activo */}
                            {isActive && !collapsed && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="absolute right-2 w-1.5 h-1.5 rounded-full bg-emerald-400"
                                aria-hidden="true"
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
