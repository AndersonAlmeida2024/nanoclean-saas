import { X, Camera, CheckSquare, AlertTriangle, Calendar, Sofa, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

interface ReportPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: any;
}

export function ReportPreviewModal({ isOpen, onClose, report }: ReportPreviewModalProps) {
    if (!isOpen || !report) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                            <FileText className="text-cyan-400" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Resumo do Laudo</h2>
                            <p className="text-xs text-gray-500 font-medium">Visualização Interna</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <Calendar size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Data</span>
                            </div>
                            <p className="text-white font-bold">{format(new Date(report.created_at), "dd/MM/yyyy")}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <Sofa size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Item</span>
                            </div>
                            <p className="text-white font-bold capitalize">{report.items?.item_type}</p>
                        </div>
                    </div>

                    {/* Checklist */}
                    <div>
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <CheckSquare size={16} /> Problemas Identificados
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {report.items?.issues?.length > 0 ? report.items.issues.map((issue: string) => (
                                <span key={issue} className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
                                    <AlertTriangle size={14} /> {issue}
                                </span>
                            )) : (
                                <span className="text-gray-500 text-sm font-medium italic">Nenhum problema registrado no início do serviço.</span>
                            )}
                        </div>
                    </div>

                    {/* Photos */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Camera size={16} /> Fotos de Antes
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {report.photos_before?.map((url: string, i: number) => (
                                    <img key={i} src={url} className="w-full aspect-square object-cover rounded-xl border border-white/5 shadow-lg" alt="Antes" />
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-black text-cyan-400/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Camera size={16} /> Fotos de Depois
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {report.photos_after?.map((url: string, i: number) => (
                                    <img key={i} src={url} className="w-full aspect-square object-cover rounded-xl border border-cyan-500/20 shadow-lg" alt="Depois" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Signature */}
                    {report.customer_signature && (
                        <div>
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Assinatura do Cliente</h3>
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-center">
                                <img src={report.customer_signature} className="max-h-32 invert brightness-200" alt="Assinatura" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-black/40 flex justify-end">
                    <button
                        onClick={() => {
                            const reportLink = `${window.location.origin}/share/report/${report.id}`;
                            window.open(reportLink, '_blank');
                        }}
                        className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold transition-all border border-white/10 flex items-center gap-2"
                    >
                        <Download size={18} /> Abrir Página Pública
                    </button>
                </div>
            </div>
        </div>
    );
}
