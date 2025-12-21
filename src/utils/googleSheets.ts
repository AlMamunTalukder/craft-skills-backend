import { google } from 'googleapis';
import config from 'src/config';

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

    const meta = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
    });

    const existingTabs = meta.data.sheets?.map((s) => s.properties?.title);

    if (!existingTabs?.includes(sanitizedTitle)) {
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

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sanitizedTitle}!A1`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [headers],
            },
        });
    }

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sanitizedTitle}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
            values: [values],
        },
    });
};
