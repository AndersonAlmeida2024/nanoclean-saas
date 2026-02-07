import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../utils/cn';

export function CompanySelector() {
    const { memberships, activeCompanyId, switchCompany } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Encontra a empresa ativa atual na lista
    const activeMembership = memberships.find(m => m.company_id === activeCompanyId);

    // Fecha o dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSwitch = async (companyId: string) => {
        if (companyId === activeCompanyId) return;
        setIsOpen(false);
        try {
            await switchCompany(companyId);
        } catch (err) {
            alert('Erro ao trocar de empresa. Tente novamente.');
        }
    };

    if (memberships.length <= 1) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all",
                    isOpen && "border-cyan-500/50 bg-white/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                )}
            >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                    <Building2 size={16} className="text-cyan-400" />
                </div>

                <div className="text-left hidden md:block">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Unidade Atual</p>
                    <p className="text-sm font-bold text-white truncate max-w-[120px]">
                        {activeMembership?.companies.name || 'Selecionar...'}
                    </p>
                </div>

                <ChevronDown
                    size={16}
                    className={cn("text-gray-400 transition-transform duration-300", isOpen && "rotate-180")}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 top-full mt-2 w-64 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]"
                    >
                        <div className="p-2 space-y-1">
                            {memberships.map((membership) => (
                                <button
                                    key={membership.id}
                                    onClick={() => handleSwitch(membership.company_id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                                        membership.company_id === activeCompanyId
                                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center border transition-colors",
                                        membership.company_id === activeCompanyId
                                            ? "bg-cyan-500/20 border-cyan-500/30"
                                            : "bg-white/5 border-white/10 group-hover:border-white/20"
                                    )}>
                                        {membership.companies?.company_type === 'matrix' ? (
                                            <Building2 size={14} />
                                        ) : (
                                            <Building size={14} />
                                        )}
                                    </div>

                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-bold truncate">{membership.companies?.name || 'Unidade Desconhecida'}</p>
                                        <p className="text-[10px] uppercase tracking-wider opacity-60">
                                            {membership.role} • {membership.companies?.company_type === 'matrix' ? 'Matriz' : 'Filial'}
                                        </p>
                                    </div>

                                    {membership.company_id === activeCompanyId && (
                                        <Check size={16} className="text-cyan-400" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="p-3 bg-white/5 border-t border-white/10">
                            <button className="w-full text-center text-xs text-gray-400 hover:text-cyan-400 transition-colors font-medium">
                                Ver todas as unidades
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
