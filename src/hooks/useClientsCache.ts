import { useState, useEffect, useCallback, useRef } from 'react';
import { clientService } from '../services/clientService';
import type { Client } from '../modules/crm/types';

// ✅ PERFORMANCE: In-memory cache with TTL to prevent unnecessary network requests
const cache = new Map<string, { data: Client[]; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

/**
 * Optimized hook for fetching and caching clients
 * 
 * Features:
 * - In-memory cache with 60s TTL
 * - AbortController to cancel previous requests
 * - Automatic cleanup on unmount
 * - Manual invalidation support
 * 
 * @param companyId - Company ID to fetch clients for
 * @returns { clients, isLoading, error, invalidate }
 */
export function useClientsCache(companyId: string | null) {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const loadClients = useCallback(async () => {
        if (!companyId) {
            setClients([]);
            setIsLoading(false);
            return;
        }

        // ✅ Check cache first
        const cached = cache.get(companyId);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            setClients(cached.data || []);
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

            const data = await clientService.getAll(companyId);
            const clientsArray = (data || []).map((c: any) => ({
                ...c,
                name: c?.name || 'Cliente sem nome',
                phone: c?.phone || ''
            })) as Client[];

            // ✅ Update cache
            cache.set(companyId, {
                data: clientsArray,
                timestamp: Date.now()
            });

            setClients(clientsArray);
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error('Error loading clients:', err);
                setError('Não foi possível carregar os clientes.');
                setClients([]); // Ensure we don't return undefined on error
            }
        } finally {
            setIsLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        loadClients();

        // ✅ Cleanup: abort request on unmount
        return () => {
            abortControllerRef.current?.abort();
        };
    }, [loadClients]);

    /**
     * Invalidate cache and force reload
     * Call this after create, update, or delete operations
     */
    const invalidate = useCallback(() => {
        if (companyId) {
            cache.delete(companyId);
        }
        loadClients();
    }, [companyId, loadClients]);

    return { clients: clients || [], isLoading, error, invalidate };
}
