import { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function InstallPWA() {
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Detectar se já está rodando como PWA (Standalone)
        const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone;
        setIsStandalone(!!isPWA);

        // Detectar iOS
        const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
        setIsIOS(ios);

        // Capturar evento de instalação no Android/Chrome
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            if (!isPWA) setShowInstallPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // No iOS, mostramos o lembrete se não for PWA
        if (ios && !isPWA) {
            const shownBefore = localStorage.getItem('pwa_prompt_shown');
            if (!shownBefore) {
                setShowInstallPrompt(true);
            }
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowInstallPrompt(false);
        }
        setDeferredPrompt(null);
    };

    const closePrompt = () => {
        setShowInstallPrompt(false);
        localStorage.setItem('pwa_prompt_shown', 'true');
    };

    if (isStandalone || !showInstallPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-24 left-4 right-4 z-[100] bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 p-5 overflow-hidden"
            >
                <button
                    onClick={closePrompt}
                    className="absolute top-2 right-2 p-1 text-slate-500 hover:text-white"
                >
                    <X size={18} />
                </button>

                <div className="flex gap-4">
                    <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/30 text-slate-900 font-bold text-xl">
                        N
                    </div>
                    <div className="flex-1">
                        <h4 className="text-white font-bold leading-tight mb-1">Instalar NanoClean Tech</h4>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            {isIOS
                                ? "Tenha acesso rápido à sua agenda direto da tela de início."
                                : "Economize dados e acesse sua agenda mesmo offline."}
                        </p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                    {isIOS ? (
                        <div className="flex items-center justify-center gap-3 text-sm text-white">
                            <span className="flex items-center gap-1 text-cyan-400 font-bold bg-cyan-400/10 px-2 py-1 rounded-md">
                                <Share size={16} /> Compartilhar
                            </span>
                            <span className="text-slate-500">→</span>
                            <span className="flex items-center gap-1 text-cyan-400 font-bold bg-cyan-400/10 px-2 py-1 rounded-md">
                                <PlusSquare size={16} /> Adicionar à Tela de Início
                            </span>
                        </div>
                    ) : (
                        <button
                            onClick={handleInstallClick}
                            className="w-full py-3 bg-cyan-500 text-slate-900 font-black rounded-xl flex items-center justify-center gap-2 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                        >
                            <Download size={18} />
                            Instalar App do Técnico
                        </button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
