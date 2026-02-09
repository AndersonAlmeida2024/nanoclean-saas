import { useAuthStore } from '../stores/authStore';
import { differenceInDays, parseISO } from 'date-fns';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

export function TrialRibbon() {
    const { company } = useAuthStore();

    if (!company || company.subscription_status !== 'trial') return null;

    const trialEndDate = company.trial_ends_at ? parseISO(company.trial_ends_at) : null;
    if (!trialEndDate) return null;

    const daysLeft = differenceInDays(trialEndDate, new Date());
    const isExpired = daysLeft < 0;

    return (
        <div className={cn(
            "w-full px-6 py-2 flex items-center justify-between text-sm font-bold animate-in slide-in-from-top duration-500 z-[60]",
            isExpired
                ? "bg-red-600 text-white"
                : daysLeft <= 3
                    ? "bg-amber-500 text-black"
                    : "bg-cyan-600 text-white"
        )}>
            <div className="flex items-center gap-3">
                <AlertCircle size={18} className={cn(!isExpired && "animate-pulse")} />
                <span>
                    {isExpired
                        ? 'Seu período de teste expirou. Assine agora para continuar usando.'
                        : `Você está no período de teste: restam ${daysLeft} dias.`}
                </span>
            </div>

            <button className="flex items-center gap-1 hover:underline group">
                {isExpired ? 'Ver Planos' : 'Assinar Plano Profissional'}
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}
