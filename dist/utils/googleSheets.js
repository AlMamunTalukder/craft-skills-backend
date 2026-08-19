"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendDataToGoogleSheet = void 0;
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
