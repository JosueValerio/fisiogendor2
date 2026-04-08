import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (Component as any) {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      try {
        const parsedError = JSON.parse(error?.message || "{}");
        if (parsedError.error) {
          errorMessage = `Erro de Permissão: ${parsedError.operationType} em ${parsedError.path}`;
        }
      } catch (e) {
        errorMessage = error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
          <div className="bg-surface-container p-8 rounded-3xl border border-white/10 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-primary" size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4">Ops! Algo deu errado</h2>
            <p className="text-on-surface-variant mb-8 leading-relaxed">
              {errorMessage}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 sunset-gradient text-surface rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <RefreshCcw size={18} />
              <span>Recarregar Aplicativo</span>
            </button>
          </div>
        </div>
      );
    }

    return (this.props as any).children;
  }
}
