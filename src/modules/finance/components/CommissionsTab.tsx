import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { transactionService } from '../../../services/transactionService';
import { useAuthStore } from '../../../stores/authStore';
import { useToast } from '../../../components/Toast';
import { cn } from '../../../utils/cn';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction } from '../types/finance.types';

interface TechnicianSummary {
    technicianId: string;
    technicianName: string;
    totalPending: number;
    totalPaid: number;
    pendingCount: number;
    transactions: Transaction[];
}

export function CommissionsTab() {
    const { companyId } = useAuthStore();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [summaries, setSummaries] = useState<TechnicianSummary[]>([]);
    const [expandedTechnician, setExpandedTechnician] = useState<string | null>(null);

    useEffect(() => {
        if (companyId) loadCommissions();
    }, [companyId]);

    async function loadCommissions() {
        try {
            setIsLoading(true);

            // 1. Buscar todos os técnicos da empresa
            const { data: technicians, error: techError } = await supabase
                .from('technicians')
                .select('id, name')
                .eq('company_id', companyId);

            if (techError) throw techError;

            // 2. Buscar todas as transações de comissão
            const { data: transactions, error: transError } = await supabase
                .from('transactions')
                .select('*')
                .eq('company_id', companyId)
                .eq('category', 'Comissão')
                .order('created_at', { ascending: false });

            if (transError) throw transError;

            // 3. Agrupar dados
            const groupedData: TechnicianSummary[] = technicians.map(tech => {
                const techTransactions = transactions?.filter(t => t.technician_id === tech.id) || [];

                const pending = techTransactions
                    .filter(t => t.status === 'pending')
                    .reduce((acc, t) => acc + Number(t.amount), 0);

                const paid = techTransactions
                    .filter(t => t.status === 'paid')
                    .reduce((acc, t) => acc + Number(t.amount), 0);

                const pendingCount = techTransactions.filter(t => t.status === 'pending').length;

                return {
                    technicianId: tech.id,
                    technicianName: tech.name,
                    totalPending: pending,
                    totalPaid: paid,
                    pendingCount,
                    transactions: techTransactions
                };
            }).filter(s => s.transactions.length > 0); // Mostrar apenas técnicos com movimentação

            setSummaries(groupedData);

        } catch (error) {
            console.error('Erro ao carregar comissões:', error);
            toast.error('Erro ao carregar dados de comissões');
        } finally {
            setIsLoading(false);
        }
    }

    async function handlePayAll(technicianId: string) {
        if (!confirm('Confirmar pagamento de todas as comissões pendentes deste técnico?')) return;

        try {
            const summary = summaries.find(s => s.technicianId === technicianId);
            if (!summary) return;

            const pendingIds = summary.transactions
                .filter(t => t.status === 'pending')
                .map(t => t.id);

            await transactionService.payCommissions(pendingIds);

            toast.success('Comissões marcadas como pagas!');
            loadCommissions(); // Recarregar dados
        } catch (error) {
            console.error('Erro ao pagar comissões:', error);
            toast.error('Erro ao processar pagamento');
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-cyan-500" size={32} />
            </div>
        );
    }

    if (summaries.length === 0) {
        return (
            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl border-dashed">
                <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Nenhuma comissão registrada</h3>
                <p className="text-gray-400">As comissões aparecerão aqui quando os serviços forem concluídos.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {summaries.map((summary) => (
                <div key={summary.technicianId} className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
                    {/* Technician Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center border border-yellow-500/20">
                                <DollarSign className="text-yellow-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white">{summary.technicianName}</h3>
                                <p className="text-sm text-gray-500">{summary.transactions.length} registros no total</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setExpandedTechnician(expandedTechnician === summary.technicianId ? null : summary.technicianId)}
                            className="bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                        >
                            {expandedTechnician === summary.technicianId ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                        </button>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                            <p className="text-gray-400 text-xs uppercase font-bold mb-1">Pendente</p>
                            <p className="text-2xl font-black text-yellow-400">R$ {summary.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <p className="text-xs text-gray-500 mt-1">{summary.pendingCount} serviços a pagar</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                            <p className="text-gray-400 text-xs uppercase font-bold mb-1">Pago</p>
                            <p className="text-2xl font-black text-green-400">R$ {summary.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <p className="text-xs text-gray-500 mt-1">Total liquidado</p>
                        </div>
                    </div>

                    {/* Pay Button */}
                    {summary.totalPending > 0 && (
                        <button
                            onClick={() => handlePayAll(summary.technicianId)}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-900/20 active:scale-95 transition-all mb-4 flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={20} />
                            Marcar Tudo Como Pago (R$ {summary.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                        </button>
                    )}

                    {/* Transactions List (Expandable) */}
                    {expandedTechnician === summary.technicianId && (
                        <div className="mt-4 space-y-2 animate-in slide-in-from-top-2 fade-in">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Histórico de Comissões</h4>
                            {summary.transactions.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            t.status === 'paid' ? "bg-green-500" : "bg-yellow-500"
                                        )} />
                                        <div>
                                            <p className="text-sm font-bold text-white">{t.description}</p>
                                            <p className="text-[10px] text-gray-500">
                                                {format(new Date(t.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white">R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        <span className={cn(
                                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block mt-1",
                                            t.status === 'paid' ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                                        )}>
                                            {t.status === 'paid' ? 'Pago' : 'Pendente'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
