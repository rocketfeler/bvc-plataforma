/**
 * Hook para hacer peticiones fetch con reintentos y manejo de errores
 * Diferencia entre errores de conexión (backend caído) y errores 401 (token inválido)
 */

import { useCallback } from 'react';
import { useAuth } from '@/app/AuthContext';

interface FetchWithRetryOptions {
  maxRetries?: number;
  retryDelay?: number; // ms
  onAuthError?: () => void; // Callback cuando el token es inválido (401)
}

interface FetchWithRetryReturn {
  /**
   * Hace una petición fetch con reintentos automáticos
   * - Reintenta en errores de red o 5xx (backend reiniciándose)
   * - NO reintenta en 401 (token inválido)
   * - Retorna null después de máximos reintentos fallidos
   */
  fetchWithRetry: <T = any>(
    url: string,
    options?: RequestInit
  ) => Promise<T | null>;
}

/**
 * Duerme por la cantidad de ms especificados
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verifica si un error es de red (backend caído, timeout, etc.)
 */
function isNetworkError(error: unknown): boolean {
  // TypeError con "Failed to fetch" es error de red
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  // Error con mensaje de red
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('network') || 
           msg.includes('timeout') || 
           msg.includes('failed to fetch') ||
           msg.includes('load failed');
  }
  return false;
}

/**
 * Hook para hacer peticiones con reintentos inteligentes
 */
export function useFetchWithRetry({
  maxRetries = 3,
  retryDelay = 1000, // 1 segundo base
}: FetchWithRetryOptions = {}): FetchWithRetryReturn {
  const { getAuthHeaders, clearSessionOnError } = useAuth();

  const fetchWithRetry = useCallback(async <T = any>(
    url: string,
    options?: RequestInit
  ): Promise<T | null> => {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const headers = {
          ...getAuthHeaders(),
          ...options?.headers,
        };

        const response = await fetch(url, {
          ...options,
          headers,
        });

        // Manejar respuesta HTTP
        if (response.ok) {
          return await response.json();
        }

        // Error 401: Token inválido o expirado - NO reintentar
        if (response.status === 401) {
          console.error('[Fetch] Error 401: Token inválido');
          clearSessionOnError();
          return null;
        }

        // Error 4xx (excepto 401): Error del cliente - NO reintentar
        if (response.status >= 400 && response.status < 500) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`[Fetch] Error ${response.status}:`, errorData);
          return null;
        }

        // Error 5xx: Error del servidor - reintentar (backend puede estar reiniciándose)
        if (response.status >= 500) {
          lastError = new Error(`Server error: ${response.status}`);
          console.warn(`[Fetch] Error ${response.status}, intento ${attempt}/${maxRetries}`);
          
          if (attempt < maxRetries) {
            // Backoff exponencial: 1s, 2s, 4s...
            await sleep(retryDelay * Math.pow(2, attempt - 1));
            continue;
          }
        }

        // Otros errores
        lastError = new Error(`HTTP error: ${response.status}`);
        return null;

      } catch (error) {
        lastError = error;

        // Verificar si es error de red
        if (isNetworkError(error)) {
          console.warn(`[Fetch] Error de red, intento ${attempt}/${maxRetries}:`, error);
          
          if (attempt < maxRetries) {
            // Backoff exponencial para errores de red
            await sleep(retryDelay * Math.pow(2, attempt - 1));
            continue;
          }
        }

        // Error no es de red, no reintentar
        console.error('[Fetch] Error:', error);
        return null;
      }
    }

    // Se agotaron los reintentos
    console.error('[Fetch] Máximos reintentos alcanzados');
    return null;
  }, [maxRetries, retryDelay, getAuthHeaders, clearSessionOnError]);

  return { fetchWithRetry };
}
