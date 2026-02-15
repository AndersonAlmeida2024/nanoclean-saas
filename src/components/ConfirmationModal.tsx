import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { create } from 'zustand';

interface Confirmation {
    id: string;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
}

interface ConfirmationStore {
    confirmation: Confirmation | null;
    confirm: (options: Omit<Confirmation, 'id'>) => void;
    close: () => void;
}

export const useConfirmationStore = create<ConfirmationStore>((set) => ({
    confirmation: null,
    confirm: (options) => {
        set({ confirmation: { ...options, id: Math.random().toString() } });
    },
    close: () => set({ confirmation: null }),
}));

export function ConfirmationModal() {
    const { confirmation, close } = useConfirmationStore();

    if (!confirmation) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={close}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden"
                >
                    {/* Glow effect */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full" />

                    <div className="flex flex-col items-center text-center">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${confirmation.type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-cyan-500/10 text-cyan-400'
                            }`}>
                            <AlertTriangle size={32} />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">{confirmation.title}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-8">
                            {confirmation.message}
                        </p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => {
                                    confirmation.onCancel?.();
                                    close();
                                }}
                                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl font-bold transition-all text-sm uppercase tracking-widest"
                            >
                                {confirmation.cancelText || 'Cancelar'}
                            </button>
                            <button
                                onClick={() => {
                                    confirmation.onConfirm();
                                    close();
                                }}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all text-sm uppercase tracking-widest ${confirmation.type === 'danger'
                                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                                        : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                    }`}
                            >
                                {confirmation.confirmText || 'Confirmar'}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={close}
                        className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// Hook de conveniência
export function useConfirm() {
    return useConfirmationStore((state) => state.confirm);
}
