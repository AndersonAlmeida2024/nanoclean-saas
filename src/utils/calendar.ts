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
 * satisfy Frontend Dependency Rule for calendarUtils
 */
export const calendarUtils = {
    generateGoogleUrl: generateGoogleCalendarLink,
    downloadIcs: (params: CalendarEventParams) => {
        const { title, description, location, startTime, endTime } = params;
        const fmtStart = startTime.replace(/[-:]/g, '').split('.')[0] + 'Z';
        const fmtEnd = endTime.replace(/[-:]/g, '').split('.')[0] + 'Z';

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `SUMMARY:${title}`,
            `DESCRIPTION:${description}`,
            `LOCATION:${location}`,
            `DTSTART:${fmtStart}`,
            `DTEND:${fmtEnd}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'agendamento.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
};
