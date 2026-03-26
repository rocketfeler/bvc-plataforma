'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary para capturar errores en componentes de React
 * Se usa como componente de clase porque los hooks no soportan error boundaries
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Error capturado:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#141414] border border-red-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <h1 className="text-xl font-bold text-white">Error en la Aplicación</h1>
            </div>
            
            <p className="text-slate-400 text-sm mb-4">
              Ha ocurrido un error inesperado. No te preocupes, puedes intentar recargar la página.
            </p>

            {this.state.error && (
              <details className="mb-4">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300">
                  Ver detalles del error
                </summary>
                <pre className="mt-2 p-3 bg-[#0a0a0a] rounded text-xs text-red-300 overflow-auto max-h-48">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar Página
            </button>

            <p className="text-xs text-slate-600 mt-4 text-center">
              Si el problema persiste, contacta al soporte técnico.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
