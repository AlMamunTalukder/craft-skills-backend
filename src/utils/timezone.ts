// server/utils/timezone.ts
export const convertBDToUTC = (bdDateString: string): Date => {
    // Parse the local datetime string (assumed to be BD time)
    const bdDate = new Date(bdDateString);
    // Subtract 6 hours to convert BD (UTC+6) to UTC
    const utcDate = new Date(bdDate.getTime() - 6 * 60 * 60 * 1000);
    return utcDate;
};

export const convertUTCToBD = (utcDate: Date): string => {
    // Add 6 hours to convert UTC to BD time
    const bdDate = new Date(utcDate.getTime() + 6 * 60 * 60 * 1000);
    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    return bdDate.toISOString().slice(0, 16);
};
