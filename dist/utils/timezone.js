"use strict";
// server/utils/timezone.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertUTCToBD = exports.convertBDToUTC = void 0;
const convertBDToUTC = (bdDateString) => {
    // Parse the local datetime string (assumed to be BD time)
    const bdDate = new Date(bdDateString);
    // Subtract 6 hours to convert BD (UTC+6) to UTC
    const utcDate = new Date(bdDate.getTime() - 6 * 60 * 60 * 1000);
    return utcDate;
};
exports.convertBDToUTC = convertBDToUTC;
const convertUTCToBD = (utcDate) => {
    if (!utcDate)
        return '';
    // Convert to Date object if it's a string or number
    let dateObj;
    if (utcDate instanceof Date) {
        dateObj = utcDate;
    }
    else if (typeof utcDate === 'string' || typeof utcDate === 'number') {
        dateObj = new Date(utcDate);
    }
    else {
        return '';
    }
    // Check if valid date
    if (isNaN(dateObj.getTime())) {
        return '';
    }
    // Add 6 hours to convert UTC to BD time
    const bdDate = new Date(dateObj.getTime() + 6 * 60 * 60 * 1000);
    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    const year = bdDate.getFullYear();
    const month = String(bdDate.getMonth() + 1).padStart(2, '0');
    const day = String(bdDate.getDate()).padStart(2, '0');
    const hours = String(bdDate.getHours()).padStart(2, '0');
    const minutes = String(bdDate.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};
exports.convertUTCToBD = convertUTCToBD;
