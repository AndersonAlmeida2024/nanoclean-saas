import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TrialGuard } from '../components/TrialGuard';
import { TrialRibbon } from '../components/TrialRibbon';

export function AppLayout() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-cyan-500/30 flex flex-col">
            <TrialRibbon />

            <div className="flex-1 flex relative">
                <Sidebar />

                <main className="flex-1 pl-0 lg:pl-[280px] pb-[100px] lg:pb-0 transition-[padding] duration-300 relative z-10 w-full min-h-screen">
                    <div className="p-4 md:p-8 max-w-7xl mx-auto">
                        <TrialGuard>
                            <Outlet />
                        </TrialGuard>
                    </div>
                </main>
            </div>
        </div>
    );
}
