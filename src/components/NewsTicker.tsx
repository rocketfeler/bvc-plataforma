'use client';

import React from 'react';
import { Volume2 } from 'lucide-react';

interface Noticia {
  titular: string;
  contenido: string;
  fecha: string;
}

interface NewsTickerProps {
  noticias: Noticia[];
}

/**
 * Ticker de Noticias - Muestra titulares en movimiento
 * REFACTORIZADO: Recibe noticias por props desde page.tsx
 * Eliminada la instancia local de Socket.IO para evitar conexiones duplicadas
 */
export function NewsTicker({ noticias }: NewsTickerProps) {
  // BLINDAJE: No renderizar si no hay noticias
  if (!noticias || noticias.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-[#0a0a0a] border-b border-[#262626] overflow-hidden py-2">
      <div className="flex items-center gap-4">
        {/* Icono fijo */}
        <div className="flex items-center gap-2 px-4 flex-shrink-0">
          <Volume2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Noticias</span>
        </div>

        {/* Cinta de noticias en movimiento */}
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-ticker gap-12 whitespace-nowrap">
            {[...noticias, ...noticias].map((noticia, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs flex-shrink-0">
                <span 
                  className="text-slate-300 font-medium truncate max-w-md" 
                  title={noticia?.titular || ''}
                >
                  {noticia?.titular || 'Sin título'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 60s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
