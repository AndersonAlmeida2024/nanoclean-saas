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

    const loadAppointments = useCallback(async () => {
        setIsLoading(true); // ✅ RESET IMEDIATO: Impede flash de dados antigos

        if (!companyId) {
            setAppointments([]);
            setIsLoading(false);
            return;
        }

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const cacheKey = `${companyId}-${dateStr}`;

        // ✅ Check cache after reset
        const cached = cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            setAppointments(cached.data || []);
            setIsLoading(false);
            setError(null);
            return;
        }

        // ✅ Abort previous request if still pending
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        try {
            setIsLoading(true);
            setError(null);

            const data = await appointmentService.getByDate(dateStr, companyId);
            const appointmentsArray = data || [];

            // ✅ Update cache
            cache.set(cacheKey, {
                data: appointmentsArray,
                timestamp: Date.now()
            });

            setAppointments(appointmentsArray);
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Error loading appointments:', err);
                setError('Não foi possível carregar os agendamentos.');
                setAppointments([]); // Ensure safe state
            }
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate, companyId]);

    useEffect(() => {
        loadAppointments();

        // ✅ Cleanup: abort request on unmount
        return () => {
            abortControllerRef.current?.abort();
        };
    }, [loadAppointments]);

    /**
     * Invalidate cache and force reload
     * Call this after create, update, or delete operations
     */
    const invalidate = useCallback(() => {
        if (companyId) {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const cacheKey = `${companyId}-${dateStr}`;
            cache.delete(cacheKey);
        }
        loadAppointments();
    }, [selectedDate, companyId, loadAppointments]);

    /**
     * Invalidate entire cache for this company
     * Use when data changes might affect multiple dates
     */
    const invalidateAll = useCallback(() => {
        if (companyId) {
            // Clear all cache entries for this company
            Array.from(cache.keys())
                .filter(key => key.startsWith(companyId))
                .forEach(key => cache.delete(key));
        }
        loadAppointments();
    }, [companyId, loadAppointments]);

    return { appointments: appointments || [], isLoading, error, invalidate, invalidateAll };
}
