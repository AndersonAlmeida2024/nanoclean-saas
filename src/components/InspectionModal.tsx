import React, { useState } from 'react';
import {
    X,
    Camera,
    Check,
    AlertTriangle,
    Trash2,
    ChevronRight,
    ChevronLeft,
    Sofa,
    Layout,
    CheckSquare
} from 'lucide-react';
import { SignatureCanvas } from './SignatureCanvas';
import { inspectionService } from '../services/inspectionService';
import { cn } from '../utils/cn';

interface InspectionModalProps {
    appointment: any;
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    readOnly?: boolean;
    initialData?: any;
}

type Step = 'checklist' | 'photos_before' | 'photos_after' | 'signature';

export function InspectionModal({ appointment, isOpen, onClose, onComplete, readOnly, initialData }: InspectionModalProps) {
    const [step, setStep] = useState<Step>('checklist');
    const [isLoading, setIsLoading] = useState(false);

    // Checklist State
    const [itemType, setItemType] = useState<'sofa' | 'rug' | 'chair' | 'other'>(initialData?.items?.item_type || 'sofa');
    const [issues, setIssues] = useState<string[]>(initialData?.items?.issues || []);

    // Photos State
    const [photosBefore, setPhotosBefore] = useState<string[]>(initialData?.photos_before || []);
    const [photosAfter, setPhotosAfter] = useState<string[]>(initialData?.photos_after || []);

    // Signature State
    const [signature, setSignature] = useState<string | null>(initialData?.customer_signature || null);

    const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

    // Sync state with initialData when it changes
    React.useEffect(() => {
        if (initialData) {
            setItemType(initialData.items?.item_type || 'sofa');
            setIssues(initialData.items?.issues || []);
            setPhotosBefore(initialData.photos_before || []);
            setPhotosAfter(initialData.photos_after || []);
            setSignature(initialData.customer_signature || null);
        }
    }, [initialData]);

    if (!isOpen) return null;

    const toggleIssue = (issue: string) => {
        setIssues(prev =>
            prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
        );
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadingPhoto(true);
            try {
                if (!appointment || !appointment.company_id) {
                    console.error('[InspectionModal] Upload failed: Missing appointment.company_id', appointment);
                    alert('Erro: ID da empresa não encontrado no agendamento. Tente recarregar a página.');
                    return;
                }

                // Sanitização do nome do arquivo
                const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                const safeFileName = `${Date.now()}_${type}.${fileExt}`;

                // Path seguro: company_id/appointment_id/type/filename
                const path = `${appointment.company_id}/${appointment.id}/${type}/${safeFileName}`;
                console.log('[InspectionModal] Uploading to path:', path);
                const publicUrl = await inspectionService.uploadPhoto(file, path);

                if (type === 'before') setPhotosBefore(prev => [...prev, publicUrl]);
                else setPhotosAfter(prev => [...prev, publicUrl]);
            } catch (err: any) {
                console.error('[InspectionModal] Full upload error:', err);
                alert(`Erro ao enviar foto: ${err.message || 'Verifique as permissões do storage.'}`);
            } finally {
                setUploadingPhoto(false);
            }
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await inspectionService.save({
                appointment_id: appointment.id,
                company_id: appointment.company_id,
                items: { item_type: itemType, issues },
                photos_before: photosBefore,
                photos_after: photosAfter,
                customer_signature: signature
            });

            onComplete();
            onClose();
        } catch (err) {
            console.error('Erro ao salvar inspeção:', err);
            alert('Erro ao salvar inspeção. Verifique os logs.');
        } finally {
            setIsLoading(false);
        }
    };

    const commonIssues = [
        { id: 'manchas', label: 'Manchas Localizadas', icon: '🍷' },
        { id: 'rasgos', label: 'Rasgos ou Furos', icon: '✂️' },
        { id: 'odores', label: 'Odores (Pet/Urina)', icon: '👃' },
        { id: 'desgaste', label: 'Desgaste Tecido', icon: '🏜️' },
        { id: 'quebrado', label: 'Estrutura Abalada', icon: '🪵' }
    ];

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
            onClick={onClose} // ✅ PHASE 4: Close on backdrop click
        >
            <div
                className="w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] cursor-default"
                onClick={(e) => e.stopPropagation()} // ✅ Prevent closing when clicking modal content
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Layout className="text-cyan-400" size={20} />
                            Ficha de Inspeção
                        </h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                            Agendamento: {appointment.service_type} • {appointment.clients?.name}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Steps Indicator */}
                <div className="flex p-4 gap-2 border-b border-white/5 bg-black/20">
                    {[
                        { id: 'checklist', label: 'Estado', icon: CheckSquare },
                        { id: 'photos_before', label: 'Antes', icon: Camera },
                        { id: 'photos_after', label: 'Depois', icon: Camera },
                        { id: 'signature', label: 'Assinatura', icon: Check }
                    ].map((s) => (
                        <div
                            key={s.id}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all border",
                                step === s.id
                                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                                    : "bg-white/5 border-transparent text-gray-500"
                            )}
                        >
                            <s.icon size={14} />
                            <span className="hidden sm:inline">{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {step === 'checklist' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 block">Tipo de Item</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { id: 'sofa', label: 'Sofá', icon: Sofa },
                                        { id: 'rug', label: 'Tapete', icon: Layout },
                                        { id: 'chair', label: 'Cadeira', icon: CheckSquare },
                                        { id: 'other', label: 'Outro', icon: CheckSquare }
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => !readOnly && setItemType(t.id as any)}
                                            disabled={readOnly}
                                            className={cn(
                                                "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                                                itemType === t.id
                                                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 scale-105"
                                                    : "bg-white/5 border-white/5 text-gray-500 hover:border-white/20",
                                                readOnly && itemType !== t.id && "opacity-30"
                                            )}
                                        >
                                            <t.icon size={24} />
                                            <span className="text-xs font-bold">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 block">Problemas Detectados</label>
                                <div className="space-y-2">
                                    {commonIssues.map((issue) => (
                                        <button
                                            key={issue.id}
                                            onClick={() => !readOnly && toggleIssue(issue.id)}
                                            disabled={readOnly}
                                            className={cn(
                                                "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                                                issues.includes(issue.id)
                                                    ? "bg-purple-500/10 border-purple-500/40 text-purple-400"
                                                    : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10",
                                                readOnly && !issues.includes(issue.id) && "opacity-30"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{issue.icon}</span>
                                                <span className="font-bold">{issue.label}</span>
                                            </div>
                                            {issues.includes(issue.id) && <Check size={20} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'photos_before' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-bold text-white mb-2">Fotos de "Antes"</h3>
                            {!readOnly && (
                                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 hover:bg-white/10 transition-colors group relative overflow-hidden">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={(e) => handlePhotoUpload(e, 'before')}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        {uploadingPhoto ? (
                                            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Camera size={32} className="text-cyan-400" />
                                        )}
                                    </div>
                                    <h3 className="text-white font-bold mb-1">{uploadingPhoto ? 'Enviando...' : 'Tirar Foto (Antes)'}</h3>
                                    <p className="text-xs text-gray-500 font-medium">Capture manchas ou danos pré-existentes</p>
                                </div>
                            )}

                            {photosBefore.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {photosBefore.map((photo, i) => (
                                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group">
                                            <img src={photo} alt="Antes" className="w-full h-full object-cover" />
                                            {!readOnly && (
                                                <button
                                                    onClick={() => setPhotosBefore(prev => prev.filter((_, idx) => idx !== i))}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'photos_after' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-bold text-white mb-2">Fotos de "Depois"</h3>
                            {!readOnly && (
                                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 hover:bg-white/10 transition-colors group relative overflow-hidden">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={(e) => handlePhotoUpload(e, 'after')}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        {uploadingPhoto ? (
                                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Camera size={32} className="text-emerald-400" />
                                        )}
                                    </div>
                                    <h3 className="text-white font-bold mb-1">{uploadingPhoto ? 'Enviando...' : 'Tirar Foto (Depois)'}</h3>
                                    <p className="text-xs text-gray-500 font-medium">Mostre o resultado do seu trabalho!</p>
                                </div>
                            )}

                            {photosAfter.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {photosAfter.map((photo, i) => (
                                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group">
                                            <img src={photo} alt="Depois" className="w-full h-full object-cover" />
                                            {!readOnly && (
                                                <button
                                                    onClick={() => setPhotosAfter(prev => prev.filter((_, idx) => idx !== i))}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 'signature' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            {!readOnly && (
                                <>
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex gap-3">
                                        <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
                                        <p className="text-xs text-yellow-500/90 font-medium leading-relaxed">
                                            Ao assinar, o cliente confirma o estado inicial do item conforme registrado acima.
                                        </p>
                                    </div>
                                    <SignatureCanvas onSave={(base64) => setSignature(base64)} />
                                </>
                            )}

                            {signature && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-3">
                                        <Check className="text-green-500" size={20} />
                                        <p className="text-sm font-bold text-green-500">
                                            {readOnly ? 'Assinatura do Cliente' : 'Assinatura capturada com sucesso!'}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex justify-center">
                                        <img src={signature} className="max-h-40 invert brightness-200" alt="Assinatura" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/5 flex gap-4 bg-black/40">
                    {step !== 'checklist' && (
                        <button
                            onClick={() => {
                                if (step === 'photos_before') setStep('checklist');
                                else if (step === 'photos_after') setStep('photos_before');
                                else if (step === 'signature') setStep('photos_after');
                            }}
                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
                        >
                            <ChevronLeft size={20} /> Voltar
                        </button>
                    )}

                    {step !== 'signature' ? (
                        <button
                            onClick={() => {
                                if (step === 'checklist') setStep('photos_before');
                                else if (step === 'photos_before') setStep('photos_after');
                                else if (step === 'photos_after') setStep('signature');
                            }}
                            className="flex-[2] py-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                        >
                            Próximo <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button
                            disabled={(!signature && !readOnly) || isLoading}
                            onClick={readOnly ? onClose : handleSave}
                            className={cn(
                                "flex-[2] py-4 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100",
                                readOnly ? "bg-white/10 text-white hover:bg-white/20" : "bg-green-500 text-black hover:bg-green-400"
                            )}
                        >
                            {isLoading ? 'Salvando...' : readOnly ? 'Fechar Visualização' : 'Finalizar Inspeção'}
                            {readOnly ? <X size={20} /> : <Check size={20} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
