import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 horas (substitui cacheTime no v5)
            staleTime: 1000 * 60 * 5, // 5 minutos de 'frescor'
            retry: 2,
            refetchOnWindowFocus: false,
        },
    },
});

// Configurar persistência no LocalStorage
const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
});

// Ativar persistência
persistQueryClient({
    queryClient,
    persister: localStoragePersister,
    maxAge: 1000 * 60 * 60 * 24, // 24 horas
});
