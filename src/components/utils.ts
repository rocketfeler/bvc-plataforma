/**
 * Utilidades compartidas para el frontend
 */

/**
 * Combina clases de forma condicional
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Formatea valores con decimales
 * Formato venezolano: puntos para miles, comas para decimales (ej: 1.234,56)
 */
export function formatValue(val: number | null | undefined, decimals: number = 2): string {
  if (val === null || val === undefined) return '-';
  const num = Number(val);
  if (isNaN(num)) return '-';
  return num.toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Formatea enteros
 * Formato venezolano: puntos para miles (ej: 1.234)
 */
export function formatInt(val: number | null | undefined): string {
  if (val === null || val === undefined) return '-';
  const num = Number(val);
  if (isNaN(num)) return '-';
  return num.toLocaleString('es-VE');
}

/**
 * Formatea porcentajes con signo + o -
 * Formato venezolano: puntos para miles, comas para decimales (ej: +12,34%)
 */
export function formatPercent(val: number | null | undefined, decimals: number = 2): string {
  if (val === null || val === undefined) return '-';
  const num = Number(val);
  if (isNaN(num)) return '-';
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
}

/**
 * Formatea números simples (sin formato venezolano, para valores pequeños como tasas)
 * Usa punto como separador decimal (estándar internacional para tasas)
 */
export function formatSimple(val: number | null | undefined, decimals: number = 2): string {
  if (val === null || val === undefined) return '-';
  const num = Number(val);
  if (isNaN(num)) return '-';
  return num.toFixed(decimals);
}

/**
 * Constantes de configuración
 */
export const CONFIG = {
  // Tasas de fallback cuando la API no está disponible (se pueden sobrescribir con variables de entorno)
  FALLBACK_TASA_BINANCE: typeof process !== 'undefined'
    ? parseFloat(process.env?.NEXT_PUBLIC_FALLBACK_TASA_BINANCE || '647.21')
    : 647.21,

  FALLBACK_TASA_BCV: typeof process !== 'undefined'
    ? parseFloat(process.env?.NEXT_PUBLIC_FALLBACK_TASA_BCV || '448.50')
    : 448.50,

  // Intervalo de refresco de datos (ms) - 30 segundos
  REFRESH_INTERVAL: 30000,

  // Timeout para fetch (ms)
  FETCH_TIMEOUT: 10000,

  // URL de la API - Detecta automáticamente el entorno
  API_URL: typeof process !== 'undefined'
    ? (
        process.env?.NEXT_PUBLIC_API_URL || 
        // En producción (Vercel), usar Hugging Face Spaces
        (process.env?.VERCEL ? 'https://rocketfeler-bvc-plataforma-api.hf.space' : null) ||
        // En desarrollo, usar localhost
        'http://localhost:7860'
      )
    : 'http://localhost:7860',
} as const;

/**
 * Colores para gráficos y UI
 */
export const CHART_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
] as const;
