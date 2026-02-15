import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface Activity {
    time: string;
    title: string;
    desc: string;
    color: 'cyan' | 'green' | 'purple' | 'yellow';
}

interface ActivityFeedProps {
    activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                <p className="text-gray-500 font-medium">Nenhuma atividade recente</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-2 bottom-2 w-px bg-white/10" />

            {activities.map((activity, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative pl-10 group"
                >
                    {/* Timeline Dot */}
                    <div className={cn(
                        "absolute left-[13px] top-1.5 w-2 h-2 rounded-full ring-4 ring-[#0a0a0a] transition-all group-hover:scale-125",
                        activity.color === 'cyan' && "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]",
                        activity.color === 'green' && "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]",
                        activity.color === 'purple' && "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]",
                        activity.color === 'yellow' && "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]",
                    )} />

                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">
                        {activity.time}
                    </span>

                    <h5 className="text-white font-bold group-hover:text-cyan-400 transition-colors">
                        {activity.title}
                    </h5>

                    <p className="text-gray-500 text-sm mt-0.5 leading-relaxed font-medium">
                        {activity.desc}
                    </p>
                </motion.div>
            ))}

            <button className="w-full py-4 mt-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-sm font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest">
                Ver todo histórico
            </button>
        </div>
    );
}
