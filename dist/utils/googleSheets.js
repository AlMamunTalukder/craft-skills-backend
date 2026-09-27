"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRowsByColumnValue = exports.appendDataToGoogleSheet = void 0;
const googleapis_1 = require("googleapis");
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../shared/logger"));
const SPREADSHEET_ID = config_1.default.GOOGLE_SHEET_ID;
const auth = new googleapis_1.google.auth.JWT({
    email: config_1.default.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: config_1.default.GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
const sanitizeTabName = (title) => title.replace(/[:\\/?*\[\]]/g, '').substring(0, 100);
const columnToLetter = (col) => {
    let letters = '';
    let n = col;
    while (n > 0) {
        const rem = (n - 1) % 26;
        letters = String.fromCharCode(65 + rem) + letters;
        n = Math.floor((n - 1) / 26);
    }
    return letters;
};
const appendDataToGoogleSheet = async (tabTitle, headers, values, options) => {
    const sanitizedTitle = sanitizeTabName(tabTitle);
    logger_1.default.info(`Attempting to append data to Google Sheet: ${sanitizedTitle}`);
    try {
        logger_1.default.info(`Fetching spreadsheet metadata for ID: ${SPREADSHEET_ID}`);
        const meta = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });
        const existingTabs = meta.data.sheets?.map((s) => s.properties?.title);
        logger_1.default.info(`Existing tabs in spreadsheet: ${existingTabs?.join(' + " " + ')}`);
        if (!existingTabs?.includes(sanitizedTitle)) {
            logger_1.default.info(`Tab "${sanitizedTitle}" not found. Creating it...`);
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                requestBody: {
                    requests: [
                        {
                            addSheet: {
                                properties: { title: sanitizedTitle },
                            },
                        },
                    ],
                },
            });
            logger_1.default.info(`Tab "${sanitizedTitle}" created. Adding headers...`);
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${sanitizedTitle}!A1`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [headers],
                },
            });
        }
        else if (options?.dedupColumn !== undefined &&
            options.dedupValue !== undefined) {
            // Idempotent append: skip if the dedup value already exists in the column.
            const col = columnToLetter(options.dedupColumn);
            const existing = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `${sanitizedTitle}!${col}2:${col}`,
            });
            const existingValues = (existing.data.values || [])
                .flat()
                .map((v) => String(v));
            if (existingValues.includes(String(options.dedupValue))) {
                logger_1.default.info(`Row already exists in "${sanitizedTitle}", skipping append`);
                return;
            }
        }
        logger_1.default.info(`Appending data row to tab: ${sanitizedTitle}`);
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sanitizedTitle}!A1`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [values],
            },
        });
        logger_1.default.info(`Successfully appended data to Google Sheet: ${sanitizedTitle}`);
    }
    catch (error) {
        logger_1.default.error({
            error,
            tabTitle: sanitizedTitle,
            spreadsheetId: SPREADSHEET_ID,
        }, `Error in appendDataToGoogleSheet: ${error.message}`);
        throw error;
    }
};
exports.appendDataToGoogleSheet = appendDataToGoogleSheet;
// Normalize a phone for matching: Bengali digits → English, digits only,
// then last 10 digits (8801712345678 and 01712345678 both → 1712345678).
const normalizePhoneForMatch = (input) => {
    const banglaToEnglish = {
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
        '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    };
    const converted = String(input || '').replace(/[০-৯]/g, (d) => banglaToEnglish[d]);
    const digits = converted.replace(/\D/g, '');
    if (digits.length < 10)
        return digits;
    return digits.slice(-10);
};
// 🧹 Physical delete: remove every data row in `tabTitle` whose 1-based
// `columnIndex` cell matches `matchValue` (phone-aware). Used to clean a
// retry-success phone out of the Failed tab. Returns removed row count.
const deleteRowsByColumnValue = async (tabTitle, columnIndex, matchValue) => {
    const sanitizedTitle = sanitizeTabName(tabTitle);
    const target = normalizePhoneForMatch(matchValue);
    if (!target || target.length < 10) {
        logger_1.default.warn(`deleteRowsByColumnValue: invalid match value for "${sanitizedTitle}"`);
        return 0;
    }
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = meta.data.sheets?.find((s) => s.properties?.title === sanitizedTitle);
    const sheetId = sheet?.properties?.sheetId;
    if (sheetId == null) {
        logger_1.default.info(`Tab "${sanitizedTitle}" not found, nothing to delete`);
        return 0;
    }
    const col = columnToLetter(columnIndex);
    const existing = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sanitizedTitle}!${col}2:${col}`,
    });
    const rows = existing.data.values || [];
    // 1-based row numbers (row 1 = header). Descending so deletes don't shift indices.
    const rowsToDelete = rows
        .map((r, i) => ({ row: i + 2, match: normalizePhoneForMatch(String(r?.[0] ?? '')) }))
        .filter((r) => r.match === target)
        .map((r) => r.row)
        .sort((a, b) => b - a);
    if (rowsToDelete.length === 0) {
        logger_1.default.info(`No matching rows in "${sanitizedTitle}" for cleanup`);
        return 0;
    }
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
            requests: rowsToDelete.map((row) => ({
                deleteDimension: {
                    range: { sheetId, dimension: 'ROWS', startIndex: row - 1, endIndex: row },
                },
            })),
        },
    });
    logger_1.default.info(`Deleted ${rowsToDelete.length} row(s) from "${sanitizedTitle}"`);
    return rowsToDelete.length;
};
exports.deleteRowsByColumnValue = deleteRowsByColumnValue;
