import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 text-center animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                        <AlertCircle className="text-red-500" size={40} />
                    </div>

                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                        Ops! Algo <span className="text-red-500">travou</span>
                    </h2>

                    <p className="text-gray-400 mb-8 max-w-md leading-relaxed">
                        Ocorreu um erro inesperado na renderização deste módulo. Não se preocupe, seus dados estão seguros.
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                        >
                            <RefreshCw size={18} />
                            Tentar Recarregar
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all"
                        >
                            <Home size={18} />
                            Voltar ao Início
                        </button>
                    </div>

                    {import.meta.env.DEV && this.state.error && (
                        <div className="mt-8 p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-left max-w-2xl w-full overflow-auto">
                            <p className="text-red-400 font-mono text-xs uppercase mb-2 font-bold">Log de Erro:</p>
                            <pre className="text-red-300/60 font-mono text-[10px] leading-tight whitespace-pre-wrap">
                                {this.state.error.toString()}
                            </pre>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
