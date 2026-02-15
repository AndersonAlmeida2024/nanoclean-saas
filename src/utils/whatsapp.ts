/**
 * WhatsApp Utility - Clean URL formatting and message generation
 * 
 * Handles:
 * - Protocol selection (http for localhost, https for production)
 * - Company name injection from authStore
 * - URL encoding for proper link formatting
 */

interface InspectionMessageParams {
    clientName: string;
    clientPhone: string;
    inspectionId: string;
    itemType?: string; // ✅ Adicionado para o link amigável
    companyName: string | null | undefined;
}

/**
 * Auxiliar para criar slugs amigáveis (remove acentos, espaços e caracteres especiais)
 */
function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD') // Decompõe caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
        .replace(/\s+/g, '-') // Substitui espaços por -
        .replace(/[^\w-]+/g, '') // Remove caracteres não-alfanuméricos
        .replace(/--+/g, '-'); // Remove hífens duplicados
}

/**
 * Format WhatsApp inspection report message
 * 
 * @param params - Message parameters
 * @returns Formatted WhatsApp URL
 */
export function formatInspectionMessage(params: InspectionMessageParams): string {
    const { clientName, clientPhone, inspectionId, companyName, itemType } = params;

    // ✅ Clean protocol selection based on environment
    const protocol = window.location.hostname === 'localhost' ? 'http://' : 'https://';

    // ✅ Novo padrão amigável: /laudo/nome-cliente/tipo-item/id
    const clientSlug = slugify(clientName || 'cliente');
    const itemSlug = slugify(itemType || 'inspecao');

    const reportLink = `${protocol}${window.location.host}/laudo/${clientSlug}/${itemSlug}/${inspectionId}`;

    // ✅ Company name with safe fallback
    const coName = companyName || 'nossa empresa';

    // ✅ Clean message formatting
    const message = encodeURIComponent(
        `Olá ${clientName}! Aqui está o laudo digital da limpeza realizada hoje pela *${coName}*. ` +
        `Você pode ver as fotos do antes/depois e todos os detalhes aqui: ${reportLink}`
    );

    // ✅ WhatsApp URL (remove all non-digits from phone)
    const cleanPhone = clientPhone.replace(/\D/g, '');

    return `https://wa.me/${cleanPhone}?text=${message}`;
}

/**
 * Format WhatsApp confirmation reminder for the next day
 * 
 * @param params - Message parameters
 * @returns Formatted WhatsApp URL
 */
export function formatReminderMessage(params: { clientName: string; clientPhone: string; time: string; serviceType: string }): string {
    const { clientName, clientPhone, time, serviceType } = params;

    const message = encodeURIComponent(
        `Olá ${clientName}! Passando para confirmar seu atendimento de *${serviceType}* amanhã às *${time}*. 🧼✨ Podemos confirmar?`
    );

    const cleanPhone = clientPhone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${message}`;
}

/**
 * Get clean report link for sharing
 * 
 * @param inspectionId - Inspection ID
 * @returns Clean report URL
 */
export function getReportLink(inspectionId: string): string {
    const protocol = window.location.hostname === 'localhost' ? 'http://' : 'https://';
    return `${protocol}${window.location.host}/share/report/${inspectionId}`;
}
