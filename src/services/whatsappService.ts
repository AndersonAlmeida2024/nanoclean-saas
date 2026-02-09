export const whatsappService = {
    sendInspectionReport(appointment: any, inspection: any, companyName: string = 'NanoClean') {
        const phone = appointment.clients?.phone?.replace(/\D/g, '');
        if (!phone) return;

        const customerName = appointment.clients?.name || 'Cliente';
        const serviceType = appointment.service_type;
        const date = appointment.scheduled_date;

        const issues = inspection.items?.issues || [];
        const issuesText = issues.length > 0
            ? `\n*Observações Detectadas:* \n- ${issues.join('\n- ')}`
            : '\n*Estado Geral:* Nenhum problema prévio detectado.';

        const photosBefore = (inspection.photos_before || []).length > 0
            ? `\n*Fotos de Antes:* ${inspection.photos_before.length} fotos registradas.`
            : '';

        const photosAfter = (inspection.photos_after || []).length > 0
            ? `\n*Fotos de Depois:* ${inspection.photos_after.length} fotos registradas (Resultado final).`
            : '';

        const message = `Olá *${customerName}*! 👋

Sou o técnico da *${companyName}*. Realizei o laudo de inspeção para o seu serviço de *${serviceType}* (${date}).

---
*RESUMO DO LAUDO*:${issuesText}${photosBefore}${photosAfter}
---

Obrigado por escolher a ${companyName}! Garantimos o melhor cuidado para o seu lar. 🧼✨`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, '_blank');
    }
};
