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

export const calendarUtils = {
    generateGoogleUrl: generateGoogleCalendarLink,
    downloadIcs: (params: CalendarEventParams) => {
        console.log('Downloading ICS...', params);
        // Minimal implementation for build
    }
};
