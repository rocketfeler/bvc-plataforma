/**
 * Hook personalizado para Socket.IO
 * Maneja la conexión WebSocket y los eventos del backend
 */

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { TasasData, BVCData } from '@/app/types';

interface Noticia {
  titular: string;
  contenido: string;
  fecha: string;
}

interface UseSocketOptions {
  apiUrl: string;
  onTasasUpdate?: (data: TasasData) => void;
  onBvcUpdate?: (data: BVCData[]) => void;
  onMarketStatusUpdate?: (data: any) => void;
  onNoticiasUpdate?: (data: Noticia[]) => void;
}

interface UseSocketReturn {
  connected: boolean;
  socket: Socket | null;
  error: string | null;
  lastUpdate: Date | null;
}

export function useSocket({
  apiUrl,
  onTasasUpdate,
  onBvcUpdate,
  onMarketStatusUpdate,
  onNoticiasUpdate,
}: UseSocketOptions): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Usar refs para las callbacks para evitar que disparen el efecto
  const onTasasUpdateRef = useRef(onTasasUpdate);
  const onBvcUpdateRef = useRef(onBvcUpdate);
  const onMarketStatusUpdateRef = useRef(onMarketStatusUpdate);
  const onNoticiasUpdateRef = useRef(onNoticiasUpdate);

  // Actualizar refs cuando las callbacks cambien
  useEffect(() => {
    onTasasUpdateRef.current = onTasasUpdate;
  }, [onTasasUpdate]);

  useEffect(() => {
    onBvcUpdateRef.current = onBvcUpdate;
  }, [onBvcUpdate]);

  useEffect(() => {
    onMarketStatusUpdateRef.current = onMarketStatusUpdate;
  }, [onMarketStatusUpdate]);

  useEffect(() => {
    onNoticiasUpdateRef.current = onNoticiasUpdate;
  }, [onNoticiasUpdate]);

  useEffect(() => {
    // URL base del backend
    const baseUrl = apiUrl;

    console.log('[Socket.IO] Conectando a:', baseUrl);

    // Crear conexión Socket.IO con path sincronizado
    socketRef.current = io(baseUrl, {
      // PATH CRÍTICO: Debe coincidir con el servidor
      path: '/ws/socket.io',
      // Transportes: websocket primero, polling como fallback
      transports: ['websocket', 'polling'],
      // Reconexión
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      // Timeout
      timeout: 10000,
      // Auth
      auth: {
        client: 'frontend',
      },
      // Forzar WebSocket sin upgrade
      upgrade: true,
    });

    // Evento: Conexión establecida
    socketRef.current.on('connect', () => {
      console.log('[Socket.IO] ✓ Conectado:', socketRef.current?.id);
      setConnected(true);
      setError(null);
    });

    // Evento: Desconexión
    socketRef.current.on('disconnect', (reason) => {
      console.warn('[Socket.IO] ✗ Desconectado:', reason);
      setConnected(false);
    });

    // Evento: Error
    socketRef.current.on('connect_error', (err) => {
      console.error('[Socket.IO] Error:', err.message);
      setError(`WebSocket: ${err.message}`);
      setConnected(false);
    });

    // Evento: tasas_update
    socketRef.current.on('tasas_update', (data: TasasData) => {
      console.log('[Socket.IO] Tasas:', data);
      if (data?.bcv !== undefined) {
        onTasasUpdateRef.current?.(data);
        setLastUpdate(new Date());
      }
    });

    // Evento: bvc_update
    socketRef.current.on('bvc_update', (data: BVCData[]) => {
      console.log('[Socket.IO] BVC:', data?.length, 'símbolos');
      if (data && Array.isArray(data) && data.length > 0) {
        onBvcUpdateRef.current?.(data);
        setLastUpdate(new Date());
      }
    });

    // Evento: market_resumen (resumen general del mercado)
    socketRef.current.on('market_resumen', (data: any) => {
      if (data?.estado) {
        onMarketStatusUpdateRef.current?.(data);
      }
    });

    // Evento: market_status_update (estado Abierto/Cerrado desde serverDataEstado)
    socketRef.current.on('market_status_update', (data: any) => {
      if (data && typeof data.estado === 'string') {
        onMarketStatusUpdateRef.current?.(data);
      }
    });

    // Evento: noticias_update (centralizado aquí, ya no en NewsTicker)
    socketRef.current.on('noticias_update', (data: any) => {
      console.log('[Socket.IO] Noticias:', data?.length, 'noticias');
      if (Array.isArray(data) && data.length > 0) {
        const validNoticias = data.filter((n: any) =>
          n && typeof n.titular === 'string' && n.titular.trim() !== ''
        );
        if (validNoticias.length > 0) {
          onNoticiasUpdateRef.current?.(validNoticias);
        }
      }
    });

    // Evento: getNoticias (respuesta directa del backend)
    socketRef.current.on('getNoticias', (data: any) => {
      console.log('[Socket.IO] getNoticias:', data?.length, 'noticias');
      if (Array.isArray(data) && data.length > 0) {
        const validNoticias = data.filter((n: any) =>
          n && typeof n.titular === 'string' && n.titular.trim() !== ''
        );
        if (validNoticias.length > 0) {
          onNoticiasUpdateRef.current?.(validNoticias);
        }
      }
    });

    // Cleanup
    return () => {
      console.log('[Socket.IO] Cleanup...');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [apiUrl]); // Solo apiUrl como dependencia

  return {
    connected,
    socket: socketRef.current,
    error,
    lastUpdate,
  };
}
