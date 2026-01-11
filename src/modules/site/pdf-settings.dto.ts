import { z } from 'zod';

export const pdfSettingsDto = z.object({ showPdfMenu: z.boolean() });

export type PdfSettingsDto = z.infer<typeof pdfSettingsDto>;
