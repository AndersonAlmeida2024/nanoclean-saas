import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Sofa,
    Camera,
    Download,
    CheckSquare,
    AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export function ReportPublicPage() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        async function fetchReport() {
            try {
                if (!token) throw new Error('Token de acesso ausente.');

                // Hardening: Usando RPC em vez de select direto para evitar Mass Listing Leaks e validar token
                const { data, error } = await supabase
                    .rpc('get_public_inspection', {
                        p_inspection_id: id,
                        p_token: token
                    });

                if (error) throw error;
                if (!data) throw new Error('Laudo não encontrado ou acesso negado.');

                setReport(data);
            } catch (err: any) {
                console.error('Error fetching report:', err);
                setError('Este laudo não foi encontrado ou está inacessível.');
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchReport();
    }, [id, token]);

    const handlePrint = () => window.print();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="text-red-500 mb-4" size={48} />
                <h1 className="text-2xl font-bold text-white mb-2">Ops! Laudo não encontrado</h1>
                <p className="text-gray-400 max-w-sm mb-8">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black font-sans pb-20 print:pb-0">
            {/* Header / Logo Section */}
            <div className="bg-[#111] text-white p-8 flex flex-col items-center mb-8 print:bg-white print:text-black print:mb-4">
                <div className="w-12 h-12 bg-gradient-to-tr from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg print:hidden">
                    <Sparkles className="text-white" size={24} />
                </div>
                <h1 className="text-xl font-black tracking-tighter">NANOCLEAN</h1>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1 font-bold">Relatório Técnico Digital</p>
            </div>

            <div className="max-w-xl mx-auto px-6 space-y-8 print:space-y-4">
                {/* Intro */}
                <div className="border-l-4 border-cyan-500 pl-4 py-2">
                    <h2 className="text-2xl font-black tracking-tight">{report.appointments?.service_type || 'Limpeza Especializada'}</h2>
                    <p className="text-gray-500 font-medium">Prezado(a) {report.appointments?.clients?.name}, confira abaixo os detalhes da higienização realizada.</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <Calendar size={14} />
                            <span className="text-[10px] font-black uppercase">Data</span>
                        </div>
                        <p className="text-sm font-bold">{format(new Date(report.created_at), "dd/MM/yyyy")}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                            <Sofa size={14} />
                            <span className="text-[10px] font-black uppercase">Item</span>
                        </div>
                        <p className="text-sm font-bold capitalize">{report.items?.item_type}</p>
                    </div>
                </div>

                {/* Checklist Section */}
                <div>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <CheckSquare size={16} /> Estado Inicial & Observações
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {report.items?.issues?.length > 0 ? report.items.issues.map((issue: string) => (
                            <span key={issue} className="bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                                <AlertTriangle size={14} /> {issue}
                            </span>
                        )) : (
                            <span className="bg-green-50 text-green-600 border border-green-100 px-3 py-1.5 rounded-full text-xs font-bold">
                                <CheckCircle2 size={14} className="inline mr-2" /> Sem danos detectados
                            </span>
                        )}
                    </div>
                </div>

                {/* Photos Comparison */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Camera size={16} /> Antes da Limpeza
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {report.photos_before?.map((url: string, i: number) => (
                                <img key={i} src={url} alt="Antes" className="w-full aspect-square object-cover rounded-2xl border border-gray-100 shadow-sm" />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Camera size={16} className="text-cyan-500" /> Depois da Limpeza
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {report.photos_after?.map((url: string, i: number) => (
                                <img key={i} src={url} alt="Depois" className="w-full aspect-square object-cover rounded-2xl border border-cyan-100 shadow-sm ring-2 ring-cyan-50" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Signature */}
                <div className="pt-8 border-t border-gray-100 flex flex-col items-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-4 text-center tracking-widest">Confirmação do Cliente</p>
                    {report.customer_signature && (
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 w-full flex justify-center">
                            <img src={report.customer_signature} alt="Assinatura" className="max-h-32 grayscale brightness-75" />
                        </div>
                    )}
                    <p className="text-xs text-gray-500 mt-4 font-medium italic">Assinado digitalmente via NanoClean Platform</p>
                </div>

                {/* Footer Action */}
                <div className="pt-12 text-center print:hidden">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-black text-sm tracking-tight hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gray-200"
                    >
                        <Download size={18} /> BAIXAR RELATÓRIO PDF
                    </button>
                    <p className="text-gray-400 text-[10px] mt-6 font-bold uppercase tracking-widest">
                        A NanoClean agradece a confiança! 💙
                    </p>
                </div>
            </div>
        </div>
    );
}
