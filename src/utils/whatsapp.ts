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
    publicToken: string;
    companyName: string | null | undefined;
}

/**
 * Format WhatsApp inspection report message
 * 
 * @param params - Message parameters
 * @returns Formatted WhatsApp URL
 */
export function formatInspectionMessage(params: InspectionMessageParams): string {
    const { clientName, clientPhone, inspectionId, publicToken, companyName } = params;

    // ✅ Clean protocol selection based on environment
    const protocol = window.location.hostname === 'localhost' ? 'http://' : 'https://';
    const reportLink = `${protocol}${window.location.host}/share/report/${inspectionId}?token=${publicToken}`;

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
 * Get clean report link for sharing
 * 
 * @param inspectionId - Inspection ID
 * @param publicToken - Appointment public token
 * @returns Clean report URL
 */
export function getReportLink(inspectionId: string, publicToken: string): string {
    const protocol = window.location.hostname === 'localhost' ? 'http://' : 'https://';
    return `${protocol}${window.location.host}/share/report/${inspectionId}?token=${publicToken}`;
}
