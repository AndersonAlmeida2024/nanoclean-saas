import { CRMPage } from './CRMPage';

/**
 * ⚠️ BLOQUEIO DE SEGURANÇA: NÃO ALTERAR ESTE MENU SEM ORDEM SUPERIOR
 * Página de Vendas (Kanban-only)
 */
export function SalesPage() {
    return <CRMPage forcedView="kanban" />;
}



