import { useState, useEffect, useRef } from 'react';
import { X, DollarSign, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { transactionService } from '../../../services/transactionService';
import { useAuthStore } from '../../../stores/authStore';
import { cn } from '../../../utils/cn';
import { z } from 'zod';
import { TRANSACTION_CATEGORIES } from '../constants';
import type { CreateTransactionDTO, TransactionCategory } from '../types/finance.types';
import { format } from 'date-fns';

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// Zod Schema for robust validation
const expenseSchema = z.object({
    description: z.string().min(3, "Descrição muito curta (mín. 3 caracteres)"),
    amount: z.number().min(0.01, "O valor deve ser maior que zero"),
    category: z.string(),
    date: z.string()
});

export function ExpenseModal({ isOpen, onClose, onSuccess }: ExpenseModalProps) {
    const { user, companyId } = useAuthStore();
    const firstInputRef = useRef<HTMLInputElement>(null);

    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSuccess, setIsSuccess] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'combustível' as TransactionCategory,
        date: format(new Date(), 'yyyy-MM-dd'),
    });

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setFormData({
                description: '',
                amount: '',
                category: 'combustível',
                date: format(new Date(), 'yyyy-MM-dd'),
            });
            setFormError(null);
            setFieldErrors({});
            setIsSuccess(false);
            // Auto-focus UX
            setTimeout(() => firstInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const validateForm = () => {
        const result = expenseSchema.safeParse({
            ...formData,
            amount: parseFloat(formData.amount || '0')
        });

        if (!result.success) {
            const errors: Record<string, string> = {};
            // Correctly iterate over Zod errors
            result.error.issues.forEach(issue => {
                if (issue.path[0]) errors[issue.path[0].toString()] = issue.message;
            });
            setFieldErrors(errors);
            return false;
        }
        setFieldErrors({});
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!validateForm()) return;

        try {
            setIsLoading(true);
            setFormError(null);

            const payload: CreateTransactionDTO = {
                type: 'expense',
                amount: parseFloat(formData.amount),
                description: formData.description,
                category: formData.category,
                user_id: user.id,
                company_id: companyId || '',
                date: formData.date
            };

            // Optimistic UX: We assume success for the user but wait for confirmation
            await transactionService.create(payload);

            setIsSuccess(true);

            // Close automatically after brief success feedback
            setTimeout(() => {
                onSuccess(); // Trigger refresh on parent
                onClose();
            }, 1000);

        } catch (err) {
            console.error('Erro ao salvar despesa:', err);
            setFormError('Falha ao conectar com servidor. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl shadow-2xl p-8 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 id="modal-title" className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <DollarSign className="text-red-400" size={24} />
                        </div>
                        <div>
                            <span className="block text-sm text-gray-500 font-medium uppercase tracking-wider">Financeiro</span>
                            <span className="block -mt-1">Nova Despesa</span>
                        </div>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        aria-label="Fechar"
                    >
                        <X size={20} />
                    </button>
                </div>

                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="text-green-400 w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Registrado!</h3>
                        <p className="text-gray-400">Sua despesa foi contabilizada.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Alert Error */}
                        {formError && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
                                <AlertCircle size={18} />
                                {formError}
                            </div>
                        )}

                        {/* Description Input */}
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 font-medium ml-1">Descrição</label>
                            <input
                                ref={firstInputRef}
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Ex: Combustível Hilux, Aluguel..."
                                className={cn(
                                    "w-full bg-white/5 border rounded-xl py-3.5 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 transition-all",
                                    fieldErrors.description
                                        ? "border-red-500/50 focus:ring-red-500/20"
                                        : "border-white/10 focus:border-red-500/50 focus:ring-red-500/10"
                                )}
                            />
                            {fieldErrors.description && (
                                <p className="text-xs text-red-400 ml-1">{fieldErrors.description}</p>
                            )}
                        </div>

                        {/* Amount & Date Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400 font-medium ml-1">Valor (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        inputMode="decimal" // Better mobile keyboard
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0,00"
                                        className={cn(
                                            "w-full bg-white/5 border rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 transition-all font-mono",
                                            fieldErrors.amount
                                                ? "border-red-500/50 focus:ring-red-500/20"
                                                : "border-white/10 focus:border-red-500/50 focus:ring-red-500/10"
                                        )}
                                    />
                                </div>
                                {fieldErrors.amount && (
                                    <p className="text-xs text-red-400 ml-1">{fieldErrors.amount}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-gray-400 font-medium ml-1">Data</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 transition-all [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        {/* Categories Grid */}
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400 font-medium ml-1">Categoria</label>
                            <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                {TRANSACTION_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, category: cat.id })}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#111]",
                                            formData.category === cat.id
                                                ? "bg-red-500/10 border-red-500/50 ring-red-500/20"
                                                : "bg-white/[0.03] border-white/5 hover:bg-white/[0.07] border-transparent hover:border-white/10"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-lg", cat.bgColor, formData.category === cat.id ? "opacity-100" : "opacity-60")}>
                                            <cat.icon size={16} className={cat.color} />
                                        </div>
                                        <span className={cn(
                                            "text-xs font-bold uppercase tracking-wide",
                                            formData.category === cat.id ? "text-white" : "text-gray-400"
                                        )}>
                                            {cat.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || isSuccess}
                            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-bold transition-all shadow-xl shadow-red-900/20 hover:shadow-red-900/40 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Confirmar Despesa
                                    <CheckCircle2 className="w-0 group-hover:w-5 transition-all opacity-0 group-hover:opacity-100" />
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

