/**
 * Calendar Utility - Generate Google Calendar links with guest invites
 */

interface CalendarEventParams {
    title: string;
    description: string;
    location: string;
    startTime: string; // ISO String or YYYYMMDDTHHmmSSZ
    endTime: string;
    guestEmail?: string;
}

/**
 * Generates a Google Calendar link
 * @param params Event details
 * @returns Link to create event in Google Calendar
 */
export function generateGoogleCalendarLink(params: CalendarEventParams): string {
    const { title, description, location, startTime, endTime, guestEmail } = params;

    // Format dates for Google: YYYYMMDDTHHmmSS (omit Z to keep local context if needed)
    // or keep Z if it comes from toISOString()
    const fmtStart = startTime.replace(/[-:]/g, '').split('.')[0] + (startTime.endsWith('Z') ? 'Z' : '');
    const fmtEnd = endTime.replace(/[-:]/g, '').split('.')[0] + (endTime.endsWith('Z') ? 'Z' : '');

    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const url = new URL(baseUrl);

    url.searchParams.append('text', title);
    url.searchParams.append('dates', `${fmtStart}/${fmtEnd}`);
    url.searchParams.append('details', description);
    url.searchParams.append('location', location);

    if (guestEmail) {
        url.searchParams.append('add', guestEmail);
    }

    return url.toString();
}

/**
 * Calendar Utilities - Exported as an object to satisfy dependencies
 */
export const calendarUtils = {
    generateGoogleUrl: generateGoogleCalendarLink,
    downloadIcs: (params: CalendarEventParams) => {
        // Basic ICS generation and download
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//NanoClean//NONSGML Event//EN',
            'BEGIN:VEVENT',
            `SUMMARY:${params.title}`,
            `DESCRIPTION:${params.description}`,
            `LOCATION:${params.location}`,
            `DTSTART:${params.startTime.replace(/[-:]/g, '').split('.')[0]}Z`,
            `DTEND:${params.endTime.replace(/[-:]/g, '').split('.')[0]}Z`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', 'agendamento.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
