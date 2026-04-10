'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Layers, Calculator, PieChart, AlertCircle, Download,
  BarChart3, Menu, X, ChevronDown, ChevronRight, Rocket
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

  // Botón hamburger para móvil
  const MobileToggle = () => (
    <button
      ref={mobileToggleRef}
      onClick={() => setMobileOpen(!mobileOpen)}
      className="lg:hidden fixed top-3 left-3 z-50 p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      aria-label={mobileOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
      aria-expanded={mobileOpen}
      aria-controls="main-sidebar"
    >
      {mobileOpen ? <X size={20} className="text-slate-600" aria-hidden="true" /> : <Menu size={20} className="text-slate-600" aria-hidden="true" />}
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
          className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30"
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
        aria-label="Navegación principal"
        className={cn(
          'fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-40 transition-all duration-300 flex flex-col',
          collapsed ? 'w-16' : 'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:flex-shrink-0'
        )}
      >
        {/* Logo — Rocketfeler BVC */}
        <div className={cn(
          'flex items-center gap-3 px-5 py-5 border-b border-slate-100',
          collapsed && 'justify-center px-2'
        )}>
          <div className="p-2 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg shadow-sm flex-shrink-0">
            <Rocket className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
                Rocketfeler BVC
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider whitespace-nowrap uppercase">
                Bolsa de Valores de Caracas
              </p>
            </div>
          )}
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5" aria-label="Secciones de navegación">
          {NAVIGATION_SECTIONS.map((section) => {
            const isCollapsed = collapsedSections[section.title];

            return (
              <div key={section.title}>
                {/* Título de sección */}
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="flex items-center gap-1.5 w-full px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors rounded"
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
                      className="space-y-0.5 overflow-hidden mt-1"
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
                              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
                              collapsed && 'justify-center px-0',
                              isActive
                                ? 'bg-slate-100 text-slate-900 font-semibold'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            )}
                            title={collapsed ? item.label : undefined}
                            aria-current={isActive ? 'page' : undefined}
                            aria-label={item.label}
                          >
                            <span className={cn(
                              'flex-shrink-0 transition-colors',
                              isActive ? 'text-emerald-600' : 'text-slate-400'
                            )} aria-hidden="true">
                              {item.icon}
                            </span>
                            {!collapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                            {/* Indicador activo — barra lateral verde */}
                            {isActive && !collapsed && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-600"
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
          <div className="px-4 py-3 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-medium text-center tracking-wider">
              ROCKETFELER v3.2.0
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
