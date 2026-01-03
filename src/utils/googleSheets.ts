import { google } from 'googleapis';
import config from 'src/config';
import logger from 'src/shared/logger';

const SPREADSHEET_ID = config.GOOGLE_SHEET_ID;

const auth = new google.auth.JWT({
    email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: config.GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const sanitizeTabName = (title: string): string =>
    title.replace(/[:\\/?*\[\]]/g, '').substring(0, 100);

export const appendDataToGoogleSheet = async (
    tabTitle: string,
    headers: string[],
    values: (string | number | null | undefined)[],
): Promise<void> => {
    const sanitizedTitle = sanitizeTabName(tabTitle);
    logger.info(`Attempting to append data to Google Sheet: ${sanitizedTitle}`);

    try {
        logger.info(`Fetching spreadsheet metadata for ID: ${SPREADSHEET_ID}`);
        const meta = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        const existingTabs = meta.data.sheets?.map((s) => s.properties?.title);
        logger.info(`Existing tabs in spreadsheet: ${existingTabs?.join(', ')}`);

        if (!existingTabs?.includes(sanitizedTitle)) {
            logger.info(`Tab "${sanitizedTitle}" not found. Creating it...`);
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

            logger.info(`Tab "${sanitizedTitle}" created. Adding headers...`);
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${sanitizedTitle}!A1`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [headers],
                },
            });
        }

        logger.info(`Appending data row to tab: ${sanitizedTitle}`);
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sanitizedTitle}!A1`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [values],
            },
        });
        logger.info(`Successfully appended data to Google Sheet: ${sanitizedTitle}`);
    } catch (error: any) {
        logger.error(`Error in appendDataToGoogleSheet: ${error.message}`, {
            error,
            tabTitle: sanitizedTitle,
            spreadsheetId: SPREADSHEET_ID,
        });
        throw error;
    }
};
