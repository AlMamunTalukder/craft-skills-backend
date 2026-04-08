export const sanitizePhoneNumber = (input: string): string | null => {
    if (!input) return null;

    const banglaToEnglishMap: { [key: string]: string } = {
        '০': '0',
        '১': '1',
        '২': '2',
        '৩': '3',
        '৪': '4',
        '৫': '5',
        '৬': '6',
        '৭': '7',
        '৮': '8',
        '৯': '9',
    };

    // 1. Convert Bengali digits
    const converted = input.replace(/[০-৯]/g, (d) => banglaToEnglishMap[d]);

    // 2. Reject if any English letters exist
    if (/[a-zA-Z]/.test(converted)) return null;

    // 3. Keep only digits
    let digits = converted.replace(/\D/g, '');

    // 4. Normalize prefixes: remove leading '00', '88', or '+'
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.startsWith('88')) digits = digits.slice(2);
    // Note: '+' already removed by \D, but just in case:
    if (digits.startsWith('+')) digits = digits.slice(1);

    // 5. Must be exactly 11 digits and start with '01' followed by 3-9
    if (!/^01[3-9]\d{8}$/.test(digits)) return null;

    // 6. Return with '88' prefix
    return '88' + digits;
};
