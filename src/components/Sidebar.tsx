// arquivo: src/components/Sidebar.tsx
import { Home, Calendar, Users, DollarSign, GitBranch, Menu, Building, ShieldCheck, LogOut, ClipboardCheck, Zap, Repeat, HardHat, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '../utils/cn';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { CompanySelector } from './CompanySelector';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { MobileMenuSheet } from './MobileMenuSheet';

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { logout, isPlatformAdmin, platformContextLoaded, memberships, activeCompanyId } = useAuthStore();
    const { has_team, plan_tier, notifications } = useCompanySettings();

    // Contexto da empresa ativa para visibilidade de Filiais
    const activeMembership = memberships.find(m => m.company_id === activeCompanyId);
    const isMatrix = activeMembership?.companies?.company_type === 'matrix';
    const isOwnerOrAdmin = activeMembership?.role === 'owner' || activeMembership?.role === 'admin';
    const isTechnician = activeMembership?.role === 'technician';
    const canSeeBranches = isMatrix && isOwnerOrAdmin;

    // Novos itens de menu com rótulos orientados a resultados
    // [LOCK] ITENS DE NAVEGAÇÃO ESTRATÉGICA - NÃO ALTERAR ORDENS OU RÓTULOS
    const NAV_ITEMS = [
        { icon: Home, label: 'Painel', path: '/', showOnMobile: true, showOnDesktop: true },
        { icon: Calendar, label: 'Agenda', path: '/schedule', showOnMobile: true, showOnDesktop: true },
        { icon: Zap, label: 'Vendas', path: '/vendas', showOnMobile: true, showOnDesktop: true, isFAB: true },
        { icon: Users, label: 'Clientes', path: '/clientes', showOnMobile: true, showOnDesktop: true },
        { icon: Repeat, label: 'Reativação', path: '/reativacao', badge: notifications.reactivation_count, showOnMobile: false, showOnDesktop: true },
        { icon: DollarSign, label: 'Financeiro', path: '/finance', showOnMobile: false, showOnDesktop: true },
        { icon: ClipboardCheck, label: 'Portal', path: '/portal', showOnMobile: false, showOnDesktop: true },
    ];

    // Adiciona "Equipe" condicionalmente
    const menuItemsWithTeam = has_team
        ? [...NAV_ITEMS, { icon: HardHat, label: 'Equipe', path: '/equipe', showOnMobile: false, showOnDesktop: true }]
        : NAV_ITEMS;

    const visibleNavItems = menuItemsWithTeam.filter(item => {
        if (isTechnician) {
            // Técnicos veem Painel, Agenda e Portal
            return ['Painel', 'Agenda', 'Portal'].includes(item.label);
        }
        return true;
    });

    const desktopItems = visibleNavItems.filter(item => item.showOnDesktop);

    return (
        <>
            {/* ========== DESKTOP SIDEBAR ========== */}
            <motion.aside
                initial={false}
                animate={{
                    width: isCollapsed ? '80px' : '280px',
                }}
                className="hidden lg:flex flex-col bg-slate-900 border-r border-white/10 h-screen fixed left-0 top-0 z-50 transition-all duration-300"
            >
                {/* Header */}
                <div className="p-6 flex items-center justify-between">
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2"
                        >
                            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center font-bold text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                                N
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight">NanoClean</span>
                        </motion.div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                        aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
                    >
                        <Menu size={20} />
                    </button>
                </div>

                {/* Company Selector (Multi-tenant) */}
                {!isCollapsed && !isPlatformAdmin && (
                    <div className="px-4 pb-4 border-b border-white/10 mb-4">
                        <CompanySelector />
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {!platformContextLoaded ? (
                        Array(4).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 animate-pulse">
                                <div className="w-5 h-5 rounded bg-white/10" />
                                {!isCollapsed && <div className="h-4 bg-white/10 rounded w-24" />}
                            </div>
                        ))
                    ) : (
                        <>
                            {desktopItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        cn(
                                            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative',
                                            isActive
                                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        )
                                    }
                                >
                                    <item.icon size={20} className="shrink-0" />
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="font-medium"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}

                                    {/* Badge de notificação */}
                                    {item.badge && item.badge > 0 && !isCollapsed && (
                                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                                            {item.badge}
                                        </span>
                                    )}
                                </NavLink>
                            ))}

                            {canSeeBranches && (
                                <NavLink
                                    to="/branches"
                                    className={({ isActive }) => cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-white/5 hover:text-white',
                                        isActive && 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                    )}
                                >
                                    <GitBranch size={20} className="shrink-0" />
                                    {!isCollapsed && <span className="font-medium">Filiais</span>}
                                </NavLink>
                            )}

                            {isPlatformAdmin && !isCollapsed && (
                                <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    Admin Platform
                                </div>
                            )}

                            {isPlatformAdmin && (
                                <>
                                    <NavLink
                                        to="/admin/companies"
                                        className={({ isActive }) => cn(
                                            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-white/5 hover:text-white',
                                            isActive && 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                        )}
                                    >
                                        <Building size={20} className="shrink-0" />
                                        {!isCollapsed && <span className="font-medium">Empresas</span>}
                                    </NavLink>
                                    <NavLink
                                        to="/admin/audit"
                                        className={({ isActive }) => cn(
                                            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-white/5 hover:text-white',
                                            isActive && 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                        )}
                                    >
                                        <ShieldCheck size={20} className="shrink-0" />
                                        {!isCollapsed && <span className="font-medium">Auditoria</span>}
                                    </NavLink>
                                </>
                            )}
                        </>
                    )}
                </nav>

                {/* Footer: Plano e Logout */}
                <div className="mt-auto border-t border-white/10">
                    {!isCollapsed && (
                        <div className="p-4">
                            <div className="flex items-center gap-3 px-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                                    <Users size={14} className="text-slate-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white">Minha Empresa</span>
                                    <span className="text-[10px] text-slate-500 capitalize">
                                        {has_team ? `Plano ${plan_tier}` : 'Plano Solo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="p-4 space-y-1">
                        <NavLink
                            to="/configuracoes"
                            className={({ isActive }) => cn(
                                'w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-all duration-200',
                                isActive && 'bg-white/5 text-white',
                                isCollapsed && 'justify-center'
                            )}
                            title="Configurações"
                        >
                            <Settings size={20} />
                            {!isCollapsed && <span className="font-medium">Configurações</span>}
                        </NavLink>

                        <button
                            onClick={logout}
                            className={cn(
                                'w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200',
                                isCollapsed && 'justify-center'
                            )}
                            title="Sair"
                        >
                            <LogOut size={20} />
                            {!isCollapsed && <span className="font-medium">Sair</span>}
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* ========== MOBILE BOTTOM NAVIGATION ========== */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-6 py-2 pb-safe flex justify-between items-end z-50 h-[80px]">

                {/* Início */}
                <NavLink
                    to="/"
                    className={({ isActive }) => cn(
                        "flex flex-col items-center gap-1 mb-3 transition-colors",
                        isActive ? "text-cyan-400" : "text-slate-300"
                    )}
                >
                    <Home size={22} strokeWidth={2} />
                    <span className="text-[10px] font-medium">Início</span>
                </NavLink>

                {/* Agenda */}
                <NavLink
                    to="/schedule"
                    className={({ isActive }) => cn(
                        "flex flex-col items-center gap-1 mb-3 transition-colors",
                        isActive ? "text-cyan-400" : "text-slate-300"
                    )}
                >
                    <Calendar size={22} strokeWidth={2} />
                    <span className="text-[10px] font-medium">Agenda</span>
                </NavLink>

                {/* FAB CENTRAL - Vendas */}
                <div className="relative -top-5">
                    <NavLink to="/vendas">
                        {({ isActive }) => (
                            <div className={cn(
                                "w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-transform active:scale-95 border-4 border-slate-900",
                                isActive ? "bg-cyan-400 text-slate-900" : "bg-cyan-500 text-white"
                            )}>
                                <Zap size={26} fill="currentColor" />
                            </div>
                        )}
                    </NavLink>
                </div>

                {/* Clientes */}
                <NavLink
                    to="/clientes"
                    className={({ isActive }) => cn(
                        "flex flex-col items-center gap-1 mb-3 transition-colors",
                        isActive ? "text-cyan-400" : "text-slate-300"
                    )}
                >
                    <Users size={22} strokeWidth={2} />
                    <span className="text-[10px] font-medium">Clientes</span>
                </NavLink>

                {/* Menu "Mais" */}
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="text-slate-300 hover:text-cyan-400 flex flex-col items-center gap-1 mb-3 transition-colors"
                >
                    <div className="relative">
                        <Menu size={22} />
                        {/* Bolinha de notificação se houver itens pendentes */}
                        {/* Removed: {notifications.reactivation_count > 0 && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-slate-900 animate-pulse" />
                        )} */}
                    </div>
                    <span className="text-[10px] font-medium">Menu</span>
                </button>
            </div>

            {/* Mobile Menu Sheet */}
            <MobileMenuSheet
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />
        </>
    );
}
