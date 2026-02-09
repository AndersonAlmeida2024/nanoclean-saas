import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { Sparkles, CreditCard, ShieldAlert, ArrowRight } from 'lucide-react';

interface TrialGuardProps {
    children: React.ReactNode;
}

export function TrialGuard({ children }: TrialGuardProps) {
    const { company, isPlatformAdmin } = useAuthStore();

    // Admins da plataforma não são bloqueados pelo trial
    if (isPlatformAdmin) return <>{children}</>;

    if (!company) return <>{children}</>;

    const isExpired = company.subscription_status === 'expired';

    if (isExpired) {
        return (
            <div className="relative min-h-[calc(100vh-64px)] overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md">
                {/* Visual Block Content */}
                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60">
                    <div className="max-w-md w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                            <ShieldAlert size={40} className="text-white animate-pulse" />
                        </div>

                        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                            Trial <span className="text-cyan-400">Expirado</span>
                        </h2>

                        <p className="text-gray-400 mb-8 leading-relaxed">
                            Seu período de teste de 15 dias chegou ao fim. Para continuar transformando seu negócio com a NanoClean, escolha um plano agora.
                        </p>

                        <div className="space-y-3">
                            <button className="w-full py-4 bg-white text-black rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95">
                                <CreditCard size={20} />
                                Assinar Plano VIP
                            </button>

                            <button className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                Falar com Consultor
                                <ArrowRight size={18} />
                            </button>
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
                            <Sparkles size={14} className="text-cyan-500" />
                            <span>NanoClean SaaS • Professional Edition</span>
                        </div>
                    </div>
                </div>

                {/* Content with Blur behind the guard */}
                <div className="opacity-20 pointer-events-none filter blur-sm">
                    {children}
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
