import { useState, useEffect, useCallback, useRef } from 'react';
import { appointmentService } from '../services/appointmentService';
import { format } from 'date-fns';

// ✅ PERFORMANCE: In-memory cache with TTL to prevent unnecessary network requests
const cache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

/**
 * Optimized hook for fetching and caching appointments by date
 * 
 * Features:
 * - In-memory cache with 60s TTL
 * - AbortController to cancel previous requests
 * - Automatic cleanup on unmount
 * - Manual invalidation support
 * 
 * @param selectedDate - Date to fetch appointments for
 * @param companyId - Company ID to fetch appointments for
 * @returns { appointments, isLoading, error, invalidate }
 */
export function useAppointmentsCache(selectedDate: Date, companyId: string | null) {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // ✅ Memoize date string to prevent unnecessary effect triggers
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const loadAppointments = useCallback(async (isSilent = false) => {
        // Se não for silencioso, limpamos o estado anterior e mostramos loading
        if (!isSilent) {
            setIsLoading(true);
            setAppointments([]); // Limpa dados fantasmas do dia anterior
        }

        if (!companyId) {
            setAppointments([]);
            setIsLoading(false);
            return;
        }

        const cacheKey = `${companyId}-${dateStr}`;

        // ✅ Check cache (only if not a silent refresh/invalidation)
        if (!isSilent) {
            const cached = cache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
                setAppointments(cached.data || []);
                setIsLoading(false);
                setError(null);
                return;
            }
        }

        // Cancel previous request
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setError(null);
            // Pass the REAL signal to the service and Supabase
            const data = await appointmentService.getByDate(dateStr, companyId, controller.signal);

            // Only update if this request wasn't aborted
            if (!controller.signal.aborted) {
                const appointmentsArray = data || [];
                cache.set(cacheKey, {
                    data: appointmentsArray,
                    timestamp: Date.now()
                });
                setAppointments(appointmentsArray);
                setIsLoading(false);
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Error loading appointments:', err);
                setError('Não foi possível carregar os agendamentos.');
                setIsLoading(false);
            }
        }
        // DELETED finally: Loading state is handled precisely inside try/catch to avoid race conditions
    }, [dateStr, companyId]);

    useEffect(() => {
        loadAppointments();
        return () => {
            abortControllerRef.current?.abort();
        };
    }, [loadAppointments]);

    const invalidate = useCallback(() => {
        if (companyId) {
            cache.delete(`${companyId}-${dateStr}`);
        }
        return loadAppointments(true); // Silent refresh
    }, [dateStr, companyId, loadAppointments]);

    const invalidateAll = useCallback(() => {
        if (companyId) {
            Array.from(cache.keys())
                .filter(key => key.startsWith(companyId))
                .forEach(key => cache.delete(key));
        }
        return loadAppointments(true);
    }, [companyId, loadAppointments]);

    return { appointments: appointments || [], isLoading, error, invalidate, invalidateAll };
}
