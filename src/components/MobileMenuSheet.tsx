import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Repeat, HardHat, Settings, LogOut, HelpCircle, Megaphone } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { useAuthStore } from '../stores/authStore';
import { useEffect } from 'react';

interface MobileMenuSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileMenuSheet({ isOpen, onClose }: MobileMenuSheetProps) {
    const { has_team, notifications } = useCompanySettings();
    const { logout } = useAuthStore();

    // Acessibilidade: Fecha com ESC
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Previne scroll do body quando aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const secondaryMenuItems = [
        {
            name: 'Relatórios', // Mapeado para Financeiro
            icon: DollarSign,
            href: '/finance',
            badge: 0
        },
        {
            name: 'Marketing', // Mapeado para Reativação
            icon: Megaphone,
            href: '/reativacao',
            badge: notifications.reactivation_count
        },
        // Item condicional: só aparece se tiver equipe
        ...(has_team ? [{
            name: 'Equipe',
            icon: HardHat,
            href: '/equipe',
            badge: 0
        }] : []),
        {
            name: 'Ajustes',
            icon: Settings,
            href: '/configuracoes',
            badge: 0
        },
        {
            name: 'Ajuda',
            icon: HelpCircle,
            href: 'https://wa.me/5511999999999', // Placeholder
            badge: 0,
            external: true
        }
    ];

    const handleLogout = () => {
        onClose();
        logout();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay com backdrop blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Sheet deslizando de baixo */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl border-t border-white/10 z-[101] max-h-[85vh] overflow-y-auto"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Menu secundário"
                    >
                        {/* Header do Sheet */}
                        <div className="sticky top-0 bg-slate-900 border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                            <h2 className="text-lg font-bold text-white">Menu</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white transition-colors"
                                aria-label="Fechar menu"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Lista de itens */}
                        <nav className="p-6 space-y-2">
                            {secondaryMenuItems.map((item) => (
                                item.external ? (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={onClose}
                                        className="flex items-center gap-4 px-4 py-4 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all duration-200"
                                    >
                                        <item.icon size={22} className="shrink-0" />
                                        <span className="font-medium text-base">{item.name}</span>
                                    </a>
                                ) : (
                                    <NavLink
                                        key={item.href}
                                        to={item.href}
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            cn(
                                                'flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 group relative',
                                                isActive
                                                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                            )
                                        }
                                    >
                                        <item.icon size={22} className="shrink-0" />
                                        <span className="font-medium text-base">{item.name}</span>

                                        {/* Badge de notificação */}
                                        {item.badge > 0 && (
                                            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                {item.badge}
                                            </span>
                                        )}
                                    </NavLink>
                                )
                            ))}

                            {/* Separator */}
                            <div className="h-px bg-white/10 my-4" />

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-200"
                            >
                                <LogOut size={22} className="shrink-0" />
                                <span className="font-medium text-base">Sair</span>
                            </button>
                        </nav>

                        {/* Indicador de "arraste para fechar" */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full" />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
