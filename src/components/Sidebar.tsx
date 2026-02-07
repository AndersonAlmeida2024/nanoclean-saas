// arquivo: src/components/Sidebar.tsx
import { Home, Calendar, Users, DollarSign, Menu, LogOut, GitBranch, Building, ShieldCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '../utils/cn';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { CompanySelector } from './CompanySelector';

const NAV_ITEMS = [
    { icon: Home, label: 'Painel', path: '/' },
    { icon: Calendar, label: 'Agenda', path: '/schedule' },
    { icon: Users, label: 'Clientes (CRM)', path: '/crm' },
    { icon: DollarSign, label: 'Financeiro', path: '/finance' },
    { icon: GitBranch, label: 'Filiais', path: '/branches' },
];

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { logout, isPlatformAdmin, platformContextLoaded } = useAuthStore();

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? '80px' : '280px' }}
            className="h-screen bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col fixed left-0 top-0 z-50 transition-all duration-300"
        >
            {/* Header */}
            <div className="p-6 flex items-center justify-between">
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-bold text-2xl bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent"
                    >
                        NanoClean
                    </motion.div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                    <Menu size={20} />
                </button>
            </div>

            {/* Unidade Selector (Seletor Multi-tenant) */}
            {!isCollapsed && !isPlatformAdmin && (
                <div className="px-4 pb-4 border-b border-white/10 mb-4 animate-in slide-in-from-top-2 duration-500">
                    <CompanySelector />
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2">
                {!platformContextLoaded ? (
                    // Skeleton Loader
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 animate-pulse">
                            <div className="w-5 h-5 rounded bg-white/10" />
                            {!isCollapsed && <div className="h-4 bg-white/10 rounded w-24" />}
                        </div>
                    ))
                ) : isPlatformAdmin ? (
                    // Platform Admin Menu
                    <>
                        <NavLink
                            to="/admin/companies"
                            className={({ isActive }) => cn(
                                'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:bg-white/5 hover:text-white',
                                isActive && 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-white border border-white/10'
                            )}
                        >
                            <Building size={20} className="shrink-0" />
                            {!isCollapsed && <span className="font-medium">Empresas</span>}
                        </NavLink>
                        <NavLink
                            to="/admin/audit"
                            className={({ isActive }) => cn(
                                'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:bg-white/5 hover:text-white',
                                isActive && 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-white border border-white/10'
                            )}
                        >
                            <ShieldCheck size={20} className="shrink-0" />
                            {!isCollapsed && <span className="font-medium">Auditoria</span>}
                        </NavLink>
                    </>
                ) : (
                    // Business (Tenant) Menu
                    NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative',
                                    isActive
                                        ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-white border border-white/10'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
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
                        </NavLink>
                    ))
                )}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={logout}
                    className={cn(
                        'w-full flex items-center gap-4 px-4 py-3 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all duration-200',
                        isCollapsed && 'justify-center'
                    )}
                >
                    <LogOut size={20} />
                    {!isCollapsed && <span className="font-medium">Sair</span>}
                </button>
            </div>
        </motion.aside>
    );
}
