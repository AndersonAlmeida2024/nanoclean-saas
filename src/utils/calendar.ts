/**
 * Utilitários para geração de links de calendário (Google e ICS)
 */

export interface CalendarEvent {
    title: string;
    description: string;
    location: string;
    startTime: string; // ISO String
    endTime: string;   // ISO String
}

export const calendarUtils = {
    /**
     * Gera link para Google Calendar
     */
    generateGoogleUrl(event: CalendarEvent): string {
        const fmt = (date: string) => date.replace(/[-:]/g, '').split('.')[0] + 'Z';
        const start = fmt(event.startTime);
        const end = fmt(event.endTime);

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: event.title,
            dates: `${start}/${end}`,
            details: event.description,
            location: event.location,
        });

        return `https://www.google.com/calendar/render?${params.toString()}`;
    },

    /**
     * Gera conteúdo de arquivo ICS (Apple/Outlook)
     */
    generateIcsContent(event: CalendarEvent): string {
        const fmt = (date: string) => date.replace(/[-:]/g, '').split('.')[0] + 'Z';

        return [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//NanoClean//SaaS//BR',
            'BEGIN:VEVENT',
            `DTSTART:${fmt(event.startTime)}`,
            `DTEND:${fmt(event.endTime)}`,
            `SUMMARY:${event.title}`,
            `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
            `LOCATION:${event.location}`,
            'BEGIN:VALARM',
            'TRIGGER:-P1D',
            'ACTION:DISPLAY',
            'DESCRIPTION:Lembrete de Serviço NanoClean',
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');
    },

    /**
     * Faz o download do arquivo ICS no navegador
     */
    downloadIcs(event: CalendarEvent) {
        const content = this.generateIcsContent(event);
        const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'agendamento-nanoclean.ics');
        document.body.appendChild(link);
        link.click();
        try {
            if (document.body.contains(link)) document.body.removeChild(link);
        } catch (e) {
            console.warn('Failed to remove calendar download link', e);
        } finally {
            window.URL.revokeObjectURL(url);
        }
    }
};
