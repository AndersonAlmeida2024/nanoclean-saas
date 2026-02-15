import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { create } from 'zustand';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error';
}

interface ToastStore {
    toasts: Toast[];
    addToast: (message: string, type: 'success' | 'error') => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (message, type) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 3000);
    },
    removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
    })),
}));

export function ToastContainer() {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-3">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="group flex items-center gap-3 p-4 bg-[#1a1a1a] border border-white/10 rounded-2x shadow-[0_10px_30px_rgba(0,0,0,0.5)] min-w-[300px]"
                    >
                        <div className={toast.type === 'success' ? 'text-emerald-400' : 'text-red-400'}>
                            {toast.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                        </div>
                        <p className="flex-1 text-sm font-bold text-white">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

// Hook de conveniência
export function useToast() {
    const addToast = useToastStore((state) => state.addToast);
    return {
        success: (msg: string) => addToast(msg, 'success'),
        error: (msg: string) => addToast(msg, 'error'),
    };
}
