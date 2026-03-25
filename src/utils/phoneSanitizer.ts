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

    // 1. Convert Bengali to English
    let converted = input.replace(/[০-৯]/g, (d) => banglaToEnglishMap[d]);

    // 2. REJECT if any English letters exist (e.g., 'o', 'x', etc.)
    if (/[a-zA-Z]/.test(converted)) {
        return null;
    }

    // 3. Keep only digits (Removes +, -, spaces, brackets)
    let pureNumbers = converted.replace(/\D/g, '');

    // 4. Bangladesh Formatting
    if (pureNumbers.startsWith('01') && pureNumbers.length === 11) {
        pureNumbers = '88' + pureNumbers;
    }

    return pureNumbers;
};
