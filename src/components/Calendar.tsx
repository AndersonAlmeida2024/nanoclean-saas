import React, { useState } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    eachDayOfInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../utils/cn';

interface CalendarProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    appointmentsDates?: string[]; // Array de strings 'YYYY-MM-DD'
    techniciansColors?: Record<string, string[]>; // 'YYYY-MM-DD': ['#color1', '#color2']
}

export function Calendar({ selectedDate, onDateSelect, appointmentsDates = [], techniciansColors = {} }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-3 py-1 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        Hoje
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return (
            <div className="grid grid-cols-7 mb-2">
                {days.map((day) => (
                    <div key={day} className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider py-2">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const calendarDays = eachDayOfInterval({
            start: startDate,
            end: endDate,
        });

        const rows: React.ReactNode[] = [];
        let days: React.ReactNode[] = [];

        calendarDays.forEach((day, i) => {
            const formattedDate = format(day, 'yyyy-MM-dd');
            const hasAppointments = appointmentsDates.includes(formattedDate);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            days.push(
                <div
                    key={day.toString()}
                    onClick={() => onDateSelect(day)}
                    className={cn(
                        "relative flex flex-col items-center justify-center aspect-square cursor-pointer transition-all duration-200 group rounded-xl m-0.5 border border-transparent",
                        !isCurrentMonth ? "text-gray-600 opacity-20" : "text-gray-300",
                        isSelected ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 select-none scale-105 shadow-[0_0_15px_rgba(6,182,212,0.2)]" : "hover:bg-white/5 hover:border-white/10",
                        isToday && !isSelected && "text-white font-black"
                    )}
                >
                    <span className={cn(
                        "text-xs md:text-sm z-10",
                        isToday && !isSelected && "bg-white/10 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full"
                    )}>
                        {format(day, 'd')}
                    </span>

                    {hasAppointments && (
                        <div className="absolute bottom-1.5 flex gap-0.5 justify-center w-full px-1 flex-wrap max-w-[2rem]">
                            {(techniciansColors?.[formattedDate] || ['#06b6d4']).slice(0, 4).map((color, idx) => (
                                <div
                                    key={idx}
                                    className="w-1.5 h-1.5 rounded-full shadow-sm ring-1 ring-black/20"
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                            {(techniciansColors?.[formattedDate]?.length || 0) > 4 && (
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                            )}
                        </div>
                    )}

                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/5 rounded-xl transition-all" />
                </div>
            );

            if ((i + 1) % 7 === 0) {
                rows.push(
                    <div className="grid grid-cols-7" key={day.toString()}>
                        {days}
                    </div>
                );
                days = [];
            }
        });

        return <div className="calendar-grid">{rows}</div>;
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 md:p-6 backdrop-blur-sm">
            {renderHeader()}
            {renderDays()}
            {renderCells()}

            <div className="mt-8 flex items-center justify-between text-xs text-gray-500 border-t border-white/5 pt-6">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500/60" />
                    <span>Destaque: Dias com serviços</span>
                </div>
                <div className="flex items-center gap-2">
                    <CalendarIcon size={14} className="text-gray-600" />
                    <span>Selecione para ver a agenda</span>
                </div>
            </div>
        </div>
    );
}
