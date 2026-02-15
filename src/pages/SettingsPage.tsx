import { useState } from 'react';
import { Settings, Users, Percent, ChevronRight, Shield, Bell } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuthStore } from '../stores/authStore';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { TechnicianForm } from '../components/TechnicianForm';
import { UserProfileModal } from '../components/UserProfileModal';

export function SettingsPage() {
    const { user } = useAuthStore();
    const { has_team, loading, refetch: refetchSettings } = useCompanySettings();
    const [isTechFormOpen, setIsTechFormOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    // Seções de configuração
    const sections = [
        { icon: Shield, label: 'Segurança e Senha', desc: 'Gerencie seu acesso' },
        { icon: Bell, label: 'Notificações', desc: 'Alertas de agenda e vendas' },
        { icon: Percent, label: 'Taxas e Serviços', desc: 'Defina preços base' },
    ];

    if (has_team) {
        sections.unshift({
            icon: Users,
            label: 'Gestão de Equipe',
            desc: 'Gerencie técnicos e comissões',
            // @ts-ignore
            onClick: () => window.location.href = '/equipe'
        });
    }

    return (
        <div className="min-h-screen pb-20 p-4 md:p-8">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/10">
                    <Settings size={24} className="text-cyan-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Configurações</h1>
                    <p className="text-sm text-slate-400">Personalize sua experiência NanoClean</p>
                </div>
            </div>

            <div className="max-w-4xl space-y-6">
                {/* HEAD: Perfil */}
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-cyan-500/20">
                        {user?.user_metadata?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-xl font-bold text-white">{user?.user_metadata?.name}</h2>
                        <p className="text-slate-400">{user?.email}</p>
                        <span className="inline-block mt-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20">
                            Administrador
                        </span>
                    </div>
                    <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
                    >
                        Editar Perfil
                    </button>
                </div>

                {/* GATILHO PROGRESSIVE DISCLOSURE: TEAM MODE */}
                {!has_team && !loading && (
                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-1 shadow-lg shadow-cyan-500/20">
                        <div className="bg-slate-900 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                            {/* Background Effect */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0 z-10">
                                <Users size={32} className="text-blue-400" />
                            </div>

                            <div className="flex-1 text-center md:text-left z-10">
                                <h3 className="text-lg font-bold text-white mb-1">Crescendo a equipe?</h3>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    Cadastre seu primeiro técnico para liberar funções de <span className="text-cyan-400 font-bold">comissão automática</span> e <span className="text-cyan-400 font-bold">agenda múltipla</span>.
                                </p>
                            </div>

                            <button
                                onClick={() => setIsTechFormOpen(true)}
                                className="w-full md:w-auto px-6 py-3 bg-white text-slate-900 font-black rounded-xl hover:bg-slate-200 transition-colors shadow-xl z-10 flex items-center justify-center gap-2"
                            >
                                <Users size={18} />
                                Cadastrar Técnico
                            </button>
                        </div>
                    </div>
                )}

                {/* Lista de Configurações Gerais */}
                <div className="grid md:grid-cols-2 gap-4">
                    {sections.map((item, idx) => (
                        <div
                            key={idx}
                            // @ts-ignore
                            onClick={item.onClick}
                            className={cn(
                                "bg-slate-900 border border-white/10 rounded-xl p-4 flex items-center gap-4 transition-colors group cursor-pointer",
                                // @ts-ignore
                                item.onClick ? "hover:border-white/20 hover:bg-white/5" : "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                                <item.icon size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white text-sm">{item.label}</h4>
                                <p className="text-xs text-slate-500">{item.desc}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-600" />
                        </div>
                    ))}
                </div>
            </div>

            {isTechFormOpen && (
                <TechnicianForm
                    isFirstTechnician={true}
                    onClose={() => setIsTechFormOpen(false)}
                    onSuccess={() => {
                        refetchSettings();
                        // Redirecionar para a página de equipe para ver o card
                        window.location.href = '/equipe';
                    }}
                />
            )}

            {isProfileModalOpen && (
                <UserProfileModal
                    onClose={() => setIsProfileModalOpen(false)}
                    currentProfile={{
                        address_base: user?.user_metadata?.address_base,
                        pix_key: user?.user_metadata?.pix_key
                    }}
                />
            )}
        </div>
    );
}
