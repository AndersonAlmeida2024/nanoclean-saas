import { useMemo } from 'react';
import { addDays, isAfter } from 'date-fns';

export interface ForecastData {
    totalScheduled: number;
    projectedRevenue: number;
    conversionRate: number;
    nextSevenDays: number;
    nextThirtyDays: number;
}

export function useForecast(appointments: any[]) {

    const forecast = useMemo(() => {
        const now = new Date();
        const sevenDaysFromNow = addDays(now, 7);
        const thirtyDaysFromNow = addDays(now, 30);

        // Filter future appointments
        const futureAppointments = appointments.filter(apt => {
            if (!apt.scheduled_date) return false;
            const aptDate = new Date(apt.scheduled_date);
            return isAfter(aptDate, now) && apt.status === 'scheduled';
        });

        // Calculate historical conversion rate (scheduled -> completed)
        const historicalScheduled = appointments.filter(a => a.status === 'scheduled' || a.status === 'completed').length;
        const historicalCompleted = appointments.filter(a => a.status === 'completed').length;
        const conversionRate = historicalScheduled > 0 ? historicalCompleted / historicalScheduled : 0.85; // Default 85%

        // Calculate revenue for next 7 and 30 days
        const next7Days = futureAppointments.filter(apt => {
            const aptDate = new Date(apt.scheduled_date);
            return aptDate <= sevenDaysFromNow;
        });

        const next30Days = futureAppointments.filter(apt => {
            const aptDate = new Date(apt.scheduled_date);
            return aptDate <= thirtyDaysFromNow;
        });

        const revenue7Days = next7Days.reduce((sum, apt) => sum + (Number(apt.price) || 0), 0);
        const revenue30Days = next30Days.reduce((sum, apt) => sum + (Number(apt.price) || 0), 0);

        return {
            totalScheduled: futureAppointments.length,
            projectedRevenue: revenue30Days * conversionRate,
            conversionRate: conversionRate * 100,
            nextSevenDays: revenue7Days * conversionRate,
            nextThirtyDays: revenue30Days * conversionRate,
        };
    }, [appointments]);

    return forecast;
}
