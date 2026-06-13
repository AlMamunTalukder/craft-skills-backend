import { z } from 'zod';

export const menuSettingsDto = z.object({
    admission: z.boolean().optional(),
    review: z.boolean().optional(),
    exclusive: z.boolean().optional(),
    gift: z.boolean().optional(),
});

export type MenuSettingsDto = z.infer<typeof menuSettingsDto>;
