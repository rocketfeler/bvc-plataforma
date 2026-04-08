/**
 * Design Tokens para BVC Plataforma
 * Paleta esmeralda/cyan inspirada en el pulido visual de Mercosur
 */

// ─── Colores ───────────────────────────────────────────────────────────────

export const colors = {
  // Fondos
  background: '#0a0a0a',
  surface: '#141414',
  surfaceElevated: '#1a1a1a',
  surfaceHover: '#1f1f1f',

  // Bordes
  border: '#262626',
  borderHover: '#333333',
  borderActive: '#404040',

  // Primario - Emerald
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // emerald principal
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // Acento - Cyan
  accent: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4', // cyan principal
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },

  // Texto
  text: {
    primary: '#ededed',
    secondary: '#a1a1aa',
    muted: '#71717a',
    disabled: '#52525b',
  },

  // Estados
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Gradientes
  gradients: {
    primary: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    surface: 'linear-gradient(180deg, #141414 0%, #0f0f0f 100%)',
    glow: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
  },
} as const;

// ─── Espaciado ─────────────────────────────────────────────────────────────

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
} as const;

// ─── Bordes ────────────────────────────────────────────────────────────────

export const borders = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  full: '9999px',
} as const;

// ─── Sombras ───────────────────────────────────────────────────────────────

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
  glow: '0 0 20px rgba(16, 185, 129, 0.15)',
  glowCyan: '0 0 20px rgba(6, 182, 212, 0.15)',
  glowLg: '0 0 40px rgba(16, 185, 129, 0.25)',
} as const;

// ─── Transiciones ──────────────────────────────────────────────────────────

export const transitions = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// ─── Tipografía ────────────────────────────────────────────────────────────

export const typography = {
  sizes: {
    xs: '11px',
    sm: '12px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '30px',
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  tracking: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ─── Z-Index ───────────────────────────────────────────────────────────────

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
} as const;

// ─── Utilidades para generar clases CSS ────────────────────────────────────

export const designTokens = {
  colors,
  spacing,
  borders,
  shadows,
  transitions,
  typography,
  zIndex,
} as const;

export type DesignTokens = typeof designTokens;
