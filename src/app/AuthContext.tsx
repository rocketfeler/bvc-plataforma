'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CONFIG } from '@/components/utils';

export interface User {
  id: number;
  email: string;
  nombre?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nombre?: string) => Promise<void>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
  validateToken: () => Promise<boolean>;
  clearSessionOnError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'bvc_token';
const USER_KEY = 'bvc_user';

/**
 * Verifica si un token JWT está expirado
 * Los tokens JWT tienen formato: header.payload.signature
 * El payload contiene el campo 'exp' con el timestamp de expiración
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    
    // Decodificar base64url a base64 estándar
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    const payloadObj = JSON.parse(decoded);
    
    // Verificar expiración (exp está en segundos, Date.now() en ms)
    if (payloadObj.exp) {
      const now = Date.now() / 1000;
      return now >= payloadObj.exp;
    }
    return false;
  } catch {
    return true; // Si no podemos parsear, asumimos expirado
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      
      if (storedToken && storedUser) {
        // Verificar si el token está expirado antes de usarlo
        if (!isTokenExpired(storedToken)) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          console.log('[Auth] Sesión restaurada desde localStorage');
        } else {
          // Token expirado, limpiar sesión silenciosamente
          console.log('[Auth] Token expirado, limpiando sesión');
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
    } catch (error) {
      // Solo limpiar si hay error de parseo (datos corruptos)
      console.error('[Auth] Error restaurando sesión:', error);
      // NO limpiar automáticamente - intentar en el próximo load
    } finally {
      setLoading(false);
    }
  }, []);

  // URL centralizada desde CONFIG (utils.ts) — una sola fuente de verdad
  const apiUrl = CONFIG.API_URL;

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al iniciar sesión');
    }
    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    // Limpiar caché de patrimonio de otros usuarios
    localStorage.removeItem('bvc_patrimonio');
  }, [apiUrl]);

  const register = useCallback(async (email: string, password: string, nombre?: string) => {
    const res = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nombre }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al registrarse');
    }
    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    localStorage.removeItem('bvc_patrimonio');
  }, [apiUrl]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('bvc_patrimonio');
  }, []);

  /**
   * Limpia la sesión solo cuando hay un error 401 confirmado (token inválido)
   * NO usar para errores de conexión o timeout
   */
  const clearSessionOnError = useCallback(() => {
    console.log('[Auth] Limpiando sesión por error 401');
    logout();
  }, [logout]);

  /**
   * Valida el token actual haciendo una petición al backend
   * Retorna true si el token es válido, false si está expirado o inválido
   * NO limpia la sesión automáticamente
   */
  const validateToken = useCallback(async (): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const res = await fetch(`${apiUrl}/api/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        return true; // Token válido
      }
      
      if (res.status === 401) {
        // Token inválido o expirado
        return false;
      }
      
      // Otros errores (503, 500, etc.) - backend puede estar reiniciándose
      // NO invalidar el token, mantener sesión
      console.warn('[Auth] Backend no disponible, manteniendo sesión');
      return true;
    } catch (error) {
      // Error de red - backend caído o sin conexión
      // NO invalidar el token, mantener sesión
      console.warn('[Auth] Error de conexión, manteniendo sesión:', error);
      return true;
    }
  }, [token, apiUrl]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      login, 
      register, 
      logout, 
      getAuthHeaders,
      validateToken,
      clearSessionOnError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
