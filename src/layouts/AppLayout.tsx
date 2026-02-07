import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export function AppLayout() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-cyan-500/30">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/10 blur-[120px]" />
            </div>

            <Sidebar />

            <main className="pl-[280px] transition-[padding] duration-300 relative z-10 w-full min-h-screen">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
