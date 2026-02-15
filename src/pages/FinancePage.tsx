import { useState, useEffect, useMemo, useCallback } from 'react';
import { FinanceStats } from '../modules/finance/components/FinanceStats';
import { FinanceChart } from '../modules/finance/components/FinanceChart';
import { ExpenseModal } from '../modules/finance/components/ExpenseModal';
import { CommissionsTab } from '../modules/finance/components/CommissionsTab';
import { Download, Plus, Filter, FileText, ChevronDown, Calendar, X, Calculator, Loader2, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { transactionService } from '../services/transactionService';
import { cn } from '../utils/cn';
import { format, startOfDay, startOfMonth, startOfYear, subMonths, subDays, isWithinInterval, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction, FinanceStatsData } from '../modules/finance/types/finance.types';
import { getCategoryMetadata } from '../modules/finance/constants';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/Toast';
import { withTimeout } from '../utils/withTimeout';

export function FinancePage() {
    const toast = useToast();
    const { companyId } = useAuthStore();
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

    // Date Filters
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: startOfMonth(new Date()),
        end: endOfDay(new Date())
    });
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [activePreset, setActivePreset] = useState<string>('Este Mês');
    const [activeTab, setActiveTab] = useState<'movimentacoes' | 'comissoes'>('movimentacoes');

    const loadData = useCallback(async () => {
        if (!companyId) return;
        try {
            setIsLoading(true);
            setError(null);
            const data = await withTimeout(
                transactionService.getAll(companyId),
                10000,
                'Timeout ao carregar transações'
            );
            setTransactions((data as unknown as Transaction[]) || []);
        } catch (err) {
            console.error('Erro ao carregar finanças:', err);
            setError(err instanceof Error ? err.message : 'Não foi possível carregar os dados financeiros. Verifique sua conexão.');
        } finally {
            setIsLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Memoized Filter Logic
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            if (!t.created_at) return false;
            const date = new Date(t.created_at);
            return isWithinInterval(date, {
                start: startOfDay(dateRange.start),
                end: endOfDay(dateRange.end)
            });
        });
    }, [transactions, dateRange]);

    const setPreset = (label: string, start: Date, end: Date) => {
        setDateRange({ start, end });
        setActivePreset(label);
        setIsDatePickerOpen(false);
    };

    const datePresets = [
        { label: 'Hoje', start: startOfDay(new Date()), end: endOfDay(new Date()) },
        { label: 'Ontem', start: startOfDay(subDays(new Date(), 1)), end: endOfDay(subDays(new Date(), 1)) },
        { label: 'Últimos 7 dias', start: startOfDay(subDays(new Date(), 7)), end: endOfDay(new Date()) },
        { label: 'Últimos 30 dias', start: startOfDay(subDays(new Date(), 30)), end: endOfDay(new Date()) },
        { label: 'Este Mês', start: startOfMonth(new Date()), end: endOfDay(new Date()) },
        { label: 'Mês Passado', start: startOfMonth(subMonths(new Date(), 1)), end: endOfDay(subDays(startOfMonth(new Date()), 1)) },
        { label: 'Este Ano', start: startOfYear(new Date()), end: endOfDay(new Date()) },
    ];

    // Memoized Stats Calculation
    const stats: FinanceStatsData = useMemo(() => {
        const result = filteredTransactions.reduce((acc, t) => {
            const amount = Number(t.amount) || 0;
            if (t.type === 'income') acc.totalIncome += amount;
            else acc.totalExpenses += amount;
            return acc;
        }, { totalIncome: 0, totalExpenses: 0, balance: 0, avgTicket: 0 });

        result.balance = result.totalIncome - result.totalExpenses;
        const incomeCount = filteredTransactions.filter(t => t.type === 'income').length;
        result.avgTicket = incomeCount > 0 ? result.totalIncome / incomeCount : 0;

        return result;
    }, [filteredTransactions]);

    const handleExportPDF = () => {
        try {
            if (filteredTransactions.length === 0) {
                toast.error('Nenhuma movimentação para exportar neste período.');
                return;
            }

            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.setTextColor(40);
            doc.text('Relatório Financeiro NanoClean', 14, 22);

            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Período: ${format(dateRange.start, 'dd/MM/yyyy')} até ${format(dateRange.end, 'dd/MM/yyyy')} | Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

            // Stats Summary
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(`Total Receitas: R$ ${stats.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, 40);
            doc.text(`Total Despesas: R$ ${stats.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, 47);
            doc.text(`Saldo Final: R$ ${stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, 54);

            const tableHeaders = [['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)']];
            const tableRows = filteredTransactions.map(t => [
                format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
                t.type === 'income' ? 'Receita' : 'Despesa',
                t.description,
                getCategoryMetadata(t.category).label, // Using centralized label
                `R$ ${Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            ]);

            autoTable(doc, {
                head: tableHeaders,
                body: tableRows,
                startY: 65,
                theme: 'striped',
                headStyles: { fillColor: [0, 180, 216], textColor: 255 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { top: 65 },
            });

            doc.save(`financeiro_nanoclean_${activePreset.toLowerCase().replace(/ /g, '_')}.pdf`);
            setIsExportDropdownOpen(false);

        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
        }
    };

    const handleExportReport = () => {
        try {
            if (filteredTransactions.length === 0) {
                toast.error('Nenhuma movimentação para exportar neste período.');
                return;
            }

            const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)'];
            const rows = filteredTransactions.map(t => [
                format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
                t.type === 'income' ? 'Receita' : 'Despesa',
                t.description,
                getCategoryMetadata(t.category).label,
                Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
            ]);

            const csvContent = [
                headers.join(';'),
                ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
            ].join('\r\n');

            const fileName = `financeiro_nanoclean_${activePreset.toLowerCase().replace(/ /g, '_')}.csv`;
            const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                try {
                    if (document.body.contains(link)) document.body.removeChild(link);
                } catch (e) {
                    console.warn('Failed to remove export link', e);
                } finally {
                    window.URL.revokeObjectURL(url);
                }
            }, 10000);

            setIsExportDropdownOpen(false);

        } catch (error) {
            console.error('Erro ao exportar relatório:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 bg-white/5 border border-white/10 rounded-3xl">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="text-red-500" size={32} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Ops! Algo deu errado</h2>
                <p className="text-gray-400 max-w-sm mb-8">{error}</p>
                <button
                    onClick={() => loadData()}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all active:scale-95"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Financeiro Elite
                    </h1>
                    <p className="text-gray-400 mt-1">Sua contabilidade automatizada 📊</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 active:scale-95 duration-200"
                    >
                        <Plus size={18} />
                        Registrar Gasto
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                        >
                            <Download size={18} className="text-cyan-400" />
                            Relatório
                            <ChevronDown size={14} className={cn("transition-transform", isExportDropdownOpen && "rotate-180")} />
                        </button>

                        {isExportDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <button
                                    onClick={handleExportPDF}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-300 transition-colors border-b border-white/5"
                                >
                                    <FileText size={16} className="text-red-400" />
                                    Baixar PDF
                                </button>
                                <button
                                    onClick={handleExportReport}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-300 transition-colors border-b border-white/5"
                                >
                                    <Download size={16} className="text-green-400" />
                                    Baixar CSV (Excel)
                                </button>
                                <button
                                    onClick={() => {
                                        const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)'];
                                        const rows = filteredTransactions.map(t => [
                                            format(new Date(t.created_at), 'dd/MM/yyyy HH:mm'),
                                            t.type === 'income' ? 'Receita' : 'Despesa',
                                            t.description,
                                            getCategoryMetadata(t.category).label,
                                            Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                                        ]);
                                        const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
                                        navigator.clipboard.writeText(content);
                                        // Could use a toast here instead of alert
                                        toast.success('Dados copiados! Você pode colar direto no Excel.');
                                        setIsExportDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-300 transition-colors"
                                >
                                    <Calculator size={16} className="text-cyan-400" />
                                    Copiar Dados
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Meta-style Date Range Picker */}
            <div className="relative">
                <button
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all group"
                >
                    <div className="p-2 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                        <Calendar size={20} className="text-cyan-400" />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-none mb-1">Período Selecionado</p>
                        <p className="flex items-center gap-2">
                            {activePreset === 'Customizado'
                                ? `${format(dateRange.start, 'dd MMM')} - ${format(dateRange.end, 'dd MMM')}`
                                : activePreset}
                            <ChevronDown size={14} className={cn("text-gray-500 transition-transform", isDatePickerOpen && "rotate-180")} />
                        </p>
                    </div>
                </button>

                {isDatePickerOpen && (
                    <div className="absolute left-0 mt-3 w-[450px] bg-[#121212] border border-white/10 rounded-3xl shadow-2xl z-50 p-6 flex gap-6 animate-in fade-in slide-in-from-top-4 duration-200">
                        {/* Presets Sidebar */}
                        <div className="w-40 flex flex-col gap-1 border-r border-white/5 pr-4">
                            <p className="text-[10px] text-gray-600 font-bold uppercase mb-2">Sugestões</p>
                            {datePresets.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => setPreset(preset.label, preset.start, preset.end)}
                                    className={cn(
                                        "text-left px-3 py-2 rounded-xl text-sm transition-all",
                                        activePreset === preset.label
                                            ? "bg-cyan-500/10 text-cyan-400 font-bold"
                                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Range */}
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] text-gray-600 font-bold uppercase">Intervalo Personalizado</p>
                                <button onClick={() => setIsDatePickerOpen(false)} className="text-gray-500 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Início</label>
                                    <input
                                        type="date"
                                        value={format(dateRange.start, 'yyyy-MM-dd')}
                                        onChange={(e) => {
                                            const newStart = e.target.value ? new Date(e.target.value + 'T00:00:00') : new Date();
                                            setDateRange(prev => ({ ...prev, start: newStart }));
                                            setActivePreset('Customizado');
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Fim</label>
                                    <input
                                        type="date"
                                        value={format(dateRange.end, 'yyyy-MM-dd')}
                                        onChange={(e) => {
                                            const newEnd = e.target.value ? new Date(e.target.value + 'T23:59:59') : new Date();
                                            setDateRange(prev => ({ ...prev, end: newEnd }));
                                            setActivePreset('Customizado');
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => setIsDatePickerOpen(false)}
                                className="w-full bg-white text-black font-black py-3 rounded-xl text-sm hover:bg-gray-200 transition-colors mt-4"
                            >
                                Aplicar Intervalo
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 bg-white/5 border border-white/10 rounded-2xl p-1 mb-6">
                <button
                    onClick={() => setActiveTab('movimentacoes')}
                    className={cn(
                        "flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all",
                        activeTab === 'movimentacoes'
                            ? "bg-white text-black shadow-lg"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                >
                    Movimentações
                </button>
                <button
                    onClick={() => setActiveTab('comissoes')}
                    className={cn(
                        "flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all",
                        activeTab === 'comissoes'
                            ? "bg-white text-black shadow-lg"
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                >
                    Comissões
                </button>
            </div>

            {activeTab === 'comissoes' ? (
                <CommissionsTab />
            ) : (
                <>
                    <FinanceStats stats={stats} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <FinanceChart
                                period={activePreset === 'Customizado'
                                    ? `${format(dateRange.start, 'dd/MM')} - ${format(dateRange.end, 'dd/MM')}`
                                    : activePreset}
                                transactions={filteredTransactions}
                            />

                            {/* Insights Card */}
                            <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-6 shadow-2xl">
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                    Consultoria Financeira Elite
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Seu faturamento está <span className="text-green-400 font-bold">saudável</span>.
                                    Dica do Time: Analisando seus custos, você pode economizar comprando em volume trimestral categorias como <span className="text-white">Produtos de Limpeza</span>.
                                </p>
                            </div>
                        </div>

                        {/* Right Column: Transactions */}
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-white px-2">Fluxo de Caixa</h3>
                                <Filter size={18} className="text-gray-500" />
                            </div>

                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {isLoading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="animate-spin text-cyan-500" size={32} />
                                    </div>
                                ) : filteredTransactions.length === 0 ? (
                                    <div className="text-center py-12 text-gray-600">
                                        <p className="text-sm">Nenhuma movimentação neste período.</p>
                                    </div>
                                ) : (
                                    filteredTransactions.map((t) => {
                                        const metadata = getCategoryMetadata(t.category);
                                        const Icon = metadata.icon;

                                        return (
                                            <div key={t.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "p-2.5 rounded-lg border transition-colors",
                                                        metadata.bgColor,
                                                        "border-transparent group-hover:border-white/10"
                                                    )}>
                                                        <Icon size={18} className={metadata.color} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight line-clamp-1">{t.description}</p>
                                                        <p className="text-[10px] text-gray-500 font-medium">
                                                            {t.created_at ? format(new Date(t.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR }) : 'Data indefinida'} • <span className="capitalize">{metadata.label}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={cn(
                                                    "text-sm font-black whitespace-nowrap",
                                                    t.type === 'income' ? "text-green-400" : "text-red-400"
                                                )}>
                                                    {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                </>
            )}

            <ExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSuccess={loadData}
            />
        </div>
    );
}
